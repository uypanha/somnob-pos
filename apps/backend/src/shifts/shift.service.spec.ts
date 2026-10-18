import { Test, TestingModule } from '@nestjs/testing';
import { ShiftService } from './shift.service';
import { PrismaService } from '../prisma/prisma.service';
import { ShiftStatus, PaymentMethod, PaymentStatus } from '@somnob/shared';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Decimal } from '@prisma/client/runtime/library';

describe('ShiftService', () => {
  let service: ShiftService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      cashRegister: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
      },
      registerShift: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ShiftService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<ShiftService>(ShiftService);
  });

  describe('openShift', () => {
    it('should throw NotFoundException if register does not exist', async () => {
      prisma.cashRegister.findUnique.mockResolvedValue(null);

      await expect(
        service.openShift('user-1', {
          registerId: 'reg-999',
          openingFloatUsd: 50,
          openingFloatKhr: 200000,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if register already has an active open shift', async () => {
      prisma.cashRegister.findUnique.mockResolvedValue({ id: 'reg-1', isActive: true });
      prisma.registerShift.findFirst.mockResolvedValueOnce({ id: 'shift-1', status: ShiftStatus.OPEN });

      await expect(
        service.openShift('user-1', {
          registerId: 'reg-1',
          openingFloatUsd: 50,
          openingFloatKhr: 200000,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if user already has an active open shift elsewhere', async () => {
      prisma.cashRegister.findUnique.mockResolvedValue({ id: 'reg-1', isActive: true });
      prisma.registerShift.findFirst
        .mockResolvedValueOnce(null) // register check passes
        .mockResolvedValueOnce({ id: 'shift-2', status: ShiftStatus.OPEN }); // user check fails

      await expect(
        service.openShift('user-1', {
          registerId: 'reg-1',
          openingFloatUsd: 50,
          openingFloatKhr: 200000,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should successfully open a new shift', async () => {
      prisma.cashRegister.findUnique.mockResolvedValue({ id: 'reg-1', name: 'Front Counter', code: 'REG-01', isActive: true });
      prisma.registerShift.findFirst.mockResolvedValue(null);
      prisma.registerShift.create.mockResolvedValue({
        id: 'shift-100',
        registerId: 'reg-1',
        userId: 'user-1',
        openedAt: new Date(),
        openingFloatUsd: new Decimal(50),
        openingFloatKhr: new Decimal(200000),
        status: ShiftStatus.OPEN,
        register: { name: 'Front Counter', code: 'REG-01' },
        user: { fullName: 'Sophea Chan' },
        payments: [],
      });

      const result = await service.openShift('user-1', {
        registerId: 'reg-1',
        openingFloatUsd: 50,
        openingFloatKhr: 200000,
      });

      expect(result.id).toBe('shift-100');
      expect(result.openingFloatUsd).toBe(50);
      expect(result.openingFloatKhr).toBe(200000);
      expect(result.status).toBe(ShiftStatus.OPEN);
    });
  });

  describe('closeShift', () => {
    it('should correctly calculate expected cash and over/short variance', async () => {
      prisma.registerShift.findUnique.mockResolvedValue({
        id: 'shift-100',
        status: ShiftStatus.OPEN,
        openingFloatUsd: new Decimal(50),
        openingFloatKhr: new Decimal(200000),
        payments: [
          {
            paymentMethod: PaymentMethod.CASH,
            amountUsd: new Decimal(10),
            tenderedUsd: new Decimal(20),
            changeUsd: new Decimal(10),
            tenderedKhr: new Decimal(0),
            changeKhr: new Decimal(0),
            orderId: 'ord-1',
          },
          {
            paymentMethod: PaymentMethod.CASH,
            amountUsd: new Decimal(5),
            tenderedUsd: new Decimal(0),
            changeUsd: new Decimal(0),
            tenderedKhr: new Decimal(40000),
            changeKhr: new Decimal(20000),
            orderId: 'ord-2',
          },
        ],
      });

      prisma.registerShift.update.mockImplementation(({ data }) => ({
        id: 'shift-100',
        ...data,
        register: { name: 'Front Counter', code: 'REG-01' },
        user: { fullName: 'Sophea Chan' },
        payments: [
          { paymentMethod: PaymentMethod.CASH, amountUsd: new Decimal(10), orderId: 'ord-1' },
          { paymentMethod: PaymentMethod.CASH, amountUsd: new Decimal(5), orderId: 'ord-2' },
        ],
      }));

      // Expected cash: USD: 50 + (20 - 10) = 60. KHR: 200,000 + (40,000 - 20,000) = 220,000.
      // Cashier counts closing cash: 62 USD (+$2 over) and 215,000 KHR (-5,000 short)
      const result = await service.closeShift('shift-100', 'user-1', {
        closingCashUsd: 62,
        closingCashKhr: 215000,
        notes: 'End of evening shift',
      });

      expect(prisma.registerShift.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            expectedCashUsd: new Decimal(60),
            expectedCashKhr: new Decimal(220000),
            differenceUsd: new Decimal(2),
            differenceKhr: new Decimal(-5000),
            status: ShiftStatus.CLOSED,
          }),
        }),
      );
    });
  });
});
