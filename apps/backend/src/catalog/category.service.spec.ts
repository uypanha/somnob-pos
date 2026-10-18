import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, BadRequestException, NotFoundException } from '@nestjs/common';
import { CategoryService } from './category.service';
import { PrismaService } from '../prisma/prisma.service';

describe('CategoryService', () => {
  let service: CategoryService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      category: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      product: {
        count: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoryService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<CategoryService>(CategoryService);
  });

  describe('createCategory', () => {
    it('successfully creates a category and auto-generates slug from name', async () => {
      prisma.category.findUnique.mockResolvedValue(null);
      prisma.category.create.mockImplementation(({ data }: any) =>
        Promise.resolve({ id: 'cat-1', ...data })
      );

      const result = await service.createCategory('biz-1', {
        name: 'Beverages & Soft Drinks',
      });

      expect(result.name).toBe('Beverages & Soft Drinks');
      expect(result.slug).toBe('beverages-soft-drinks');
      expect(prisma.category.create).toHaveBeenCalled();
    });

    it('rejects duplicate slug within the same business', async () => {
      prisma.category.findUnique.mockResolvedValue({ id: 'existing-cat', slug: 'beverages' });

      await expect(
        service.createCategory('biz-1', {
          name: 'Beverages',
          slug: 'beverages',
        })
      ).rejects.toThrow(ConflictException);
    });

    it('rejects non-existent parent category', async () => {
      prisma.category.findUnique.mockResolvedValue(null);
      prisma.category.findFirst.mockResolvedValue(null); // Parent not found

      await expect(
        service.createCategory('biz-1', {
          name: 'Fruit Juices',
          parentId: 'non-existent-parent',
        })
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('prevents a category from being its own parent', async () => {
      prisma.category.findFirst.mockResolvedValue({ id: 'cat-1', name: 'Beverages' });

      await expect(
        service.update('biz-1', 'cat-1', {
          parentId: 'cat-1',
        })
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('remove', () => {
    it('prevents deletion if products are assigned to the category', async () => {
      prisma.category.findFirst.mockResolvedValue({ id: 'cat-1', name: 'Beverages' });
      prisma.product.count.mockResolvedValue(5); // 5 products assigned

      await expect(service.remove('biz-1', 'cat-1')).rejects.toThrow(BadRequestException);
    });

    it('deletes category if no products are assigned', async () => {
      prisma.category.findFirst.mockResolvedValue({ id: 'cat-1', name: 'Beverages' });
      prisma.product.count.mockResolvedValue(0);
      prisma.category.delete.mockResolvedValue({ id: 'cat-1' });

      const result = await service.remove('biz-1', 'cat-1');
      expect(result.id).toBe('cat-1');
      expect(prisma.category.delete).toHaveBeenCalledWith({ where: { id: 'cat-1' } });
    });
  });
});
