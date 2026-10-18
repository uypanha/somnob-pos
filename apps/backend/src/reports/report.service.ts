import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ReportQueryDto } from './dto/report-query.dto';
import { OrderStatus, PaymentStatus, roundToDecimal } from '@somnob/shared';
import { Prisma } from '@prisma/client';

@Injectable()
export class ReportService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Builds the where filter for completed orders based on query parameters.
   */
  private buildOrderWhere(query: ReportQueryDto): Prisma.OrderWhereInput {
    const where: Prisma.OrderWhereInput = {
      status: OrderStatus.COMPLETED,
    };

    if (query.storeId) {
      where.storeId = query.storeId;
    }

    if (query.orderType) {
      where.orderType = query.orderType;
    }

    if (query.startDate || query.endDate) {
      where.createdAt = {};
      if (query.startDate) {
        where.createdAt.gte = new Date(query.startDate);
      }
      if (query.endDate) {
        where.createdAt.lte = new Date(query.endDate);
      }
    }

    return where;
  }

  /**
   * Revenue and Sales Summary Report.
   */
  async getRevenueReport(query: ReportQueryDto) {
    const where = this.buildOrderWhere(query);

    const orders = await this.prisma.order.findMany({
      where,
      select: {
        id: true,
        orderNumber: true,
        orderType: true,
        totalUsd: true,
        totalKhr: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    const totalOrders = orders.length;
    let totalRevenueUsd = 0;
    let totalRevenueKhr = 0;

    // Daily bucket aggregation
    const timelineMap = new Map<string, { date: string; orders: number; revenueUsd: number; revenueKhr: number }>();

    for (const ord of orders) {
      const usd = Number(ord.totalUsd);
      const khr = Number(ord.totalKhr);
      totalRevenueUsd += usd;
      totalRevenueKhr += khr;

      const dateKey = ord.createdAt.toISOString().slice(0, 10);
      const bucket = timelineMap.get(dateKey) || { date: dateKey, orders: 0, revenueUsd: 0, revenueKhr: 0 };
      bucket.orders += 1;
      bucket.revenueUsd = roundToDecimal(bucket.revenueUsd + usd, 2);
      bucket.revenueKhr += khr;
      timelineMap.set(dateKey, bucket);
    }

    totalRevenueUsd = roundToDecimal(totalRevenueUsd, 2);
    const avgOrderValueUsd = totalOrders > 0 ? roundToDecimal(totalRevenueUsd / totalOrders, 2) : 0;

    return {
      totalOrders,
      totalRevenueUsd,
      totalRevenueKhr,
      avgOrderValueUsd,
      timeline: Array.from(timelineMap.values()),
    };
  }

  /**
   * Payment Methods Tender Breakdown.
   */
  async getPaymentMethodBreakdown(query: ReportQueryDto) {
    const whereOrder = this.buildOrderWhere(query);

    const payments = await this.prisma.payment.findMany({
      where: {
        status: PaymentStatus.COMPLETED,
        order: whereOrder,
      },
      select: {
        id: true,
        paymentMethod: true,
        amountUsd: true,
        tenderedUsd: true,
        tenderedKhr: true,
      },
    });

    const breakdownMap = new Map<string, { method: string; count: number; totalUsd: number }>();
    let grandTotalUsd = 0;

    for (const p of payments) {
      const amount = Number(p.amountUsd);
      grandTotalUsd += amount;

      const current = breakdownMap.get(p.paymentMethod) || {
        method: p.paymentMethod,
        count: 0,
        totalUsd: 0,
      };
      current.count += 1;
      current.totalUsd = roundToDecimal(current.totalUsd + amount, 2);
      breakdownMap.set(p.paymentMethod, current);
    }

    const items = Array.from(breakdownMap.values()).map((b) => ({
      ...b,
      sharePercentage: grandTotalUsd > 0 ? roundToDecimal((b.totalUsd / grandTotalUsd) * 100, 1) : 0,
    }));

    return {
      grandTotalUsd: roundToDecimal(grandTotalUsd, 2),
      totalTransactions: payments.length,
      breakdown: items,
    };
  }

  /**
   * Profit Margin & Cost of Goods Sold (COGS) Report.
   */
  async getProfitMarginReport(query: ReportQueryDto) {
    const where = this.buildOrderWhere(query);

    const orders = await this.prisma.order.findMany({
      where,
      include: {
        items: true,
      },
    });

    let totalRevenueUsd = 0;
    let totalCogsUsd = 0;

    for (const ord of orders) {
      for (const item of ord.items) {
        const lineRev = Number(item.subtotalUsd);
        const lineCost = Number(item.costPriceUsd) * item.quantity;
        totalRevenueUsd += lineRev;
        totalCogsUsd += lineCost;
      }
    }

    totalRevenueUsd = roundToDecimal(totalRevenueUsd, 2);
    totalCogsUsd = roundToDecimal(totalCogsUsd, 2);
    const grossProfitUsd = roundToDecimal(totalRevenueUsd - totalCogsUsd, 2);
    const grossMarginPercentage =
      totalRevenueUsd > 0 ? roundToDecimal((grossProfitUsd / totalRevenueUsd) * 100, 1) : 0;

    return {
      totalRevenueUsd,
      totalCogsUsd,
      grossProfitUsd,
      grossMarginPercentage,
    };
  }

  /**
   * Product Velocity Analytics (Top Best-Sellers).
   */
  async getProductVelocity(query: ReportQueryDto, limit = 10) {
    const where = this.buildOrderWhere(query);

    const orderItems = await this.prisma.orderItem.findMany({
      where: {
        order: where,
      },
      select: {
        variantId: true,
        productName: true,
        variantName: true,
        sku: true,
        quantity: true,
        subtotalUsd: true,
        costPriceUsd: true,
      },
    });

    const productMap = new Map<
      string,
      {
        variantId: string;
        productName: string;
        variantName: string;
        sku: string;
        unitsSold: number;
        revenueUsd: number;
        costUsd: number;
      }
    >();

    for (const item of orderItems) {
      const current = productMap.get(item.variantId) || {
        variantId: item.variantId,
        productName: item.productName,
        variantName: item.variantName,
        sku: item.sku,
        unitsSold: 0,
        revenueUsd: 0,
        costUsd: 0,
      };

      current.unitsSold += item.quantity;
      current.revenueUsd = roundToDecimal(current.revenueUsd + Number(item.subtotalUsd), 2);
      current.costUsd = roundToDecimal(
        current.costUsd + Number(item.costPriceUsd) * item.quantity,
        2,
      );
      productMap.set(item.variantId, current);
    }

    const sorted = Array.from(productMap.values())
      .map((p) => {
        const profit = roundToDecimal(p.revenueUsd - p.costUsd, 2);
        const marginPct = p.revenueUsd > 0 ? roundToDecimal((profit / p.revenueUsd) * 100, 1) : 0;
        return {
          ...p,
          grossProfitUsd: profit,
          grossMarginPercentage: marginPct,
        };
      })
      .sort((a, b) => b.unitsSold - a.unitsSold)
      .slice(0, limit);

    return sorted;
  }

  /**
   * Cash Register Shift Audit and Over/Short Discrepancies.
   */
  async getShiftAuditReport(query: ReportQueryDto) {
    const shifts = await this.prisma.registerShift.findMany({
      where: {
        ...(query.storeId ? { register: { storeId: query.storeId } } : {}),
      },
      include: {
        register: true,
        user: { select: { fullName: true } },
      },
      orderBy: { openedAt: 'desc' },
      take: 20,
    });

    return shifts.map((s) => ({
      id: s.id,
      registerCode: s.register.code,
      registerName: s.register.name,
      cashierName: s.user.fullName,
      openedAt: s.openedAt.toISOString(),
      closedAt: s.closedAt ? s.closedAt.toISOString() : null,
      openingFloatUsd: Number(s.openingFloatUsd),
      openingFloatKhr: Number(s.openingFloatKhr),
      expectedCashUsd: s.expectedCashUsd ? Number(s.expectedCashUsd) : null,
      expectedCashKhr: s.expectedCashKhr ? Number(s.expectedCashKhr) : null,
      closingCashUsd: s.closingCashUsd ? Number(s.closingCashUsd) : null,
      closingCashKhr: s.closingCashKhr ? Number(s.closingCashKhr) : null,
      differenceUsd: s.differenceUsd ? Number(s.differenceUsd) : 0,
      differenceKhr: s.differenceKhr ? Number(s.differenceKhr) : 0,
      status: s.status,
      notes: s.notes,
    }));
  }

  /**
   * Export summary report as CSV.
   */
  async exportCsv(reportType: string, query: ReportQueryDto): Promise<string> {
    if (reportType === 'products') {
      const products = await this.getProductVelocity(query, 100);
      const headers = 'SKU,Product Name,Variant,Units Sold,Revenue (USD),Profit (USD),Margin (%)\n';
      const rows = products
        .map(
          (p) =>
            `"${p.sku}","${p.productName}","${p.variantName}",${p.unitsSold},${p.revenueUsd.toFixed(2)},${p.grossProfitUsd.toFixed(2)},${p.grossMarginPercentage}%`,
        )
        .join('\n');
      return headers + rows;
    } else {
      // Default: Revenue
      const rev = await this.getRevenueReport(query);
      const headers = 'Date,Total Orders,Revenue (USD),Revenue (KHR)\n';
      const rows = rev.timeline
        .map((t) => `"${t.date}",${t.orders},${t.revenueUsd.toFixed(2)},${t.revenueKhr}`)
        .join('\n');
      return headers + rows;
    }
  }
}
