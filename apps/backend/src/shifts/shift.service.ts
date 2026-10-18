import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OpenShiftDto } from './dto/open-shift.dto';
import { CloseShiftDto } from './dto/close-shift.dto';
import { ShiftStatus, PaymentStatus, PaymentMethod } from '@somnob/shared';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class ShiftService {
  constructor(private readonly prisma: PrismaService) {}

  async getRegisters(storeId: string) {
    return this.prisma.cashRegister.findMany({
      where: { storeId, isActive: true },
      orderBy: { code: 'asc' },
    });
  }

  async getCurrentShift(userId: string, registerId?: string) {
    const shift = await this.prisma.registerShift.findFirst({
      where: {
        status: ShiftStatus.OPEN,
        ...(registerId ? { registerId } : { userId }),
      },
      include: {
        register: true,
        user: {
          select: { id: true, fullName: true, email: true, role: true },
        },
        payments: {
          where: { status: PaymentStatus.COMPLETED },
        },
      },
      orderBy: { openedAt: 'desc' },
    });

    if (!shift) {
      return null;
    }

    return this.formatShiftSummary(shift);
  }

  async openShift(userId: string, dto: OpenShiftDto) {
    const register = await this.prisma.cashRegister.findUnique({
      where: { id: dto.registerId },
    });

    if (!register || !register.isActive) {
      throw new NotFoundException('Cash register not found or inactive');
    }

    // Guard: register must not already be in an open shift
    const existingRegisterShift = await this.prisma.registerShift.findFirst({
      where: {
        registerId: dto.registerId,
        status: ShiftStatus.OPEN,
      },
    });

    if (existingRegisterShift) {
      throw new BadRequestException('This cash register already has an active open shift');
    }

    // Guard: user must not have an open shift elsewhere
    const existingUserShift = await this.prisma.registerShift.findFirst({
      where: {
        userId,
        status: ShiftStatus.OPEN,
      },
    });

    if (existingUserShift) {
      throw new BadRequestException('You already have an active open shift on another register');
    }

    const newShift = await this.prisma.registerShift.create({
      data: {
        registerId: dto.registerId,
        userId,
        openingFloatUsd: new Decimal(dto.openingFloatUsd),
        openingFloatKhr: new Decimal(dto.openingFloatKhr),
        status: ShiftStatus.OPEN,
        notes: dto.notes,
      },
      include: {
        register: true,
        user: {
          select: { id: true, fullName: true, email: true, role: true },
        },
        payments: true,
      },
    });

    return this.formatShiftSummary(newShift);
  }

  async closeShift(shiftId: string, userId: string, dto: CloseShiftDto) {
    const shift = await this.prisma.registerShift.findUnique({
      where: { id: shiftId },
      include: {
        register: true,
        user: true,
        payments: {
          where: { status: PaymentStatus.COMPLETED },
        },
      },
    });

    if (!shift) {
      throw new NotFoundException('Shift not found');
    }

    if (shift.status !== ShiftStatus.OPEN) {
      throw new BadRequestException('Shift is already closed');
    }

    // Calculate actual cash collected during this shift
    let netCashSalesUsd = 0;
    let netCashSalesKhr = 0;

    for (const payment of shift.payments) {
      if (payment.paymentMethod === PaymentMethod.CASH) {
        const tenderedUsd = Number(payment.tenderedUsd);
        const changeUsd = Number(payment.changeUsd);
        const tenderedKhr = Number(payment.tenderedKhr);
        const changeKhr = Number(payment.changeKhr);

        netCashSalesUsd += (tenderedUsd - changeUsd);
        netCashSalesKhr += (tenderedKhr - changeKhr);
      }
    }

    const openingUsd = Number(shift.openingFloatUsd);
    const openingKhr = Number(shift.openingFloatKhr);

    const expectedCashUsd = Math.round((openingUsd + netCashSalesUsd) * 100) / 100;
    const expectedCashKhr = Math.round(openingKhr + netCashSalesKhr);

    const diffUsd = Math.round((dto.closingCashUsd - expectedCashUsd) * 100) / 100;
    const diffKhr = Math.round(dto.closingCashKhr - expectedCashKhr);

    const updatedShift = await this.prisma.registerShift.update({
      where: { id: shiftId },
      data: {
        closedAt: new Date(),
        closingCashUsd: new Decimal(dto.closingCashUsd),
        closingCashKhr: new Decimal(dto.closingCashKhr),
        expectedCashUsd: new Decimal(expectedCashUsd),
        expectedCashKhr: new Decimal(expectedCashKhr),
        differenceUsd: new Decimal(diffUsd),
        differenceKhr: new Decimal(diffKhr),
        status: ShiftStatus.CLOSED,
        notes: dto.notes ? `${shift.notes ? shift.notes + ' | ' : ''}${dto.notes}` : shift.notes,
      },
      include: {
        register: true,
        user: {
          select: { id: true, fullName: true, email: true, role: true },
        },
        payments: {
          where: { status: PaymentStatus.COMPLETED },
        },
      },
    });

    return this.formatShiftSummary(updatedShift);
  }

  async getShiftSummary(shiftId: string) {
    const shift = await this.prisma.registerShift.findUnique({
      where: { id: shiftId },
      include: {
        register: true,
        user: {
          select: { id: true, fullName: true, email: true, role: true },
        },
        payments: {
          where: { status: PaymentStatus.COMPLETED },
        },
      },
    });

    if (!shift) {
      throw new NotFoundException('Shift not found');
    }

    return this.formatShiftSummary(shift);
  }

  private formatShiftSummary(shift: any) {
    let cashSalesUsd = 0;
    let cardSalesUsd = 0;
    let khqrSalesUsd = 0;
    const orderIdSet = new Set<string>();

    for (const payment of shift.payments || []) {
      const amount = Number(payment.amountUsd);
      orderIdSet.add(payment.orderId);

      if (payment.paymentMethod === PaymentMethod.CASH) {
        cashSalesUsd += amount;
      } else if (payment.paymentMethod === PaymentMethod.CARD) {
        cardSalesUsd += amount;
      } else if (payment.paymentMethod === PaymentMethod.KHQR) {
        khqrSalesUsd += amount;
      }
    }

    return {
      id: shift.id,
      registerId: shift.registerId,
      registerName: shift.register?.name || 'Main Register',
      registerCode: shift.register?.code || 'REG-01',
      cashierId: shift.userId,
      cashierName: shift.user?.fullName || 'Cashier',
      openedAt: shift.openedAt,
      closedAt: shift.closedAt,
      openingFloatUsd: Number(shift.openingFloatUsd),
      openingFloatKhr: Number(shift.openingFloatKhr),
      closingCashUsd: shift.closingCashUsd ? Number(shift.closingCashUsd) : null,
      closingCashKhr: shift.closingCashKhr ? Number(shift.closingCashKhr) : null,
      expectedCashUsd: shift.expectedCashUsd ? Number(shift.expectedCashUsd) : null,
      expectedCashKhr: shift.expectedCashKhr ? Number(shift.expectedCashKhr) : null,
      differenceUsd: shift.differenceUsd ? Number(shift.differenceUsd) : null,
      differenceKhr: shift.differenceKhr ? Number(shift.differenceKhr) : null,
      totalOrders: orderIdSet.size,
      cashSalesUsd: Math.round(cashSalesUsd * 100) / 100,
      cardSalesUsd: Math.round(cardSalesUsd * 100) / 100,
      khqrSalesUsd: Math.round(khqrSalesUsd * 100) / 100,
      totalSalesUsd: Math.round((cashSalesUsd + cardSalesUsd + khqrSalesUsd) * 100) / 100,
      status: shift.status,
      notes: shift.notes,
    };
  }
}
