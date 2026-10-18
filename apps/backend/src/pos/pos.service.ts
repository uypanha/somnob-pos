import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PosCheckoutDto } from './dto/pos-checkout.dto';
import {
  PricingTier,
  PaymentMethod,
  OrderStatus,
  PaymentStatus,
  OrderType,
  MovementType,
  WholesaleStatus,
} from '@somnob/shared';
import { roundToDecimal, roundKhr, convertUsdToKhr, convertKhrToUsd, calculateChange } from '@somnob/shared';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class PosService {
  constructor(private readonly prisma: PrismaService) {}

  async checkout(cashierUserId: string, dto: PosCheckoutDto) {
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('Order must contain at least one item');
    }

    // 1. Idempotency Check: Return existing completed order if already processed
    const existingPayment = await this.prisma.payment.findUnique({
      where: { idempotencyKey: dto.idempotencyKey },
      include: { order: true },
    });

    if (existingPayment) {
      return this.getReceipt(existingPayment.orderId);
    }

    // 2. Fetch Store & Exchange Rate
    const store = await this.prisma.store.findUnique({
      where: { id: dto.storeId },
      include: { exchangeRates: true },
    });

    if (!store) {
      throw new NotFoundException('Store not found');
    }

    const usdToKhrRate =
      store.exchangeRates.find(
        (r) => r.fromCurrency === 'USD' && r.toCurrency === 'KHR',
      )?.rate || 4100;
    const exchangeRate = Number(usdToKhrRate);

    // 3. Wholesale Customer Validation
    let customer = null;
    let effectiveTier = PricingTier.RETAIL;

    if (dto.customerId) {
      customer = await this.prisma.customer.findUnique({
        where: { id: dto.customerId },
      });

      if (!customer) {
        throw new NotFoundException('Customer not found');
      }

      if (
        customer.wholesaleStatus === WholesaleStatus.APPROVED &&
        dto.pricingTier === PricingTier.WHOLESALE
      ) {
        effectiveTier = PricingTier.WHOLESALE;
      }
    }

    // 4. Fetch Products & Inventory in Transaction
    return this.prisma.$transaction(async (tx) => {
      let subtotalUsd = 0;
      const calculatedLineItems: Array<{
        variant: any;
        quantity: number;
        unitPriceUsd: number;
        costPriceUsd: number;
        discountUsd: number;
        subtotalUsd: number;
        priceType: PricingTier;
      }> = [];

      for (const item of dto.items) {
        const variant = await tx.productVariant.findUnique({
          where: { id: item.variantId },
          include: { product: true },
        });

        if (!variant || !variant.isActive || variant.deletedAt) {
          throw new NotFoundException(`Product variant ${item.variantId} not found or inactive`);
        }

        const balance = await tx.inventoryBalance.findUnique({
          where: {
            storeId_variantId: {
              storeId: dto.storeId,
              variantId: item.variantId,
            },
          },
        });

        if (!balance || balance.quantityOnHand < item.quantity) {
          const available = balance ? balance.quantityOnHand : 0;
          throw new BadRequestException(
            `Insufficient inventory for "${variant.product.name} (${variant.variantName})". On hand: ${available}, Requested: ${item.quantity}`,
          );
        }

        // Authoritative pricing calculation
        let unitPrice = Number(variant.sellingPriceUsd);
        let linePriceType = PricingTier.RETAIL;

        if (
          effectiveTier === PricingTier.WHOLESALE &&
          variant.wholesalePriceUsd &&
          item.quantity >= variant.minWholesaleQty
        ) {
          unitPrice = Number(variant.wholesalePriceUsd);
          linePriceType = PricingTier.WHOLESALE;
        }

        const discount = item.discountUsd ? roundToDecimal(item.discountUsd, 2) : 0;
        const lineSubtotal = roundToDecimal(Math.max(0, unitPrice * item.quantity - discount), 2);
        subtotalUsd += lineSubtotal;

        calculatedLineItems.push({
          variant,
          quantity: item.quantity,
          unitPriceUsd: unitPrice,
          costPriceUsd: Number(variant.costPriceUsd),
          discountUsd: discount,
          subtotalUsd: lineSubtotal,
          priceType: linePriceType,
        });
      }

      subtotalUsd = roundToDecimal(subtotalUsd, 2);
      const orderDiscount = dto.orderDiscountUsd
        ? Math.min(subtotalUsd, roundToDecimal(dto.orderDiscountUsd, 2))
        : 0;
      const taxableAmount = Math.max(0, subtotalUsd - orderDiscount);
      const taxRate = dto.taxRatePercentage ? Number(dto.taxRatePercentage) : 0;
      const taxUsd = roundToDecimal(taxableAmount * (taxRate / 100), 2);
      const totalUsd = roundToDecimal(taxableAmount + taxUsd, 2);
      const totalKhr = convertUsdToKhr(totalUsd, exchangeRate);

      // 5. Payment Tender & Change Calculation
      const tenderedUsd = dto.payment.tenderedUsd ? roundToDecimal(dto.payment.tenderedUsd, 2) : 0;
      const tenderedKhr = dto.payment.tenderedKhr ? roundKhr(dto.payment.tenderedKhr) : 0;

      let changeUsd = 0;
      let changeKhr = 0;

      if (dto.payment.paymentMethod === PaymentMethod.CASH) {
        const changeResult = calculateChange(totalUsd, tenderedUsd, tenderedKhr, exchangeRate);
        if (!changeResult.isFullyPaid) {
          throw new BadRequestException(
            `Tendered cash is insufficient. Total due: $${totalUsd.toFixed(2)}, Tendered: $${changeResult.totalTenderedInUsd.toFixed(2)}, Shortage: $${changeResult.shortageUsd.toFixed(2)}`,
          );
        }
        changeUsd = changeResult.changeDueUsd;
        changeKhr = changeResult.changeDueKhr;
      }

      // 6. Generate Sequential Order Number
      const orderCountToday = await tx.order.count({
        where: {
          storeId: dto.storeId,
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      });
      const orderSeq = (orderCountToday + 1).toString().padStart(4, '0');
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const orderNumber = `POS-${dateStr}-${orderSeq}`;

      // 7. Create Order Record
      const order = await tx.order.create({
        data: {
          orderNumber,
          storeId: dto.storeId,
          cashierUserId,
          customerId: dto.customerId || null,
          orderType: OrderType.IN_STORE,
          pricingTier: effectiveTier,
          subtotalUsd: new Decimal(subtotalUsd),
          discountUsd: new Decimal(orderDiscount),
          taxUsd: new Decimal(taxUsd),
          totalUsd: new Decimal(totalUsd),
          exchangeRate: new Decimal(exchangeRate),
          totalKhr: new Decimal(totalKhr),
          status: OrderStatus.COMPLETED,
          isOfflineSale: dto.isOfflineSale || false,
          offlineSyncedAt: dto.isOfflineSale ? new Date() : null,
          notes: dto.notes,
        },
      });

      // 8. Create Order Items and Deduct Inventory with Audit Ledger
      for (const line of calculatedLineItems) {
        await tx.orderItem.create({
          data: {
            orderId: order.id,
            variantId: line.variant.id,
            productName: line.variant.product.name,
            variantName: line.variant.variantName,
            sku: line.variant.sku,
            priceType: line.priceType,
            unitPriceUsd: new Decimal(line.unitPriceUsd),
            costPriceUsd: new Decimal(line.costPriceUsd),
            quantity: line.quantity,
            discountUsd: new Decimal(line.discountUsd),
            taxUsd: new Decimal(0),
            subtotalUsd: new Decimal(line.subtotalUsd),
          },
        });

        // Deduct Inventory Balance
        const currentBalance = await tx.inventoryBalance.findUnique({
          where: {
            storeId_variantId: {
              storeId: dto.storeId,
              variantId: line.variant.id,
            },
          },
        });

        const beforeQty = currentBalance?.quantityOnHand || 0;
        const afterQty = beforeQty - line.quantity;

        if (afterQty < 0) {
          throw new BadRequestException(
            `Insufficient inventory for "${line.variant.product.name}". On hand: ${beforeQty}, Requested: ${line.quantity}`,
          );
        }

        await tx.inventoryBalance.update({
          where: {
            storeId_variantId: {
              storeId: dto.storeId,
              variantId: line.variant.id,
            },
          },
          data: {
            quantityOnHand: afterQty,
          },
        });

        // Immutable Stock Movement Audit
        await tx.stockMovement.create({
          data: {
            storeId: dto.storeId,
            variantId: line.variant.id,
            movementType: MovementType.SALE,
            quantityDelta: -line.quantity,
            quantityBefore: beforeQty,
            quantityAfter: afterQty,
            referenceType: 'ORDER',
            referenceId: order.id,
            reason: `POS checkout ${orderNumber}`,
            createdByUserId: cashierUserId,
          },
        });
      }

      // 9. Record Authoritative Payment
      await tx.payment.create({
        data: {
          orderId: order.id,
          shiftId: dto.shiftId || null,
          paymentMethod: dto.payment.paymentMethod,
          amountUsd: new Decimal(totalUsd),
          tenderedUsd: new Decimal(dto.payment.paymentMethod === PaymentMethod.CASH ? tenderedUsd : totalUsd),
          tenderedKhr: new Decimal(dto.payment.paymentMethod === PaymentMethod.CASH ? tenderedKhr : 0),
          changeUsd: new Decimal(changeUsd),
          changeKhr: new Decimal(changeKhr),
          exchangeRate: new Decimal(exchangeRate),
          transactionRef: dto.payment.transactionRef || null,
          idempotencyKey: dto.idempotencyKey,
          status: PaymentStatus.COMPLETED,
        },
      });

      return this.formatReceiptData(order.id, tx);
    });
  }

  async syncOfflineSales(cashierUserId: string, dtos: PosCheckoutDto[]) {
    const results: Array<{
      idempotencyKey: string;
      success: boolean;
      orderNumber?: string;
      error?: string;
    }> = [];

    for (const dto of dtos) {
      try {
        const receipt = await this.checkout(cashierUserId, {
          ...dto,
          isOfflineSale: true,
        });
        results.push({
          idempotencyKey: dto.idempotencyKey,
          success: true,
          orderNumber: receipt.orderNumber,
        });
      } catch (err: any) {
        results.push({
          idempotencyKey: dto.idempotencyKey,
          success: false,
          error: err.message || 'Offline sync checkout failed',
        });
      }
    }

    return {
      total: dtos.length,
      synced: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
      results,
    };
  }

  async getReceipt(orderId: string) {
    return this.formatReceiptData(orderId, this.prisma);
  }

  async getRecentOrders(storeId: string, limit: number = 20) {
    return this.prisma.order.findMany({
      where: { storeId },
      include: {
        items: true,
        payments: true,
        cashier: { select: { fullName: true } },
        customer: { select: { fullName: true, phone: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  private async formatReceiptData(orderId: string, client: any) {
    const order = await client.order.findUnique({
      where: { id: orderId },
      include: {
        store: true,
        cashier: { select: { fullName: true } },
        customer: { select: { fullName: true, phone: true } },
        items: true,
        payments: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const primaryPayment = order.payments[0] || {};

    return {
      orderId: order.id,
      orderNumber: order.orderNumber,
      storeName: order.store.name,
      storeAddress: order.store.address,
      storePhone: order.store.phone,
      cashierName: order.cashier?.fullName || 'Cashier',
      customerName: order.customer ? `${order.customer.fullName} (${order.customer.phone})` : null,
      pricingTier: order.pricingTier,
      createdAt: order.createdAt.toISOString(),
      items: order.items.map((i: any) => ({
        productName: i.productName,
        variantName: i.variantName,
        sku: i.sku,
        quantity: i.quantity,
        unitPriceUsd: Number(i.unitPriceUsd),
        subtotalUsd: Number(i.subtotalUsd),
      })),
      subtotalUsd: Number(order.subtotalUsd),
      discountUsd: Number(order.discountUsd),
      taxUsd: Number(order.taxUsd),
      totalUsd: Number(order.totalUsd),
      totalKhr: Number(order.totalKhr),
      exchangeRate: Number(order.exchangeRate),
      paymentMethod: primaryPayment.paymentMethod || 'CASH',
      tenderedUsd: Number(primaryPayment.tenderedUsd || 0),
      tenderedKhr: Number(primaryPayment.tenderedKhr || 0),
      changeUsd: Number(primaryPayment.changeUsd || 0),
      changeKhr: Number(primaryPayment.changeKhr || 0),
      transactionRef: primaryPayment.transactionRef || null,
      idempotencyKey: primaryPayment.idempotencyKey,
    };
  }
}
