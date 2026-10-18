import { Test, TestingModule } from '@nestjs/testing';
import { OrderService } from './order.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  OrderType,
  OrderStatus,
  PricingTier,
  MovementType,
} from '@somnob/shared';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Decimal } from '@prisma/client/runtime/library';

describe('OrderService', () => {
  let service: OrderService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      store: {
        findUnique: jest.fn(),
      },
      customer: {
        findUnique: jest.fn(),
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
      order: {
        count: jest.fn(),
        create: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
        findMany: jest.fn(),
      },
      orderItem: {
        create: jest.fn(),
      },
      $transaction: jest.fn(async (cb) => cb(prisma)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<OrderService>(OrderService);
  });

  describe('createOrder', () => {
    it('should throw BadRequestException if item stock is insufficient', async () => {
      prisma.store.findUnique.mockResolvedValue({
        id: 'store-1',
        exchangeRates: [{ fromCurrency: 'USD', toCurrency: 'KHR', rate: 4100 }],
      });

      prisma.productVariant.findUnique.mockResolvedValue({
        id: 'var-1',
        sellingPriceUsd: new Decimal(1.5),
        costPriceUsd: new Decimal(0.8),
        isActive: true,
        variantName: 'Can',
        product: { name: 'Vital' },
      });

      prisma.inventoryBalance.findUnique.mockResolvedValue({
        quantityOnHand: 2, // only 2 in stock
      });

      await expect(
        service.createOrder({
          storeId: 'store-1',
          orderType: OrderType.PICKUP,
          customerName: 'Chenda Keo',
          customerPhone: '+855 12 999 888',
          items: [{ variantId: 'var-1', quantity: 10 }], // requesting 10
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should successfully create customer pickup order with stock deduction', async () => {
      prisma.store.findUnique.mockResolvedValue({
        id: 'store-1',
        name: 'BKK1 Flagship',
        address: 'Street 302',
        phone: '+855 23 888 999',
        exchangeRates: [{ fromCurrency: 'USD', toCurrency: 'KHR', rate: 4100 }],
      });

      prisma.productVariant.findUnique.mockResolvedValue({
        id: 'var-1',
        variantName: '500ml Bottle',
        sku: 'VITAL-500',
        sellingPriceUsd: new Decimal(0.35),
        costPriceUsd: new Decimal(0.2),
        isActive: true,
        product: { name: 'Vital Mineral Water' },
      });

      prisma.inventoryBalance.findUnique.mockResolvedValue({
        quantityOnHand: 100,
      });

      prisma.order.count.mockResolvedValue(5);
      prisma.order.create.mockResolvedValue({
        id: 'ord-web-1',
        orderNumber: 'WEB-20261018-0006',
        storeId: 'store-1',
        orderType: OrderType.PICKUP,
        pricingTier: PricingTier.RETAIL,
        subtotalUsd: new Decimal(0.7),
        discountUsd: new Decimal(0),
        taxUsd: new Decimal(0),
        totalUsd: new Decimal(0.7),
        exchangeRate: new Decimal(4100),
        totalKhr: new Decimal(2870),
        status: OrderStatus.PENDING,
        createdAt: new Date(),
        updatedAt: new Date(),
        store: { name: 'BKK1 Flagship', address: 'Street 302', phone: '+855 23 888 999' },
        items: [
          {
            id: 'item-1',
            productName: 'Vital Mineral Water',
            variantName: '500ml Bottle',
            quantity: 2,
            unitPriceUsd: new Decimal(0.35),
            subtotalUsd: new Decimal(0.7),
          },
        ],
        customer: null,
      });

      prisma.order.findUnique.mockResolvedValue({
        id: 'ord-web-1',
        orderNumber: 'WEB-20261018-0006',
        orderType: OrderType.PICKUP,
        status: OrderStatus.PENDING,
        subtotalUsd: new Decimal(0.7),
        totalUsd: new Decimal(0.7),
        totalKhr: new Decimal(2870),
        exchangeRate: new Decimal(4100),
        createdAt: new Date(),
        updatedAt: new Date(),
        store: { name: 'BKK1 Flagship', address: 'Street 302', phone: '+855 23 888 999' },
        items: [
          {
            id: 'item-1',
            productName: 'Vital Mineral Water',
            variantName: '500ml Bottle',
            quantity: 2,
            unitPriceUsd: new Decimal(0.35),
            subtotalUsd: new Decimal(0.7),
          },
        ],
        customer: null,
      });

      const result = await service.createOrder({
        storeId: 'store-1',
        orderType: OrderType.PICKUP,
        customerName: 'Chenda Keo',
        customerPhone: '+855 12 999 888',
        items: [{ variantId: 'var-1', quantity: 2 }],
      });

      expect(result.orderNumber).toBe('WEB-20261018-0006');
      expect(result.totalUsd).toBe(0.7);
      expect(result.totalKhr).toBe(2870);
      expect(result.status).toBe(OrderStatus.PENDING);
      expect(prisma.inventoryBalance.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { quantityOnHand: 98 },
        }),
      );
      expect(prisma.stockMovement.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            movementType: MovementType.SALE,
            quantityDelta: -2,
          }),
        }),
      );
    });
  });

  describe('getOrderTrack', () => {
    it('should return tracking timeline and current milestone index', async () => {
      prisma.order.findFirst.mockResolvedValue({
        id: 'ord-web-1',
        orderNumber: 'WEB-20261018-0006',
        orderType: OrderType.PICKUP,
        status: OrderStatus.PREPARING,
        subtotalUsd: new Decimal(0.7),
        totalUsd: new Decimal(0.7),
        totalKhr: new Decimal(2870),
        exchangeRate: new Decimal(4100),
        createdAt: new Date(),
        updatedAt: new Date(),
        store: { name: 'BKK1 Flagship', address: 'Street 302', phone: '+855 23 888 999' },
        items: [
          {
            id: 'item-1',
            productName: 'Vital Mineral Water',
            variantName: '500ml Bottle',
            quantity: 2,
            unitPriceUsd: new Decimal(0.35),
            subtotalUsd: new Decimal(0.7),
          },
        ],
        customer: null,
      });

      prisma.order.findUnique.mockResolvedValue({
        id: 'ord-web-1',
        orderNumber: 'WEB-20261018-0006',
        orderType: OrderType.PICKUP,
        status: OrderStatus.PREPARING,
        subtotalUsd: new Decimal(0.7),
        totalUsd: new Decimal(0.7),
        totalKhr: new Decimal(2870),
        exchangeRate: new Decimal(4100),
        createdAt: new Date(),
        updatedAt: new Date(),
        store: { name: 'BKK1 Flagship', address: 'Street 302', phone: '+855 23 888 999' },
        items: [
          {
            id: 'item-1',
            productName: 'Vital Mineral Water',
            variantName: '500ml Bottle',
            quantity: 2,
            unitPriceUsd: new Decimal(0.35),
            subtotalUsd: new Decimal(0.7),
          },
        ],
        customer: null,
      });

      const tracking = await service.getOrderTrack('WEB-20261018-0006');
      expect(tracking.orderNumber).toBe('WEB-20261018-0006');
      expect(tracking.status).toBe(OrderStatus.PREPARING);
      expect(tracking.currentStepIndex).toBe(1); // 0: PENDING, 1: PREPARING
      expect(tracking.statusSteps.length).toBe(4);
    });
  });
});
