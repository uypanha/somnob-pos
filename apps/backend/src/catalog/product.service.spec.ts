import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { ProductService } from './product.service';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

describe('ProductService', () => {
  let service: ProductService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      product: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        count: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      productVariant: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
      category: {
        findFirst: jest.fn(),
      },
      store: {
        findMany: jest.fn(),
      },
      inventoryBalance: {
        createMany: jest.fn(),
      },
      $transaction: jest.fn((callback) => callback(prisma)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<ProductService>(ProductService);
  });

  describe('createProduct', () => {
    it('creates product and variants, and initializes inventory balances', async () => {
      prisma.category.findFirst.mockResolvedValue({ id: 'cat-1' });
      prisma.productVariant.findUnique.mockResolvedValue(null); // Barcode unique
      prisma.store.findMany.mockResolvedValue([{ id: 'store-1' }, { id: 'store-2' }]);

      const mockCreatedProduct = {
        id: 'prod-1',
        name: 'Coca Cola Can',
        variants: [
          {
            id: 'var-1',
            sku: 'COKE-330',
            barcode: '8850123456789',
            sellingPriceUsd: new Prisma.Decimal(0.75),
            wholesalePriceUsd: new Prisma.Decimal(0.6),
            minWholesaleQty: 10,
          },
        ],
      };

      prisma.product.create.mockResolvedValue(mockCreatedProduct);

      const result = await service.createProduct('biz-1', {
        name: 'Coca Cola Can',
        categoryId: 'cat-1',
        variants: [
          {
            sku: 'COKE-330',
            barcode: '8850123456789',
            sellingPriceUsd: 0.75,
            wholesalePriceUsd: 0.6,
            minWholesaleQty: 10,
          },
        ],
      });

      expect(result.id).toBe('prod-1');
      expect(prisma.inventoryBalance.createMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({ storeId: 'store-1', variantId: 'var-1', quantityOnHand: 0 }),
          expect.objectContaining({ storeId: 'store-2', variantId: 'var-1', quantityOnHand: 0 }),
        ]),
        skipDuplicates: true,
      });
    });

    it('rejects product creation if barcode is already assigned to another variant', async () => {
      prisma.productVariant.findUnique.mockResolvedValue({ id: 'other-variant', barcode: '8850123456789' });

      await expect(
        service.createProduct('biz-1', {
          name: 'Fake Coke',
          variants: [
            {
              sku: 'FAKE-COKE',
              barcode: '8850123456789',
              sellingPriceUsd: 0.5,
            },
          ],
        })
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('findByBarcode (POS Scanning)', () => {
    it('returns variant and pricing details for cashier terminal', async () => {
      const mockVariant = {
        id: 'var-1',
        productId: 'prod-1',
        variantName: '330ml Can',
        sku: 'COKE-330',
        barcode: '8850123456789',
        costPriceUsd: new Prisma.Decimal(0.5),
        sellingPriceUsd: new Prisma.Decimal(0.75),
        wholesalePriceUsd: new Prisma.Decimal(0.6),
        minWholesaleQty: 12,
        unitOfMeasure: 'CAN',
        product: {
          id: 'prod-1',
          name: 'Coca Cola',
          imageUrl: 'https://images.example.com/coke.png',
          categoryId: 'cat-1',
        },
        inventoryBalances: [
          { storeId: 'store-1', quantityOnHand: 48, quantityReserved: 2 },
        ],
      };

      prisma.productVariant.findFirst.mockResolvedValue(mockVariant);

      const result = await service.findByBarcode('biz-1', '8850123456789');

      expect(result.variantId).toBe('var-1');
      expect(result.productName).toBe('Coca Cola');
      expect(result.sellingPriceUsd).toBe(0.75);
      expect(result.wholesalePriceUsd).toBe(0.6);
      expect(result.minWholesaleQty).toBe(12);
      expect(result.inventoryBalances[0].quantityOnHand).toBe(48);
    });

    it('throws NotFoundException when barcode or SKU is not found', async () => {
      prisma.productVariant.findFirst.mockResolvedValue(null);

      await expect(service.findByBarcode('biz-1', 'UNKNOWN-BARCODE')).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('deleteProduct (Soft Delete)', () => {
    it('marks product and variants as deleted and inactive', async () => {
      prisma.product.findFirst.mockResolvedValue({ id: 'prod-1', businessId: 'biz-1' });
      prisma.productVariant.updateMany.mockResolvedValue({ count: 2 });
      prisma.product.update.mockResolvedValue({ id: 'prod-1', isActive: false });

      const result = await service.deleteProduct('biz-1', 'prod-1');

      expect(result.isActive).toBe(false);
      expect(prisma.productVariant.updateMany).toHaveBeenCalledWith({
        where: { productId: 'prod-1' },
        data: expect.objectContaining({ isActive: false }),
      });
    });
  });
});
