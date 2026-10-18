import { Test, TestingModule } from '@nestjs/testing';
import { PosService } from './pos.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  PricingTier,
  PaymentMethod,
  OrderStatus,
  PaymentStatus,
  MovementType,
  WholesaleStatus,
} from '@somnob/shared';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Decimal } from '@prisma/client/runtime/library';

describe('PosService', () => {
  let service: PosService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      payment: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
      store: {
        findUnique: jest.fn(),
      },
      customer: {
        findUnique: jest.fn(),
      },
      order: {
        count: jest.fn(),
        create: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
      },
      orderItem: {
        create: jest.fn(),
      },
      productVariant: {
        findUnique: jest.fn(),
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
        PosService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<PosService>(PosService);
  });

  describe('checkout - Idempotency', () => {
    it('should return existing receipt immediately if idempotencyKey has already been processed', async () => {
      prisma.payment.findUnique.mockResolvedValue({
        id: 'pay-1',
        orderId: 'ord-100',
        idempotencyKey: 'idemp-abc-123',
      });

      jest.spyOn(service, 'getReceipt').mockResolvedValue({
        orderNumber: 'POS-20261018-0001',
        totalUsd: 15.0,
      } as any);

      const result = await service.checkout('cashier-1', {
        idempotencyKey: 'idemp-abc-123',
        storeId: 'store-1',
        items: [{ variantId: 'var-1', quantity: 1 }],
        payment: { paymentMethod: PaymentMethod.CASH, tenderedUsd: 20 },
      });

      expect(result.orderNumber).toBe('POS-20261018-0001');
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });
  });

  describe('checkout - Stock Validation', () => {
    it('should throw BadRequestException if item stock is insufficient', async () => {
      prisma.payment.findUnique.mockResolvedValue(null);
      prisma.store.findUnique.mockResolvedValue({
        id: 'store-1',
        name: 'BKK1 Flagship',
        exchangeRates: [{ fromCurrency: 'USD', toCurrency: 'KHR', rate: 4100 }],
      });

      prisma.productVariant.findUnique.mockResolvedValue({
        id: 'var-1',
        sellingPriceUsd: new Decimal(2.5),
        costPriceUsd: new Decimal(1.0),
        isActive: true,
        variantName: '330ml Can',
        product: { name: 'Coca-Cola' },
      });

      prisma.inventoryBalance.findUnique.mockResolvedValue({
        quantityOnHand: 2, // only 2 in stock
      });

      await expect(
        service.checkout('cashier-1', {
          idempotencyKey: 'idemp-new-456',
          storeId: 'store-1',
          items: [{ variantId: 'var-1', quantity: 5 }], // requesting 5
          payment: { paymentMethod: PaymentMethod.CASH, tenderedUsd: 20 },
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('checkout - Successful Sale', () => {
    it('should process retail sale, deduct inventory, record stock movement, and return receipt', async () => {
      prisma.payment.findUnique.mockResolvedValue(null);
      prisma.store.findUnique.mockResolvedValue({
        id: 'store-1',
        name: 'BKK1 Flagship',
        address: 'Street 302',
        phone: '+855 23 888 999',
        exchangeRates: [{ fromCurrency: 'USD', toCurrency: 'KHR', rate: 4100 }],
      });

      prisma.productVariant.findUnique.mockResolvedValue({
        id: 'var-1',
        variantName: '330ml Can',
        sku: 'COKE-330',
        sellingPriceUsd: new Decimal(2.0),
        costPriceUsd: new Decimal(1.0),
        isActive: true,
        product: { name: 'Coca-Cola' },
      });

      prisma.inventoryBalance.findUnique.mockResolvedValue({
        quantityOnHand: 50,
      });

      prisma.order.count.mockResolvedValue(10);
      prisma.order.create.mockResolvedValue({
        id: 'ord-new',
        orderNumber: 'POS-20261018-0011',
        storeId: 'store-1',
        subtotalUsd: new Decimal(4.0),
        discountUsd: new Decimal(0),
        taxUsd: new Decimal(0),
        totalUsd: new Decimal(4.0),
        exchangeRate: new Decimal(4100),
        totalKhr: new Decimal(16400),
        pricingTier: PricingTier.RETAIL,
        createdAt: new Date(),
        store: { name: 'BKK1 Flagship', address: 'Street 302', phone: '+855 23 888 999' },
        cashier: { fullName: 'Sophea Chan' },
        customer: null,
        items: [
          {
            productName: 'Coca-Cola',
            variantName: '330ml Can',
            sku: 'COKE-330',
            quantity: 2,
            unitPriceUsd: new Decimal(2.0),
            subtotalUsd: new Decimal(4.0),
          },
        ],
        payments: [
          {
            paymentMethod: PaymentMethod.CASH,
            amountUsd: new Decimal(4.0),
            tenderedUsd: new Decimal(5.0),
            tenderedKhr: new Decimal(0),
            changeUsd: new Decimal(1.0),
            changeKhr: new Decimal(4100),
            idempotencyKey: 'idemp-sale-789',
          },
        ],
      });

      prisma.order.findUnique.mockResolvedValue({
        id: 'ord-new',
        orderNumber: 'POS-20261018-0011',
        store: { name: 'BKK1 Flagship', address: 'Street 302', phone: '+855 23 888 999' },
        cashier: { fullName: 'Sophea Chan' },
        customer: null,
        pricingTier: PricingTier.RETAIL,
        createdAt: new Date(),
        items: [
          {
            productName: 'Coca-Cola',
            variantName: '330ml Can',
            sku: 'COKE-330',
            quantity: 2,
            unitPriceUsd: new Decimal(2.0),
            subtotalUsd: new Decimal(4.0),
          },
        ],
        payments: [
          {
            paymentMethod: PaymentMethod.CASH,
            amountUsd: new Decimal(4.0),
            tenderedUsd: new Decimal(5.0),
            tenderedKhr: new Decimal(0),
            changeUsd: new Decimal(1.0),
            changeKhr: new Decimal(4100),
            idempotencyKey: 'idemp-sale-789',
          },
        ],
        subtotalUsd: new Decimal(4.0),
        discountUsd: new Decimal(0),
        taxUsd: new Decimal(0),
        totalUsd: new Decimal(4.0),
        totalKhr: new Decimal(16400),
        exchangeRate: new Decimal(4100),
      });

      const receipt = await service.checkout('cashier-1', {
        idempotencyKey: 'idemp-sale-789',
        storeId: 'store-1',
        items: [{ variantId: 'var-1', quantity: 2 }],
        payment: { paymentMethod: PaymentMethod.CASH, tenderedUsd: 5.0 },
      });

      expect(receipt.orderNumber).toBe('POS-20261018-0011');
      expect(receipt.totalUsd).toBe(4.0);
      expect(receipt.changeUsd).toBe(1.0);
      expect(receipt.changeKhr).toBe(4100);

      // Verify inventory deducted
      expect(prisma.inventoryBalance.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { quantityOnHand: 48 },
        }),
      );

      // Verify stock movement recorded
      expect(prisma.stockMovement.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            movementType: MovementType.SALE,
            quantityDelta: -2,
            quantityBefore: 50,
            quantityAfter: 48,
          }),
        }),
      );
    });
  });
});
