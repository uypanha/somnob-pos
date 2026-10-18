import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { CustomerService } from './customer.service';
import { PrismaService } from '../prisma/prisma.service';
import { CustomerType, WholesaleStatus } from '@somnob/shared';

describe('CustomerService (Wholesale Approval Workflow)', () => {
  let service: CustomerService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      customer: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CustomerService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<CustomerService>(CustomerService);
  });

  describe('createCustomer', () => {
    it('creates retail customer with phone and name', async () => {
      prisma.customer.findUnique.mockResolvedValue(null);
      prisma.customer.create.mockImplementation(({ data }: any) =>
        Promise.resolve({ id: 'cust-1', ...data })
      );

      const result = await service.createCustomer('biz-1', {
        fullName: 'Dara Chan',
        phone: '+855 12 888 777',
      });

      expect(result.id).toBe('cust-1');
      expect(result.fullName).toBe('Dara Chan');
      expect(result.customerType).toBe(CustomerType.RETAIL);
      expect(result.wholesaleStatus).toBe(WholesaleStatus.NONE);
    });

    it('rejects duplicate customer phone number within the business', async () => {
      prisma.customer.findUnique.mockResolvedValue({ id: 'existing', phone: '+855 12 888 777' });

      await expect(
        service.createCustomer('biz-1', {
          fullName: 'Dara Chan',
          phone: '+855 12 888 777',
        })
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('reviewWholesaleStatus', () => {
    it('approves wholesale application: sets wholesaleStatus=APPROVED and customerType=WHOLESALE', async () => {
      const mockCustomer = {
        id: 'cust-1',
        businessId: 'biz-1',
        fullName: 'Sokheng Grocery Store',
        wholesaleStatus: WholesaleStatus.PENDING_APPROVAL,
        customerType: CustomerType.RETAIL,
      };

      prisma.customer.findFirst.mockResolvedValue(mockCustomer);
      prisma.customer.update.mockImplementation(({ data }: any) =>
        Promise.resolve({ ...mockCustomer, ...data })
      );

      const result = await service.reviewWholesaleStatus('biz-1', 'cust-1', 'owner-user-1', {
        status: WholesaleStatus.APPROVED,
        notes: 'Verified grocery shop registration license',
      });

      expect(result.wholesaleStatus).toBe(WholesaleStatus.APPROVED);
      expect(result.customerType).toBe(CustomerType.WHOLESALE);
      expect(result.wholesaleApprovedById).toBe('owner-user-1');
      expect(result.wholesaleApprovedAt).toBeDefined();
    });

    it('rejects wholesale application: sets wholesaleStatus=REJECTED and keeps customerType=RETAIL', async () => {
      const mockCustomer = {
        id: 'cust-2',
        businessId: 'biz-1',
        fullName: 'Individual Buyer',
        wholesaleStatus: WholesaleStatus.PENDING_APPROVAL,
        customerType: CustomerType.RETAIL,
      };

      prisma.customer.findFirst.mockResolvedValue(mockCustomer);
      prisma.customer.update.mockImplementation(({ data }: any) =>
        Promise.resolve({ ...mockCustomer, ...data })
      );

      const result = await service.reviewWholesaleStatus('biz-1', 'cust-2', 'owner-user-1', {
        status: WholesaleStatus.REJECTED,
        notes: 'Individual retail buyer without commercial license',
      });

      expect(result.wholesaleStatus).toBe(WholesaleStatus.REJECTED);
      expect(result.customerType).toBe(CustomerType.RETAIL);
      expect(result.wholesaleApprovedById).toBe('owner-user-1');
    });

    it('throws NotFoundException if customer does not exist', async () => {
      prisma.customer.findFirst.mockResolvedValue(null);

      await expect(
        service.reviewWholesaleStatus('biz-1', 'unknown-cust', 'owner-1', {
          status: WholesaleStatus.APPROVED,
        })
      ).rejects.toThrow(NotFoundException);
    });
  });
});
