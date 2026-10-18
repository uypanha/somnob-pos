import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { PrismaService } from '../prisma/prisma.service';
import { MovementType } from '@somnob/shared';
import { Prisma } from '@prisma/client';

describe('InventoryService', () => {
  let service: InventoryService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      store: {
        findFirst: jest.fn(),
      },
      productVariant: {
        findFirst: jest.fn(),
      },
      inventoryBalance: {
        findMany: jest.fn(),
        count: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      stockMovement: {
        findMany: jest.fn(),
        count: jest.fn(),
        create: jest.fn(),
      },
      $transaction: jest.fn((callback) => callback(prisma)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InventoryService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<InventoryService>(InventoryService);
  });

  describe('getStoreInventory', () => {
    it('returns inventory balances with availability and low-stock flags', async () => {
      prisma.store.findFirst.mockResolvedValue({ id: 'store-1', businessId: 'biz-1', isActive: true });
      prisma.inventoryBalance.findMany.mockResolvedValue([
        {
          id: 'bal-1',
          storeId: 'store-1',
          variantId: 'var-1',
          quantityOnHand: 4,
          quantityReserved: 1,
          reorderPoint: 5,
          variant: {
            variantName: '330ml Can',
            sku: 'COKE-330',
            barcode: '8850123456789',
            unitOfMeasure: 'CAN',
            sellingPriceUsd: new Prisma.Decimal(0.75),
            wholesalePriceUsd: new Prisma.Decimal(0.6),
            minWholesaleQty: 12,
            product: {
              name: 'Coca Cola Can',
              imageUrl: null,
              categoryId: 'cat-1',
            },
          },
        },
      ]);
      prisma.inventoryBalance.count.mockResolvedValue(1);

      const result = await service.getStoreInventory('biz-1', 'store-1', {});

      expect(result.items).toHaveLength(1);
      const item = result.items[0];
      expect(item.quantityOnHand).toBe(4);
      expect(item.quantityReserved).toBe(1);
      expect(item.quantityAvailable).toBe(3); // 4 - 1
      expect(item.isLowStock).toBe(true); // 4 <= 5
      expect(item.productName).toBe('Coca Cola Can');
      expect(item.wholesalePriceUsd).toBe(0.6);
    });

    it('throws NotFoundException if store does not exist', async () => {
      prisma.store.findFirst.mockResolvedValue(null);

      await expect(
        service.getStoreInventory('biz-1', 'non-existent-store', {})
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('adjustStock', () => {
    it('increases stock on positive delta and records ADJUSTMENT_IN in audit ledger', async () => {
      prisma.store.findFirst.mockResolvedValue({ id: 'store-1', businessId: 'biz-1', isActive: true });
      prisma.productVariant.findFirst.mockResolvedValue({ id: 'var-1' });

      const initialBalance = {
        id: 'bal-1',
        storeId: 'store-1',
        variantId: 'var-1',
        quantityOnHand: 20,
        quantityReserved: 0,
      };

      prisma.inventoryBalance.findUnique.mockResolvedValue(initialBalance);
      prisma.inventoryBalance.update.mockResolvedValue({
        ...initialBalance,
        quantityOnHand: 35,
      });
      prisma.stockMovement.create.mockImplementation(({ data }: any) => Promise.resolve({ id: 'mov-1', ...data }));

      const result = await service.adjustStock('biz-1', 'store-1', 'user-1', {
        variantId: 'var-1',
        quantityDelta: 15,
        reason: 'Restock shipment received',
      });

      expect(result.balance.quantityOnHand).toBe(35);
      expect(prisma.stockMovement.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          storeId: 'store-1',
          variantId: 'var-1',
          movementType: MovementType.ADJUSTMENT_IN,
          quantityDelta: 15,
          quantityBefore: 20,
          quantityAfter: 35,
          createdByUserId: 'user-1',
        }),
      });
    });

    it('decreases stock on negative delta and records ADJUSTMENT_OUT in audit ledger', async () => {
      prisma.store.findFirst.mockResolvedValue({ id: 'store-1', businessId: 'biz-1', isActive: true });
      prisma.productVariant.findFirst.mockResolvedValue({ id: 'var-1' });

      const initialBalance = {
        id: 'bal-1',
        storeId: 'store-1',
        variantId: 'var-1',
        quantityOnHand: 20,
      };

      prisma.inventoryBalance.findUnique.mockResolvedValue(initialBalance);
      prisma.inventoryBalance.update.mockResolvedValue({
        ...initialBalance,
        quantityOnHand: 17,
      });
      prisma.stockMovement.create.mockImplementation(({ data }: any) => Promise.resolve({ id: 'mov-2', ...data }));

      const result = await service.adjustStock('biz-1', 'store-1', 'user-1', {
        variantId: 'var-1',
        quantityDelta: -3,
        reason: 'Damaged cans dropped on floor',
      });

      expect(result.balance.quantityOnHand).toBe(17);
      expect(prisma.stockMovement.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          movementType: MovementType.ADJUSTMENT_OUT,
          quantityDelta: -3,
          quantityBefore: 20,
          quantityAfter: 17,
        }),
      });
    });

    it('throws BadRequestException if negative delta exceeds current on-hand stock', async () => {
      prisma.store.findFirst.mockResolvedValue({ id: 'store-1', businessId: 'biz-1', isActive: true });
      prisma.productVariant.findFirst.mockResolvedValue({ id: 'var-1' });

      const initialBalance = {
        id: 'bal-1',
        storeId: 'store-1',
        variantId: 'var-1',
        quantityOnHand: 5,
      };

      prisma.inventoryBalance.findUnique.mockResolvedValue(initialBalance);

      await expect(
        service.adjustStock('biz-1', 'store-1', 'user-1', {
          variantId: 'var-1',
          quantityDelta: -10, // Attempting to deduct 10 from 5
          reason: 'Count correction',
        })
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getStockMovements', () => {
    it('returns formatted immutable ledger logs with user and product metadata', async () => {
      prisma.store.findFirst.mockResolvedValue({ id: 'store-1', businessId: 'biz-1', isActive: true });
      prisma.stockMovement.findMany.mockResolvedValue([
        {
          id: 'mov-1',
          createdAt: new Date('2026-10-18T10:00:00Z'),
          movementType: MovementType.ADJUSTMENT_IN,
          quantityDelta: 50,
          quantityBefore: 10,
          quantityAfter: 60,
          reason: 'Supplier restock',
          referenceType: 'ADJUSTMENT',
          referenceId: null,
          variant: {
            sku: 'COKE-330',
            barcode: '8850123456789',
            variantName: '330ml Can',
            product: { name: 'Coca Cola Can' },
          },
          user: {
            id: 'user-1',
            fullName: 'Dara Sok',
            email: 'manager@somnob.com',
            role: 'BRANCH_MANAGER',
          },
        },
      ]);
      prisma.stockMovement.count.mockResolvedValue(1);

      const result = await service.getStockMovements('biz-1', 'store-1', {});

      expect(result.movements).toHaveLength(1);
      const m = result.movements[0];
      expect(m.productName).toBe('Coca Cola Can');
      expect(m.quantityDelta).toBe(50);
      expect(m.initiatedBy).toBe('Dara Sok');
      expect(m.movementType).toBe(MovementType.ADJUSTMENT_IN);
    });
  });
});
