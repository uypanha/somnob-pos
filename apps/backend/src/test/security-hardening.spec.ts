import { ExecutionContext, ForbiddenException, BadRequestException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from '../auth/guards/roles.guard';
import { StoreAccessGuard } from '../auth/guards/store-access.guard';
import { Role, PaymentMethod, PricingTier } from '@somnob/shared';
import { PosService } from '../pos/pos.service';
import { PrismaService } from '../prisma/prisma.service';
import { Test, TestingModule } from '@nestjs/testing';
import { PosCheckoutDto } from '../pos/dto/pos-checkout.dto';

describe('Security Hardening & Access Control Spec', () => {
  describe('RBAC Privilege Escalation Prevention (RolesGuard)', () => {
    let guard: RolesGuard;
    let reflector: Reflector;

    beforeEach(() => {
      reflector = new Reflector();
      guard = new RolesGuard(reflector);
    });

    function createMockContext(user?: any): ExecutionContext {
      return {
        getHandler: jest.fn(),
        getClass: jest.fn(),
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue({ user }),
        }),
      } as unknown as ExecutionContext;
    }

    it('rejects CASHIER from accessing Refund endpoint (restricted to SUPER_ADMIN & BRANCH_MANAGER)', () => {
      // Simulate PaymentController.processRefund metadata: [Role.SUPER_ADMIN, Role.BRANCH_MANAGER]
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([
        Role.SUPER_ADMIN,
        Role.BRANCH_MANAGER,
      ]);

      const cashierContext = createMockContext({
        userId: 'cashier-1',
        role: Role.CASHIER,
      });

      expect(() => guard.canActivate(cashierContext)).toThrow(ForbiddenException);
    });

    it('rejects CASHIER from accessing Wholesale Approval endpoint (restricted to SUPER_ADMIN & BRANCH_MANAGER)', () => {
      // Simulate CustomerController.reviewWholesale metadata: [Role.SUPER_ADMIN, Role.BRANCH_MANAGER]
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([
        Role.SUPER_ADMIN,
        Role.BRANCH_MANAGER,
      ]);

      const cashierContext = createMockContext({
        userId: 'cashier-1',
        role: Role.CASHIER,
      });

      expect(() => guard.canActivate(cashierContext)).toThrow(ForbiddenException);
    });

    it('rejects STOCK_CLERK from processing POS checkout (restricted to SUPER_ADMIN, BRANCH_MANAGER, CASHIER)', () => {
      // Simulate PosController.checkout metadata: [Role.SUPER_ADMIN, Role.BRANCH_MANAGER, Role.CASHIER]
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([
        Role.SUPER_ADMIN,
        Role.BRANCH_MANAGER,
        Role.CASHIER,
      ]);

      const clerkContext = createMockContext({
        userId: 'clerk-1',
        role: Role.STOCK_CLERK,
      });

      expect(() => guard.canActivate(clerkContext)).toThrow(ForbiddenException);
    });

    it('grants BRANCH_MANAGER access to authorized operations (e.g. refund & wholesale review)', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([
        Role.SUPER_ADMIN,
        Role.BRANCH_MANAGER,
      ]);

      const managerContext = createMockContext({
        userId: 'manager-1',
        role: Role.BRANCH_MANAGER,
      });

      expect(guard.canActivate(managerContext)).toBe(true);
    });

    it('grants SUPER_ADMIN universal access regardless of specific required role', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.BRANCH_MANAGER]);

      const adminContext = createMockContext({
        userId: 'admin-1',
        role: Role.SUPER_ADMIN,
      });

      expect(guard.canActivate(adminContext)).toBe(true);
    });
  });

  describe('Multi-Branch Tenant Isolation (StoreAccessGuard)', () => {
    let guard: StoreAccessGuard;
    let reflector: Reflector;

    beforeEach(() => {
      reflector = new Reflector();
      guard = new StoreAccessGuard(reflector);
      // Require store is active
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);
    });

    function createStoreContext(user: any, requestPayload: { params?: any; body?: any; query?: any; headers?: any }): ExecutionContext {
      return {
        getHandler: jest.fn(),
        getClass: jest.fn(),
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue({
            user,
            ...requestPayload,
          }),
        }),
      } as unknown as ExecutionContext;
    }

    it('blocks cashier assigned to Store A from executing operations on Store B', () => {
      const user = {
        userId: 'cashier-store-a',
        role: Role.CASHIER,
        storeIds: ['store-branch-a'],
      };

      const context = createStoreContext(user, {
        body: { storeId: 'store-branch-b' },
      });

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });

    it('allows cashier to operate on their assigned store branch', () => {
      const user = {
        userId: 'cashier-store-a',
        role: Role.CASHIER,
        storeIds: ['store-branch-a'],
      };

      const context = createStoreContext(user, {
        body: { storeId: 'store-branch-a' },
      });

      expect(guard.canActivate(context)).toBe(true);
    });

    it('allows SUPER_ADMIN cross-branch access even without explicit branch store assignment', () => {
      const superAdminUser = {
        userId: 'super-admin-1',
        role: Role.SUPER_ADMIN,
        storeIds: [],
      };

      const context = createStoreContext(superAdminUser, {
        body: { storeId: 'store-branch-anywhere' },
      });

      expect(guard.canActivate(context)).toBe(true);
    });

    it('rejects requests missing target storeId with BadRequestException', () => {
      const user = {
        userId: 'cashier-1',
        role: Role.CASHIER,
        storeIds: ['store-branch-a'],
      };

      const context = createStoreContext(user, {});

      expect(() => guard.canActivate(context)).toThrow(BadRequestException);
    });
  });

  describe('Idempotency & Replay Attack Defense', () => {
    let posService: PosService;
    let mockPrisma: any;

    beforeEach(async () => {
      mockPrisma = {
        payment: {
          findUnique: jest.fn(),
          create: jest.fn(),
        },
        store: {
          findUnique: jest.fn().mockResolvedValue({
            id: 'store-1',
            exchangeRates: [{ fromCurrency: 'USD', toCurrency: 'KHR', rate: 4100 }],
          }),
        },
        customer: {
          findUnique: jest.fn(),
        },
        order: {
          findUnique: jest.fn().mockResolvedValue({
            id: 'order-existing-123',
            orderNumber: 'POS-20261018-0001',
            totalUsd: 15.0,
            status: 'COMPLETED',
            createdAt: new Date(),
            items: [],
            payments: [],
            store: { name: 'Main Branch' },
            cashier: { fullName: 'Dara Sok' },
          }),
        },
        inventoryBalance: {
          findUnique: jest.fn(),
          update: jest.fn(),
        },
        stockMovement: {
          create: jest.fn(),
        },
        $transaction: jest.fn(async (cb) => cb(mockPrisma)),
      };

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          PosService,
          {
            provide: PrismaService,
            useValue: mockPrisma,
          },
        ],
      }).compile();

      posService = module.get<PosService>(PosService);
    });

    it('safely handles duplicate checkout requests with the same idempotency key without duplicate inventory deduction or charging', async () => {
      // Simulate that this idempotencyKey has already been processed previously
      const existingKey = 'idemp-duplicate-tx-999';
      mockPrisma.payment.findUnique.mockResolvedValue({
        id: 'payment-existing-1',
        idempotencyKey: existingKey,
        orderId: 'order-existing-123',
      });

      const checkoutDto: PosCheckoutDto = {
        storeId: 'store-1',
        idempotencyKey: existingKey,
        pricingTier: PricingTier.RETAIL,
        items: [{ variantId: 'var-1', quantity: 2 }],
        payment: {
          paymentMethod: PaymentMethod.CASH,
          tenderedUsd: 20.0,
        },
      };

      const receipt = await posService.checkout('cashier-1', checkoutDto);

      // Verification: Receipt for existing order returned immediately
      expect(receipt).toBeDefined();
      expect(receipt.orderId).toBe('order-existing-123');

      // Crucial security invariant: No inventory balance deduction or stock movement occurred
      expect(mockPrisma.inventoryBalance.update).not.toHaveBeenCalled();
      expect(mockPrisma.stockMovement.create).not.toHaveBeenCalled();
      expect(mockPrisma.payment.create).not.toHaveBeenCalled();
    });
  });
});
