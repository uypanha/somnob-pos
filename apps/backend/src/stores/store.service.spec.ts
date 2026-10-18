import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { StoreService } from './store.service';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

describe('StoreService (Branch & Multi-Currency Settings)', () => {
  let service: StoreService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      store: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      storeExchangeRate: {
        findFirst: jest.fn(),
        create: jest.fn(),
        updateMany: jest.fn(),
      },
      $transaction: jest.fn((callback) => callback(prisma)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StoreService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<StoreService>(StoreService);
  });

  describe('createStore', () => {
    it('creates a store branch and initializes its USD/KHR exchange rate', async () => {
      prisma.store.findUnique.mockResolvedValue(null);
      prisma.store.create.mockResolvedValue({
        id: 'store-1',
        name: 'Siem Reap Branch',
        code: 'STR-003',
      });
      prisma.storeExchangeRate.create.mockResolvedValue({
        id: 'rate-1',
        storeId: 'store-1',
        rate: new Prisma.Decimal(4100.0),
        isActive: true,
      });

      const result = await service.createStore('biz-1', {
        name: 'Siem Reap Branch',
        code: 'STR-003',
        initialExchangeRate: 4100.0,
      });

      expect(result.id).toBe('store-1');
      expect(prisma.storeExchangeRate.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          storeId: 'store-1',
          rate: expect.any(Prisma.Decimal),
          isActive: true,
        }),
      });
    });

    it('rejects duplicate store code within business', async () => {
      prisma.store.findUnique.mockResolvedValue({ id: 'existing-store', code: 'STR-001' });

      await expect(
        service.createStore('biz-1', {
          name: 'Another Store',
          code: 'STR-001',
        })
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('updateExchangeRate', () => {
    it('deactivates older exchange rates and inserts new active rate', async () => {
      prisma.store.findFirst.mockResolvedValue({ id: 'store-1', businessId: 'biz-1' });
      prisma.storeExchangeRate.updateMany.mockResolvedValue({ count: 1 });
      prisma.storeExchangeRate.create.mockResolvedValue({
        id: 'rate-new',
        storeId: 'store-1',
        rate: new Prisma.Decimal(4150.0),
        isActive: true,
      });

      const result = await service.updateExchangeRate('biz-1', 'store-1', { rate: 4150.0 });

      expect(prisma.storeExchangeRate.updateMany).toHaveBeenCalledWith({
        where: { storeId: 'store-1', isActive: true },
        data: { isActive: false },
      });
      expect(result.id).toBe('rate-new');
    });

    it('throws NotFoundException if store does not exist', async () => {
      prisma.store.findFirst.mockResolvedValue(null);

      await expect(
        service.updateExchangeRate('biz-1', 'invalid-store', { rate: 4100.0 })
      ).rejects.toThrow(NotFoundException);
    });
  });
});
