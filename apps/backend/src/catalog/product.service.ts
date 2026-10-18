import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto, UpdateProductDto, ProductQueryDto } from './dto/product.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class ProductService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Creates a product with one or more variants and initializes store inventory balances.
   */
  async createProduct(businessId: string, dto: CreateProductDto) {
    // 1. Verify category if provided
    if (dto.categoryId) {
      const category = await this.prisma.category.findFirst({
        where: { id: dto.categoryId, businessId },
      });
      if (!category) {
        throw new NotFoundException('Category not found in this business');
      }
    }

    // 2. Validate barcodes and SKUs for uniqueness
    for (const variant of dto.variants) {
      if (variant.barcode) {
        const existingBarcode = await this.prisma.productVariant.findUnique({
          where: { barcode: variant.barcode },
        });
        if (existingBarcode) {
          throw new ConflictException(`Barcode '${variant.barcode}' is already in use by another product`);
        }
      }
    }

    // 3. Execute atomic creation within a transaction
    return this.prisma.$transaction(async (tx) => {
      // Create master product
      const product = await tx.product.create({
        data: {
          businessId,
          categoryId: dto.categoryId,
          name: dto.name,
          description: dto.description,
          imageUrl: dto.imageUrl,
          hasVariants: dto.hasVariants ?? dto.variants.length > 1,
          variants: {
            create: dto.variants.map((v) => ({
              variantName: v.variantName || 'Standard',
              sku: v.sku,
              barcode: v.barcode || null,
              costPriceUsd: new Prisma.Decimal(v.costPriceUsd ?? 0.0),
              sellingPriceUsd: new Prisma.Decimal(v.sellingPriceUsd),
              wholesalePriceUsd: v.wholesalePriceUsd ? new Prisma.Decimal(v.wholesalePriceUsd) : null,
              minWholesaleQty: v.minWholesaleQty ?? 1,
              unitOfMeasure: v.unitOfMeasure || 'PCS',
            })),
          },
        },
        include: {
          category: true,
          variants: true,
        },
      });

      // 4. Fetch all branch stores of this business to initialize zero inventory balances
      const stores = await tx.store.findMany({
        where: { businessId },
        select: { id: true },
      });

      if (stores.length > 0 && product.variants.length > 0) {
        const balanceData: Array<{
          storeId: string;
          variantId: string;
          quantityOnHand: number;
          quantityReserved: number;
        }> = [];

        for (const store of stores) {
          for (const variant of product.variants) {
            balanceData.push({
              storeId: store.id,
              variantId: variant.id,
              quantityOnHand: 0,
              quantityReserved: 0,
            });
          }
        }

        await tx.inventoryBalance.createMany({
          data: balanceData,
          skipDuplicates: true,
        });
      }

      return product;
    });
  }

  /**
   * Fast barcode and SKU scanner lookup for POS terminals.
   */
  async findByBarcode(businessId: string, barcodeOrSku: string) {
    const cleanQuery = barcodeOrSku.trim();

    // Query variant by barcode or SKU
    const variant = await this.prisma.productVariant.findFirst({
      where: {
        deletedAt: null,
        isActive: true,
        OR: [{ barcode: cleanQuery }, { sku: cleanQuery }],
        product: {
          businessId,
          deletedAt: null,
          isActive: true,
        },
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            imageUrl: true,
            categoryId: true,
          },
        },
        inventoryBalances: {
          select: {
            storeId: true,
            quantityOnHand: true,
            quantityReserved: true,
          },
        },
      },
    });

    if (!variant) {
      throw new NotFoundException(`No product found with barcode or SKU '${cleanQuery}'`);
    }

    return {
      variantId: variant.id,
      productId: variant.productId,
      productName: variant.product.name,
      variantName: variant.variantName,
      sku: variant.sku,
      barcode: variant.barcode,
      imageUrl: variant.product.imageUrl,
      costPriceUsd: Number(variant.costPriceUsd),
      sellingPriceUsd: Number(variant.sellingPriceUsd),
      wholesalePriceUsd: variant.wholesalePriceUsd ? Number(variant.wholesalePriceUsd) : null,
      minWholesaleQty: variant.minWholesaleQty,
      unitOfMeasure: variant.unitOfMeasure,
      inventoryBalances: variant.inventoryBalances,
    };
  }

  /**
   * Paginated product search with category filtering and keyword matching.
   */
  async findAll(businessId: string, query: ProductQueryDto) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.max(1, Math.min(100, query.limit || 20));
    const skip = (page - 1) * limit;

    const where: Prisma.ProductWhereInput = {
      businessId,
      ...(query.includeInactive ? {} : { isActive: true, deletedAt: null }),
      ...(query.categoryId ? { categoryId: query.categoryId } : {}),
      ...(query.search
        ? {
            OR: [
              { name: { contains: query.search, mode: 'insensitive' } },
              { description: { contains: query.search, mode: 'insensitive' } },
              {
                variants: {
                  some: {
                    OR: [
                      { sku: { contains: query.search, mode: 'insensitive' } },
                      { barcode: { contains: query.search, mode: 'insensitive' } },
                      { variantName: { contains: query.search, mode: 'insensitive' } },
                    ],
                  },
                },
              },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          category: {
            select: { id: true, name: true, slug: true },
          },
          variants: {
            where: query.includeInactive ? {} : { deletedAt: null, isActive: true },
          },
        },
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Retrieves single product details with active variants.
   */
  async findOne(businessId: string, id: string) {
    const product = await this.prisma.product.findFirst({
      where: { id, businessId, deletedAt: null },
      include: {
        category: true,
        variants: {
          where: { deletedAt: null },
          include: {
            inventoryBalances: {
              include: {
                store: {
                  select: { id: true, name: true, code: true },
                },
              },
            },
          },
        },
      },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID '${id}' not found`);
    }

    return product;
  }

  /**
   * Updates product metadata and variant pricing.
   */
  async updateProduct(businessId: string, id: string, dto: UpdateProductDto) {
    await this.findOne(businessId, id);

    if (dto.categoryId) {
      const category = await this.prisma.category.findFirst({
        where: { id: dto.categoryId, businessId },
      });
      if (!category) {
        throw new NotFoundException('Category not found');
      }
    }

    return this.prisma.$transaction(async (tx) => {
      // Update master product fields
      const updated = await tx.product.update({
        where: { id },
        data: {
          name: dto.name,
          description: dto.description,
          imageUrl: dto.imageUrl,
          categoryId: dto.categoryId,
          hasVariants: dto.hasVariants,
          isActive: dto.isActive,
        },
        include: {
          category: true,
          variants: true,
        },
      });

      // Update variants if provided
      if (dto.variants && dto.variants.length > 0) {
        for (const v of dto.variants) {
          if (v.id) {
            await tx.productVariant.update({
              where: { id: v.id },
              data: {
                variantName: v.variantName,
                sku: v.sku,
                barcode: v.barcode,
                costPriceUsd: v.costPriceUsd !== undefined ? new Prisma.Decimal(v.costPriceUsd) : undefined,
                sellingPriceUsd: v.sellingPriceUsd !== undefined ? new Prisma.Decimal(v.sellingPriceUsd) : undefined,
                wholesalePriceUsd: v.wholesalePriceUsd !== undefined ? (v.wholesalePriceUsd ? new Prisma.Decimal(v.wholesalePriceUsd) : null) : undefined,
                minWholesaleQty: v.minWholesaleQty,
                unitOfMeasure: v.unitOfMeasure,
                isActive: v.isActive,
              },
            });
          }
        }
      }

      return updated;
    });
  }

  /**
   * Soft-deletes a product and all of its variants.
   */
  async deleteProduct(businessId: string, id: string) {
    await this.findOne(businessId, id);

    const now = new Date();

    return this.prisma.$transaction(async (tx) => {
      await tx.productVariant.updateMany({
        where: { productId: id },
        data: { deletedAt: now, isActive: false },
      });

      return tx.product.update({
        where: { id },
        data: { deletedAt: now, isActive: false },
      });
    });
  }
}
