import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStoreDto, UpdateStoreDto, UpdateExchangeRateDto } from './dto/store.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class StoreService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Retrieves all branch stores for the business.
   */
  async getStores(businessId: string) {
    return this.prisma.store.findMany({
      where: { businessId },
      orderBy: { name: 'asc' },
      include: {
        exchangeRates: {
          where: { isActive: true },
          take: 1,
        },
        _count: {
          select: {
            cashRegisters: true,
            userStores: true,
            orders: true,
          },
        },
      },
    });
  }

  /**
   * Retrieves single branch store details.
   */
  async getStoreById(businessId: string, id: string) {
    const store = await this.prisma.store.findFirst({
      where: { id, businessId },
      include: {
        exchangeRates: {
          where: { isActive: true },
        },
        cashRegisters: true,
        userStores: {
          include: {
            user: {
              select: { id: true, fullName: true, email: true, role: true },
            },
          },
        },
      },
    });

    if (!store) {
      throw new NotFoundException(`Store branch '${id}' not found`);
    }

    return store;
  }

  /**
   * Creates a new branch store and initializes exchange rate.
   */
  async createStore(businessId: string, dto: CreateStoreDto) {
    const existingCode = await this.prisma.store.findUnique({
      where: {
        businessId_code: {
          businessId,
          code: dto.code.trim().toUpperCase(),
        },
      },
    });

    if (existingCode) {
      throw new ConflictException(`Store code '${dto.code}' already exists`);
    }

    return this.prisma.$transaction(async (tx) => {
      const store = await tx.store.create({
        data: {
          businessId,
          name: dto.name.trim(),
          code: dto.code.trim().toUpperCase(),
          phone: dto.phone,
          address: dto.address,
        },
      });

      // Initialize exchange rate
      await tx.storeExchangeRate.create({
        data: {
          storeId: store.id,
          fromCurrency: 'USD',
          toCurrency: 'KHR',
          rate: new Prisma.Decimal(dto.initialExchangeRate || 4100.0),
          isActive: true,
        },
      });

      return store;
    });
  }

  /**
   * Updates store branch contact details or active status.
   */
  async updateStore(businessId: string, id: string, dto: UpdateStoreDto) {
    await this.getStoreById(businessId, id);

    return this.prisma.store.update({
      where: { id },
      data: {
        name: dto.name,
        phone: dto.phone,
        address: dto.address,
        isActive: dto.isActive,
      },
    });
  }

  /**
   * Retrieves the active exchange rate for a branch store.
   */
  async getActiveExchangeRate(storeId: string) {
    const rate = await this.prisma.storeExchangeRate.findFirst({
      where: { storeId, isActive: true },
      orderBy: { createdAt: 'desc' },
    });

    if (!rate) {
      // Default to 4100 if none configured
      return {
        fromCurrency: 'USD',
        toCurrency: 'KHR',
        rate: 4100.0,
      };
    }

    return {
      fromCurrency: rate.fromCurrency,
      toCurrency: rate.toCurrency,
      rate: Number(rate.rate),
    };
  }

  /**
   * Updates the live USD/KHR exchange rate for a branch.
   */
  async updateExchangeRate(businessId: string, storeId: string, dto: UpdateExchangeRateDto) {
    await this.getStoreById(businessId, storeId);

    return this.prisma.$transaction(async (tx) => {
      // Deactivate older rates
      await tx.storeExchangeRate.updateMany({
        where: { storeId, isActive: true },
        data: { isActive: false },
      });

      // Insert new active rate
      return tx.storeExchangeRate.create({
        data: {
          storeId,
          fromCurrency: 'USD',
          toCurrency: 'KHR',
          rate: new Prisma.Decimal(dto.rate),
          isActive: true,
        },
      });
    });
  }
}
