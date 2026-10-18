import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import {
  PricingTier,
  OrderStatus,
  OrderType,
  MovementType,
  WholesaleStatus,
} from '@somnob/shared';
import { roundToDecimal, convertUsdToKhr } from '@somnob/shared';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class OrderService {
  constructor(private readonly prisma: PrismaService) {}

  async createOrder(dto: CreateOrderDto) {
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('Order must contain at least one item');
    }

    // 1. Fetch Store & Exchange Rate
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

    // 2. Customer & Wholesale Tier Validation
    let customer = null;
    let effectiveTier = PricingTier.RETAIL;

    if (dto.customerId) {
      customer = await this.prisma.customer.findUnique({
        where: { id: dto.customerId },
      });

      if (
        customer &&
        customer.wholesaleStatus === WholesaleStatus.APPROVED
      ) {
        effectiveTier = PricingTier.WHOLESALE;
      }
    }

    // 3. Process Order Items & Concurrency-Safe Stock Verification
    return this.prisma.$transaction(async (tx) => {
      let subtotalUsd = 0;
      const calculatedLines: Array<{
        variant: any;
        quantity: number;
        unitPriceUsd: number;
        costPriceUsd: number;
        subtotalUsd: number;
        priceType: PricingTier;
      }> = [];

      for (const item of dto.items) {
        const variant = await tx.productVariant.findUnique({
          where: { id: item.variantId },
          include: { product: true },
        });

        if (!variant || !variant.isActive || variant.deletedAt) {
          throw new NotFoundException(`Product variant ${item.variantId} not found`);
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
            `Insufficient stock for "${variant.product.name} (${variant.variantName})". On hand: ${available}, Requested: ${item.quantity}`,
          );
        }

        // Authoritative wholesale tier check
        let unitPrice = Number(variant.sellingPriceUsd);
        let lineTier = PricingTier.RETAIL;

        if (
          effectiveTier === PricingTier.WHOLESALE &&
          variant.wholesalePriceUsd &&
          item.quantity >= variant.minWholesaleQty
        ) {
          unitPrice = Number(variant.wholesalePriceUsd);
          lineTier = PricingTier.WHOLESALE;
        }

        const lineSubtotal = roundToDecimal(unitPrice * item.quantity, 2);
        subtotalUsd += lineSubtotal;

        calculatedLines.push({
          variant,
          quantity: item.quantity,
          unitPriceUsd: unitPrice,
          costPriceUsd: Number(variant.costPriceUsd),
          subtotalUsd: lineSubtotal,
          priceType: lineTier,
        });
      }

      subtotalUsd = roundToDecimal(subtotalUsd, 2);
      const deliveryFee = dto.orderType === OrderType.DELIVERY ? 1.5 : 0.0;
      const taxUsd = 0.0; // Standard 0% retail VAT or configurable
      const totalUsd = roundToDecimal(subtotalUsd + deliveryFee + taxUsd, 2);
      const totalKhr = convertUsdToKhr(totalUsd, exchangeRate);

      // Generate Order Number
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
      const orderNumber = `WEB-${dateStr}-${orderSeq}`;

      const notes = [
        dto.notes,
        dto.deliveryAddress ? `Delivery Address: ${dto.deliveryAddress}` : null,
        `Customer: ${dto.customerName} (${dto.customerPhone})`,
      ]
        .filter(Boolean)
        .join(' | ');

      // Create Order
      const order = await tx.order.create({
        data: {
          orderNumber,
          storeId: dto.storeId,
          customerId: dto.customerId || null,
          orderType: dto.orderType,
          pricingTier: effectiveTier,
          subtotalUsd: new Decimal(subtotalUsd),
          discountUsd: new Decimal(0),
          taxUsd: new Decimal(taxUsd),
          totalUsd: new Decimal(totalUsd),
          exchangeRate: new Decimal(exchangeRate),
          totalKhr: new Decimal(totalKhr),
          status: OrderStatus.PENDING,
          notes,
        },
      });

      // Create Order Items and Deduct Inventory
      for (const line of calculatedLines) {
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
            discountUsd: new Decimal(0),
            taxUsd: new Decimal(0),
            subtotalUsd: new Decimal(line.subtotalUsd),
          },
        });

        // Deduct inventory
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

        await tx.inventoryBalance.update({
          where: {
            storeId_variantId: {
              storeId: dto.storeId,
              variantId: line.variant.id,
            },
          },
          data: { quantityOnHand: afterQty },
        });

        // Stock movement audit
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
            reason: `Web ordering ${orderNumber}`,
          },
        });
      }

      return this.formatTrackingDetails(order.id, tx);
    });
  }

  async getOrderTrack(identifier: string) {
    const isUuid = /^[0-9a-fA-F-]{36}$/.test(identifier);
    const order = await this.prisma.order.findFirst({
      where: isUuid ? { id: identifier } : { orderNumber: identifier },
      include: {
        store: true,
        items: true,
        customer: true,
      },
    });

    if (!order) {
      throw new NotFoundException(`Order '${identifier}' not found`);
    }

    return this.formatTrackingDetails(order.id, this.prisma);
  }

  async updateOrderStatus(id: string, status: OrderStatus) {
    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const updated = await this.prisma.order.update({
      where: { id },
      data: { status },
      include: { store: true, items: true },
    });

    return this.formatTrackingDetails(updated.id, this.prisma);
  }

  async getCustomerOrders(customerId: string) {
    return this.prisma.order.findMany({
      where: { customerId },
      include: { store: true, items: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  private async formatTrackingDetails(orderId: string, client: any) {
    const order = await client.order.findUnique({
      where: { id: orderId },
      include: {
        store: true,
        items: true,
        customer: true,
      },
    });

    if (!order) throw new NotFoundException('Order not found');

    const statusSteps = [
      { key: OrderStatus.PENDING, label: 'Order Received', desc: 'We have received your order' },
      { key: OrderStatus.PREPARING, label: 'Preparing Items', desc: 'Store is picking and packing your items' },
      {
        key:
          order.orderType === OrderType.DELIVERY
            ? OrderStatus.OUT_FOR_DELIVERY
            : OrderStatus.READY_FOR_PICKUP,
        label: order.orderType === OrderType.DELIVERY ? 'Out for Delivery' : 'Ready for Pickup',
        desc:
          order.orderType === OrderType.DELIVERY
            ? 'Rider is on the way to your address'
            : 'Your order is ready at the front counter',
      },
      { key: OrderStatus.COMPLETED, label: 'Completed', desc: 'Order fulfilled and completed' },
    ];

    const currentStepIndex = statusSteps.findIndex((s) => s.key === order.status);

    return {
      id: order.id,
      orderNumber: order.orderNumber,
      orderType: order.orderType,
      status: order.status,
      currentStepIndex: currentStepIndex >= 0 ? currentStepIndex : 0,
      statusSteps,
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
      storeName: order.store.name,
      storeAddress: order.store.address,
      storePhone: order.store.phone,
      notes: order.notes,
      subtotalUsd: Number(order.subtotalUsd),
      totalUsd: Number(order.totalUsd),
      totalKhr: Number(order.totalKhr),
      exchangeRate: Number(order.exchangeRate),
      items: order.items.map((i: any) => ({
        id: i.id,
        productName: i.productName,
        variantName: i.variantName,
        quantity: i.quantity,
        unitPriceUsd: Number(i.unitPriceUsd),
        subtotalUsd: Number(i.subtotalUsd),
      })),
    };
  }
}
