import { Test, TestingModule } from '@nestjs/testing';
import { ReportService } from './report.service';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentMethod, ShiftStatus } from '@somnob/shared';
import { Decimal } from '@prisma/client/runtime/library';

describe('ReportService', () => {
  let service: ReportService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      order: {
        findMany: jest.fn(),
      },
      orderItem: {
        findMany: jest.fn(),
      },
      payment: {
        findMany: jest.fn(),
      },
      registerShift: {
        findMany: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<ReportService>(ReportService);
  });

  describe('getRevenueReport', () => {
    it('should aggregate revenue, average order value, and timeline buckets', async () => {
      prisma.order.findMany.mockResolvedValue([
        {
          id: 'ord-1',
          orderNumber: 'POS-001',
          totalUsd: new Decimal(20.0),
          totalKhr: new Decimal(82000),
          createdAt: new Date('2026-10-18T10:00:00Z'),
        },
        {
          id: 'ord-2',
          orderNumber: 'POS-002',
          totalUsd: new Decimal(30.0),
          totalKhr: new Decimal(123000),
          createdAt: new Date('2026-10-18T14:00:00Z'),
        },
      ]);

      const result = await service.getRevenueReport({});
      expect(result.totalOrders).toBe(2);
      expect(result.totalRevenueUsd).toBe(50.0);
      expect(result.totalRevenueKhr).toBe(205000);
      expect(result.avgOrderValueUsd).toBe(25.0);
      expect(result.timeline.length).toBe(1);
      expect(result.timeline[0].date).toBe('2026-10-18');
      expect(result.timeline[0].orders).toBe(2);
      expect(result.timeline[0].revenueUsd).toBe(50.0);
    });
  });

  describe('getPaymentMethodBreakdown', () => {
    it('should calculate tender breakdown and percentage shares', async () => {
      prisma.payment.findMany.mockResolvedValue([
        { paymentMethod: PaymentMethod.CASH, amountUsd: new Decimal(60.0) },
        { paymentMethod: PaymentMethod.KHQR, amountUsd: new Decimal(40.0) },
      ]);

      const result = await service.getPaymentMethodBreakdown({});
      expect(result.grandTotalUsd).toBe(100.0);
      expect(result.totalTransactions).toBe(2);

      const cashItem = result.breakdown.find((b) => b.method === PaymentMethod.CASH);
      const khqrItem = result.breakdown.find((b) => b.method === PaymentMethod.KHQR);

      expect(cashItem?.totalUsd).toBe(60.0);
      expect(cashItem?.sharePercentage).toBe(60.0);
      expect(khqrItem?.totalUsd).toBe(40.0);
      expect(khqrItem?.sharePercentage).toBe(40.0);
    });
  });

  describe('getProfitMarginReport', () => {
    it('should accurately calculate gross profit and margin percentage', async () => {
      prisma.order.findMany.mockResolvedValue([
        {
          items: [
            { subtotalUsd: new Decimal(10.0), costPriceUsd: new Decimal(3.0), quantity: 2 }, // Rev 10, Cost 6
            { subtotalUsd: new Decimal(15.0), costPriceUsd: new Decimal(4.0), quantity: 1 }, // Rev 15, Cost 4
          ],
        },
      ]);

      // Total Rev: 25.0, Total Cost: 10.0. Profit: 15.0. Margin: (15 / 25) * 100 = 60%
      const result = await service.getProfitMarginReport({});
      expect(result.totalRevenueUsd).toBe(25.0);
      expect(result.totalCogsUsd).toBe(10.0);
      expect(result.grossProfitUsd).toBe(15.0);
      expect(result.grossMarginPercentage).toBe(60.0);
    });
  });

  describe('getProductVelocity', () => {
    it('should rank products by quantity sold and revenue', async () => {
      prisma.orderItem.findMany.mockResolvedValue([
        {
          variantId: 'var-coke',
          productName: 'Coca-Cola',
          variantName: '330ml Can',
          sku: 'COKE-330',
          quantity: 24,
          subtotalUsd: new Decimal(20.4),
          costPriceUsd: new Decimal(0.5),
        },
        {
          variantId: 'var-lays',
          productName: "Lay's Classic",
          variantName: '50g Pack',
          sku: 'LAYS-50',
          quantity: 10,
          subtotalUsd: new Decimal(12.5),
          costPriceUsd: new Decimal(0.8),
        },
      ]);

      const topProducts = await service.getProductVelocity({});
      expect(topProducts.length).toBe(2);
      expect(topProducts[0].sku).toBe('COKE-330');
      expect(topProducts[0].unitsSold).toBe(24);
      expect(topProducts[1].sku).toBe('LAYS-50');
      expect(topProducts[1].unitsSold).toBe(10);
    });
  });

  describe('exportCsv', () => {
    it('should return valid CSV string format with headers', async () => {
      prisma.order.findMany.mockResolvedValue([
        {
          id: 'ord-1',
          orderNumber: 'POS-001',
          totalUsd: new Decimal(20.0),
          totalKhr: new Decimal(82000),
          createdAt: new Date('2026-10-18T10:00:00Z'),
        },
      ]);

      const csv = await service.exportCsv('revenue', {});
      expect(csv).toContain('Date,Total Orders,Revenue (USD),Revenue (KHR)');
      expect(csv).toContain('"2026-10-18",1,20.00,82000');
    });
  });
});
