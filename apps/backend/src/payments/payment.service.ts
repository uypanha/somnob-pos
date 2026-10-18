import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GenerateKhqrDto } from './dto/generate-khqr.dto';
import { ProcessRefundDto } from './dto/process-refund.dto';
import { SplitPaymentDto } from './dto/split-payment.dto';
import {
  OrderStatus,
  PaymentStatus,
  MovementType,
  generateKhqrPayload,
  roundToDecimal,
} from '@somnob/shared';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class PaymentService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Generates EMVCo-compliant KHQR Bakong payload string for an order.
   */
  async generateKhqr(dto: GenerateKhqrDto) {
    const order = await this.prisma.order.findUnique({
      where: { id: dto.orderId },
      include: { store: true },
    });

    if (!order) {
      throw new NotFoundException(`Order ${dto.orderId} not found`);
    }

    const currency = dto.currency || 'USD';
    const amount =
      currency === 'USD' ? Number(order.totalUsd) : Number(order.totalKhr);

    const qrPayload = generateKhqrPayload({
      bakongAccountId: 'somnob_retail@aclb',
      merchantName: 'Somnob Retail Group',
      merchantCity: 'Phnom Penh',
      currency,
      amount,
      orderNumber: order.orderNumber,
      storeCode: order.store.code,
    });

    return {
      orderId: order.id,
      orderNumber: order.orderNumber,
      currency,
      amount,
      qrPayload,
      bakongAccountId: 'somnob_retail@aclb',
      merchantName: 'Somnob Retail Group',
      storeName: order.store.name,
    };
  }

  /**
   * Processes split tender payments for an order (e.g. part Cash, part KHQR).
   */
  async processSplitPayment(dto: SplitPaymentDto, cashierUserId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: dto.orderId },
      include: { store: true },
    });

    if (!order) {
      throw new NotFoundException(`Order ${dto.orderId} not found`);
    }

    if (order.status === OrderStatus.COMPLETED) {
      throw new BadRequestException('Order is already fully paid and completed');
    }

    const totalTenderedUsd = dto.tenders.reduce((sum, t) => sum + t.amountUsd, 0);
    const orderTotalUsd = Number(order.totalUsd);

    if (roundToDecimal(totalTenderedUsd, 2) < roundToDecimal(orderTotalUsd, 2)) {
      throw new BadRequestException(
        `Total split tenders ($${totalTenderedUsd.toFixed(2)}) is less than total due ($${orderTotalUsd.toFixed(2)})`,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const createdPayments = [];

      for (let i = 0; i < dto.tenders.length; i++) {
        const tender = dto.tenders[i];
        const idempotencyKey = `split-${order.id}-${i}-${Date.now()}`;

        const payment = await tx.payment.create({
          data: {
            orderId: order.id,
            shiftId: dto.shiftId || null,
            paymentMethod: tender.paymentMethod,
            amountUsd: new Decimal(tender.amountUsd),
            tenderedUsd: new Decimal(tender.tenderedUsd || tender.amountUsd),
            tenderedKhr: new Decimal(tender.tenderedKhr || 0),
            changeUsd: new Decimal(0),
            changeKhr: new Decimal(0),
            exchangeRate: order.exchangeRate,
            transactionRef: tender.transactionRef || null,
            idempotencyKey,
            status: PaymentStatus.COMPLETED,
          },
        });
        createdPayments.push(payment);
      }

      const updatedOrder = await tx.order.update({
        where: { id: order.id },
        data: {
          status: OrderStatus.COMPLETED,
          cashierUserId,
        },
        include: {
          items: true,
          payments: true,
          store: true,
        },
      });

      return {
        order: updatedOrder,
        payments: createdPayments,
      };
    });
  }

  /**
   * Processes returns & refunds with optional automated inventory restock and ledger entries.
   */
  async processRefund(orderId: string, dto: ProcessRefundDto, cashierUserId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
        payments: true,
        store: true,
      },
    });

    if (!order) {
      throw new NotFoundException(`Order ${orderId} not found`);
    }

    if (order.status === OrderStatus.CANCELLED) {
      throw new BadRequestException('Order has already been refunded or cancelled');
    }

    if (order.status !== OrderStatus.COMPLETED) {
      throw new BadRequestException(`Cannot refund order in status '${order.status}'`);
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Update Order status
      const updatedNotes = [
        order.notes,
        `Refunded on ${new Date().toISOString()}: ${dto.reason}`,
      ]
        .filter(Boolean)
        .join(' | ');

      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: {
          status: OrderStatus.CANCELLED,
          notes: updatedNotes,
        },
      });


      // 2. Mark all associated payments as REFUNDED
      await tx.payment.updateMany({
        where: { orderId },
        data: { status: PaymentStatus.REFUNDED },
      });

      // 3. Automated inventory restock if requested
      const restockedMovements = [];
      if (dto.restockItems !== false) {
        for (const item of order.items) {
          const balance = await tx.inventoryBalance.findUnique({
            where: {
              storeId_variantId: {
                storeId: order.storeId,
                variantId: item.variantId,
              },
            },
          });

          const beforeQty = balance?.quantityOnHand || 0;
          const afterQty = beforeQty + item.quantity;

          await tx.inventoryBalance.update({
            where: {
              storeId_variantId: {
                storeId: order.storeId,
                variantId: item.variantId,
              },
            },
            data: { quantityOnHand: afterQty },
          });

          const movement = await tx.stockMovement.create({
            data: {
              storeId: order.storeId,
              variantId: item.variantId,
              movementType: MovementType.REFUND,
              quantityDelta: item.quantity,
              quantityBefore: beforeQty,
              quantityAfter: afterQty,
              referenceType: 'REFUND',
              referenceId: order.id,
              reason: `Refund restock ${order.orderNumber}: ${dto.reason}`,
              createdByUserId: cashierUserId,
            },
          });
          restockedMovements.push(movement);
        }
      }

      return {
        orderId: updatedOrder.id,
        orderNumber: updatedOrder.orderNumber,
        status: updatedOrder.status,
        refundedAmountUsd: Number(order.totalUsd),
        refundedAmountKhr: Number(order.totalKhr),
        reason: dto.reason,
        restockedItems: dto.restockItems !== false,
        restockedCount: restockedMovements.length,
      };
    });
  }

  async getOrderPayments(orderId: string) {
    return this.prisma.payment.findMany({
      where: { orderId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
