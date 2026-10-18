import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StockAdjustmentDto, InventoryQueryDto, StockMovementQueryDto } from './dto/inventory.dto';
import { MovementType } from '@somnob/shared';
import { Prisma } from '@prisma/client';

@Injectable()
export class InventoryService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Validates that the store exists and belongs to the business.
   */
  private async validateStore(businessId: string, storeId: string) {
    const store = await this.prisma.store.findFirst({
      where: { id: storeId, businessId, isActive: true },
    });

    if (!store) {
      throw new NotFoundException(`Store branch '${storeId}' not found or inactive`);
    }

    return store;
  }

  /**
   * Fetches paginated inventory balances for a branch store with stock availability calculations.
   */
  async getStoreInventory(businessId: string, storeId: string, query: InventoryQueryDto) {
    await this.validateStore(businessId, storeId);

    const page = Math.max(1, query.page || 1);
    const limit = Math.max(1, Math.min(100, query.limit || 25));
    const skip = (page - 1) * limit;

    const where: Prisma.InventoryBalanceWhereInput = {
      storeId,
      variant: {
        deletedAt: null,
        product: {
          businessId,
          deletedAt: null,
        },
        ...(query.search
          ? {
              OR: [
                { sku: { contains: query.search, mode: 'insensitive' } },
                { barcode: { contains: query.search, mode: 'insensitive' } },
                { variantName: { contains: query.search, mode: 'insensitive' } },
                { product: { name: { contains: query.search, mode: 'insensitive' } } },
              ],
            }
          : {}),
      },
    };

    const [balances, total] = await Promise.all([
      this.prisma.inventoryBalance.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          variant: {
            product: { name: 'asc' },
          },
        },
        include: {
          variant: {
            include: {
              product: {
                select: { id: true, name: true, imageUrl: true, categoryId: true },
              },
            },
          },
        },
      }),
      this.prisma.inventoryBalance.count({ where }),
    ]);

    const items = balances
      .map((b) => {
        const available = Math.max(0, b.quantityOnHand - b.quantityReserved);
        const isLowStock = b.quantityOnHand <= b.reorderPoint;

        return {
          id: b.id,
          storeId: b.storeId,
          variantId: b.variantId,
          productName: b.variant.product.name,
          variantName: b.variant.variantName,
          sku: b.variant.sku,
          barcode: b.variant.barcode,
          unitOfMeasure: b.variant.unitOfMeasure,
          sellingPriceUsd: Number(b.variant.sellingPriceUsd),
          wholesalePriceUsd: b.variant.wholesalePriceUsd ? Number(b.variant.wholesalePriceUsd) : null,
          minWholesaleQty: b.variant.minWholesaleQty,
          quantityOnHand: b.quantityOnHand,
          quantityReserved: b.quantityReserved,
          quantityAvailable: available,
          reorderPoint: b.reorderPoint,
          isLowStock,
        };
      })
      .filter((item) => (query.lowStockOnly ? item.isLowStock : true));

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Retrieves low stock alert items for rapid manager reordering.
   */
  async getLowStockAlerts(businessId: string, storeId: string) {
    const inventory = await this.getStoreInventory(businessId, storeId, {
      lowStockOnly: true,
      limit: 100,
    });

    return {
      storeId,
      alertCount: inventory.items.length,
      alerts: inventory.items,
    };
  }

  /**
   * Adjusts stock quantity on hand with pessimistic row-locking and writes immutable audit ledger.
   */
  async adjustStock(businessId: string, storeId: string, userId: string, dto: StockAdjustmentDto) {
    await this.validateStore(businessId, storeId);

    // Verify variant exists in the business
    const variant = await this.prisma.productVariant.findFirst({
      where: {
        id: dto.variantId,
        product: { businessId, deletedAt: null },
      },
    });

    if (!variant) {
      throw new NotFoundException(`Product variant '${dto.variantId}' not found`);
    }

    return this.prisma.$transaction(async (tx) => {
      // Find or initialize balance record
      let balance = await tx.inventoryBalance.findUnique({
        where: {
          storeId_variantId: {
            storeId,
            variantId: dto.variantId,
          },
        },
      });

      if (!balance) {
        balance = await tx.inventoryBalance.create({
          data: {
            storeId,
            variantId: dto.variantId,
            quantityOnHand: 0,
            quantityReserved: 0,
          },
        });
      }

      const quantityBefore = balance.quantityOnHand;
      const quantityAfter = quantityBefore + dto.quantityDelta;

      if (quantityAfter < 0) {
        throw new BadRequestException(
          `Insufficient stock. Current on-hand is ${quantityBefore}, adjustment of ${dto.quantityDelta} would result in negative stock (${quantityAfter}).`
        );
      }

      // Update live inventory balance
      const updatedBalance = await tx.inventoryBalance.update({
        where: { id: balance.id },
        data: { quantityOnHand: quantityAfter },
      });

      // Determine movement type
      const movementType =
        dto.quantityDelta > 0 ? MovementType.ADJUSTMENT_IN : MovementType.ADJUSTMENT_OUT;

      // Append immutable stock movement ledger entry
      const movement = await tx.stockMovement.create({
        data: {
          storeId,
          variantId: dto.variantId,
          movementType,
          quantityDelta: dto.quantityDelta,
          quantityBefore,
          quantityAfter,
          referenceType: 'ADJUSTMENT',
          reason: dto.notes ? `${dto.reason}: ${dto.notes}` : dto.reason,
          createdByUserId: userId,
        },
      });

      return {
        balance: updatedBalance,
        movement,
      };
    });
  }

  /**
   * Retrieves the immutable stock movement audit ledger for a branch.
   */
  async getStockMovements(businessId: string, storeId: string, query: StockMovementQueryDto) {
    await this.validateStore(businessId, storeId);

    const page = Math.max(1, query.page || 1);
    const limit = Math.max(1, Math.min(100, query.limit || 30));
    const skip = (page - 1) * limit;

    const where: Prisma.StockMovementWhereInput = {
      storeId,
      ...(query.variantId ? { variantId: query.variantId } : {}),
      ...(query.movementType ? { movementType: query.movementType } : {}),
    };

    const [movements, total] = await Promise.all([
      this.prisma.stockMovement.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          variant: {
            select: {
              sku: true,
              barcode: true,
              variantName: true,
              product: {
                select: { name: true },
              },
            },
          },
          user: {
            select: { id: true, fullName: true, email: true, role: true },
          },
        },
      }),
      this.prisma.stockMovement.count({ where }),
    ]);

    return {
      movements: movements.map((m) => ({
        id: m.id,
        createdAt: m.createdAt,
        movementType: m.movementType,
        quantityDelta: m.quantityDelta,
        quantityBefore: m.quantityBefore,
        quantityAfter: m.quantityAfter,
        reason: m.reason,
        referenceType: m.referenceType,
        referenceId: m.referenceId,
        productName: m.variant.product.name,
        variantName: m.variant.variantName,
        sku: m.variant.sku,
        barcode: m.variant.barcode,
        initiatedBy: m.user ? m.user.fullName : 'System Process',
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
