import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { PosService } from '../pos/pos.service';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentMethod, PricingTier, MovementType } from '@somnob/shared';
import { PosCheckoutDto } from '../pos/dto/pos-checkout.dto';

describe('Concurrency & Overselling Prevention Spec', () => {
  let posService: PosService;
  let mockInventoryBalance: {
    id: string;
    storeId: string;
    variantId: string;
    quantityOnHand: number;
    quantityReserved: number;
  };
  let createdOrders: any[];
  let stockMovements: any[];
  let txLock: Promise<void> = Promise.resolve();

  beforeEach(async () => {
    // Initial State: Only 1 unit remaining in branch inventory
    mockInventoryBalance = {
      id: 'inv-bal-001',
      storeId: 'store-branch-1',
      variantId: 'variant-cola-1',
      quantityOnHand: 1,
      quantityReserved: 0,
    };

    createdOrders = [];
    stockMovements = [];
    txLock = Promise.resolve();

    const mockPrisma: any = {
      payment: {
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockImplementation(async ({ data }) => ({
          id: `pay-${Math.random()}`,
          ...data,
        })),
      },
      store: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'store-branch-1',
          name: 'Main Store',
          exchangeRates: [{ fromCurrency: 'USD', toCurrency: 'KHR', rate: 4100 }],
        }),
      },
      customer: {
        findUnique: jest.fn().mockResolvedValue(null),
      },
      productVariant: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'variant-cola-1',
          variantName: '500ml Can',
          sku: 'COLA-500',
          sellingPriceUsd: 1.5,
          costPriceUsd: 0.8,
          isActive: true,
          deletedAt: null,
          product: {
            name: 'Coca Cola',
          },
        }),
      },
      order: {
        count: jest.fn().mockImplementation(async () => createdOrders.length),
        create: jest.fn().mockImplementation(async ({ data }) => {
          const newOrder = {
            id: `order-${createdOrders.length + 1}`,
            createdAt: new Date(),
            store: { name: 'Main Store', address: 'Street 1', phone: '+855 23 888 999' },
            cashier: { fullName: 'Cashier 1' },
            customer: null,
            items: [
              {
                productName: 'Coca Cola',
                variantName: '500ml Can',
                sku: 'COLA-500',
                quantity: 1,
                unitPriceUsd: 1.5,
                subtotalUsd: 1.5,
              },
            ],
            payments: [
              {
                paymentMethod: 'CASH',
                tenderedUsd: 2.0,
                tenderedKhr: 0,
                changeUsd: 0.5,
                changeKhr: 0,
              },
            ],
            ...data,
          };
          createdOrders.push(newOrder);
          return newOrder;
        }),
        findUnique: jest.fn().mockImplementation(async ({ where }) => {
          return createdOrders.find((o) => o.id === where.id) || null;
        }),
      },
      orderItem: {
        create: jest.fn().mockImplementation(async ({ data }) => ({
          id: `item-${Math.random()}`,
          ...data,
        })),
      },
      inventoryBalance: {
        findUnique: jest.fn().mockImplementation(async () => ({ ...mockInventoryBalance })),
        update: jest.fn().mockImplementation(async ({ data }) => {
          mockInventoryBalance.quantityOnHand = data.quantityOnHand;
          return { ...mockInventoryBalance };
        }),
      },
      stockMovement: {
        create: jest.fn().mockImplementation(async ({ data }) => {
          stockMovements.push(data);
          return { id: `mov-${stockMovements.length}`, ...data };
        }),
      },
      // Simulate PostgreSQL pessimistic row locking / transaction queue:
      // Transactions acquire exclusive row lock on the inventory record in order
      $transaction: jest.fn().mockImplementation(async (callback: (tx: any) => Promise<any>) => {
        let release: () => void;
        const nextLock = new Promise<void>((resolve) => {
          release = resolve;
        });
        const currentLock = txLock;
        txLock = txLock.then(() => nextLock);

        await currentLock;
        try {
          return await callback(mockPrisma);
        } finally {
          release!();
        }
      }),
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

  it('prevents overselling when 10 concurrent checkouts compete for the last single unit in stock', async () => {
    const totalConcurrentRequests = 10;
    const initialStock = mockInventoryBalance.quantityOnHand;
    expect(initialStock).toBe(1);

    const makeCheckoutDto = (index: number): PosCheckoutDto => ({
      storeId: 'store-branch-1',
      idempotencyKey: `idemp-race-${index}-${Date.now()}`,
      pricingTier: PricingTier.RETAIL,
      items: [
        {
          variantId: 'variant-cola-1',
          quantity: 1, // Every request wants 1 unit
        },
      ],
      payment: {
        paymentMethod: PaymentMethod.CASH,
        tenderedUsd: 2.0,
      },
    });

    // Launch all 10 parallel checkout requests simultaneously
    const requests = Array.from({ length: totalConcurrentRequests }).map((_, idx) =>
      posService.checkout('cashier-user-1', makeCheckoutDto(idx)),
    );

    const results = await Promise.allSettled(requests);

    const successfulCheckouts = results.filter((r) => r.status === 'fulfilled');
    const failedCheckouts = results.filter((r) => r.status === 'rejected');

    // Verification 1: Exactly 1 checkout must succeed
    expect(successfulCheckouts).toHaveLength(1);

    // Verification 2: Exactly 9 checkouts must be rejected
    expect(failedCheckouts).toHaveLength(9);

    // Verification 3: Every rejected checkout must fail with BadRequestException (insufficient inventory)
    failedCheckouts.forEach((result) => {
      if (result.status === 'rejected') {
        expect(result.reason).toBeInstanceOf(BadRequestException);
        expect(result.reason.message).toContain('Insufficient inventory');
      }
    });

    // Verification 4: Inventory quantity on hand must NEVER become negative
    expect(mockInventoryBalance.quantityOnHand).toBe(0);
    expect(mockInventoryBalance.quantityOnHand).toBeGreaterThanOrEqual(0);

    // Verification 5: Only 1 order created
    expect(createdOrders).toHaveLength(1);

    // Verification 6: Stock movement ledger records exactly 1 deduction
    expect(stockMovements).toHaveLength(1);
    expect(stockMovements[0].movementType).toBe(MovementType.SALE);
    expect(stockMovements[0].quantityBefore).toBe(1);
    expect(stockMovements[0].quantityAfter).toBe(0);
  });

  it('immediately rejects requests asking for more units than currently available on hand', async () => {
    mockInventoryBalance.quantityOnHand = 3;

    const excessiveRequest: PosCheckoutDto = {
      storeId: 'store-branch-1',
      idempotencyKey: 'idemp-excess-1',
      pricingTier: PricingTier.RETAIL,
      items: [
        {
          variantId: 'variant-cola-1',
          quantity: 4, // 4 requested, only 3 available
        },
      ],
      payment: {
        paymentMethod: PaymentMethod.CASH,
        tenderedUsd: 10.0,
      },
    };

    await expect(posService.checkout('cashier-user-1', excessiveRequest)).rejects.toThrow(
      BadRequestException,
    );

    // Stock remains unchanged
    expect(mockInventoryBalance.quantityOnHand).toBe(3);
  });
});
