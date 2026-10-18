import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WholesaleStatus, ShiftStatus } from '@somnob/shared';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Aggregates core business KPIs and operational alerts for the Admin Dashboard.
   */
  async getMetrics(businessId: string) {
    const [
      totalStores,
      totalProducts,
      totalCustomers,
      pendingWholesaleCount,
      lowStockBalances,
      activeShiftsCount,
    ] = await Promise.all([
      this.prisma.store.count({
        where: { businessId, isActive: true },
      }),
      this.prisma.product.count({
        where: { businessId, deletedAt: null, isActive: true },
      }),
      this.prisma.customer.count({
        where: { businessId },
      }),
      this.prisma.customer.count({
        where: { businessId, wholesaleStatus: WholesaleStatus.PENDING_APPROVAL },
      }),
      this.prisma.inventoryBalance.findMany({
        where: {
          store: { businessId },
        },
        select: {
          quantityOnHand: true,
          reorderPoint: true,
        },
      }),
      this.prisma.registerShift.count({
        where: {
          register: { store: { businessId } },
          status: ShiftStatus.OPEN,
        },
      }),
    ]);

    const lowStockCount = lowStockBalances.filter(
      (b) => b.quantityOnHand <= b.reorderPoint
    ).length;

    return {
      totalStores,
      totalProducts,
      totalCustomers,
      pendingWholesaleCount,
      lowStockCount,
      activeShiftsCount,
      timestamp: new Date().toISOString(),
    };
  }
}
