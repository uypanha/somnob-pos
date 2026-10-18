import { Test, TestingModule } from '@nestjs/testing';
import { PaymentService } from './payment.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  OrderStatus,
  PaymentStatus,
  PaymentMethod,
  MovementType,
} from '@somnob/shared';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Decimal } from '@prisma/client/runtime/library';

describe('PaymentService', () => {
  let service: PaymentService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      order: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      payment: {
        create: jest.fn(),
        updateMany: jest.fn(),
        findMany: jest.fn(),
      },
      inventoryBalance: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      stockMovement: {
        create: jest.fn(),
      },
      $transaction: jest.fn(async (cb) => cb(prisma)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<PaymentService>(PaymentService);
  });

  describe('generateKhqr', () => {
    it('should generate valid EMVCo KHQR payload string for an order', async () => {
      prisma.order.findUnique.mockResolvedValue({
        id: 'ord-100',
        orderNumber: 'POS-20261018-0001',
        totalUsd: new Decimal(12.5),
        totalKhr: new Decimal(51250),
        store: { name: 'BKK1 Flagship', code: 'STR-001' },
      });

      const result = await service.generateKhqr({
        orderId: 'ord-100',
        currency: 'USD',
      });

      expect(result.orderNumber).toBe('POS-20261018-0001');
      expect(result.currency).toBe('USD');
      expect(result.amount).toBe(12.5);
      expect(result.qrPayload.startsWith('000201010212')).toBe(true);
      expect(result.qrPayload).toContain('5303840'); // USD
    });
  });

  describe('processSplitPayment', () => {
    it('should throw BadRequestException if split tenders do not cover total', async () => {
      prisma.order.findUnique.mockResolvedValue({
        id: 'ord-100',
        totalUsd: new Decimal(20.0),
        status: OrderStatus.PENDING,
      });

      await expect(
        service.processSplitPayment(
          {
            orderId: 'ord-100',
            tenders: [
              { paymentMethod: PaymentMethod.CASH, amountUsd: 10.0 }, // only $10 provided
            ],
          },
          'cashier-1',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should complete order with multiple split payments', async () => {
      prisma.order.findUnique.mockResolvedValue({
        id: 'ord-100',
        totalUsd: new Decimal(20.0),
        exchangeRate: new Decimal(4100),
        status: OrderStatus.PENDING,
      });

      prisma.order.update.mockResolvedValue({
        id: 'ord-100',
        status: OrderStatus.COMPLETED,
      });

      const result = await service.processSplitPayment(
        {
          orderId: 'ord-100',
          tenders: [
            { paymentMethod: PaymentMethod.CASH, amountUsd: 10.0, tenderedUsd: 10.0 },
            { paymentMethod: PaymentMethod.KHQR, amountUsd: 10.0, transactionRef: 'BAKONG-9988' },
          ],
        },
        'cashier-1',
      );

      expect(prisma.payment.create).toHaveBeenCalledTimes(2);
      expect(prisma.order.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: OrderStatus.COMPLETED }),
        }),
      );
      expect(result.payments.length).toBe(2);
    });
  });

  describe('processRefund', () => {
    it('should refund order, update payments, restock inventory and record stock movements', async () => {
      prisma.order.findUnique.mockResolvedValue({
        id: 'ord-100',
        orderNumber: 'POS-20261018-0001',
        storeId: 'store-1',
        status: OrderStatus.COMPLETED,
        totalUsd: new Decimal(10.0),
        totalKhr: new Decimal(41000),
        items: [
          { variantId: 'var-1', quantity: 2 },
        ],
      });

      prisma.inventoryBalance.findUnique.mockResolvedValue({
        quantityOnHand: 48,
      });

      prisma.order.update.mockResolvedValue({
        id: 'ord-100',
        orderNumber: 'POS-20261018-0001',
        status: OrderStatus.CANCELLED,
      });

      const refund = await service.processRefund(
        'ord-100',
        { reason: 'Customer returned damaged item', restockItems: true },
        'manager-1',
      );

      expect(refund.status).toBe(OrderStatus.CANCELLED);
      expect(refund.restockedCount).toBe(1);

      // Verify payment marked REFUNDED
      expect(prisma.payment.updateMany).toHaveBeenCalledWith({
        where: { orderId: 'ord-100' },
        data: { status: PaymentStatus.REFUNDED },
      });

      // Verify inventory restocked 48 + 2 = 50
      expect(prisma.inventoryBalance.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { quantityOnHand: 50 },
        }),
      );

      // Verify immutable stock movement created
      expect(prisma.stockMovement.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            movementType: MovementType.REFUND,
            quantityDelta: 2,
            quantityBefore: 48,
            quantityAfter: 50,
          }),
        }),
      );
    });
  });
});
