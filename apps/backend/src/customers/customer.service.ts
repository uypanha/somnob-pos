import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCustomerDto, ReviewWholesaleDto, CustomerQueryDto } from './dto/customer.dto';
import { CustomerType, WholesaleStatus } from '@somnob/shared';
import { Prisma } from '@prisma/client';

@Injectable()
export class CustomerService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Registers a new customer or wholesale applicant.
   */
  async createCustomer(businessId: string, dto: CreateCustomerDto) {
    const existing = await this.prisma.customer.findUnique({
      where: {
        businessId_phone: {
          businessId,
          phone: dto.phone.trim(),
        },
      },
    });

    if (existing) {
      throw new ConflictException(`Customer with phone number '${dto.phone}' already exists`);
    }

    return this.prisma.customer.create({
      data: {
        businessId,
        fullName: dto.fullName.trim(),
        phone: dto.phone.trim(),
        email: dto.email?.toLowerCase().trim() || null,
        customerType: dto.customerType || CustomerType.RETAIL,
        wholesaleStatus: dto.wholesaleStatus || WholesaleStatus.NONE,
      },
    });
  }

  /**
   * Retrieves paginated customers with wholesale status filters.
   */
  async getCustomers(businessId: string, query: CustomerQueryDto) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.max(1, Math.min(100, query.limit || 25));
    const skip = (page - 1) * limit;

    const where: Prisma.CustomerWhereInput = {
      businessId,
      ...(query.customerType ? { customerType: query.customerType } : {}),
      ...(query.wholesaleStatus ? { wholesaleStatus: query.wholesaleStatus } : {}),
      ...(query.search
        ? {
            OR: [
              { fullName: { contains: query.search, mode: 'insensitive' } },
              { phone: { contains: query.search, mode: 'insensitive' } },
              { email: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.customer.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          wholesaleApprovedBy: {
            select: { id: true, fullName: true, role: true },
          },
          _count: {
            select: { orders: true },
          },
        },
      }),
      this.prisma.customer.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Retrieves single customer profile by ID.
   */
  async getCustomerById(businessId: string, id: string) {
    const customer = await this.prisma.customer.findFirst({
      where: { id, businessId },
      include: {
        addresses: true,
        wholesaleApprovedBy: {
          select: { id: true, fullName: true, role: true },
        },
      },
    });

    if (!customer) {
      throw new NotFoundException(`Customer with ID '${id}' not found`);
    }

    return customer;
  }

  /**
   * Business owner/manager reviews and approves or rejects wholesale customer application.
   */
  async reviewWholesaleStatus(
    businessId: string,
    customerId: string,
    approverUserId: string,
    dto: ReviewWholesaleDto
  ) {
    await this.getCustomerById(businessId, customerId);

    if (dto.status !== WholesaleStatus.APPROVED && dto.status !== WholesaleStatus.REJECTED) {
      throw new BadRequestException('Decision must be either APPROVED or REJECTED');
    }

    const isApproved = dto.status === WholesaleStatus.APPROVED;

    return this.prisma.customer.update({
      where: { id: customerId },
      data: {
        wholesaleStatus: dto.status,
        customerType: isApproved ? CustomerType.WHOLESALE : CustomerType.RETAIL,
        wholesaleApprovedAt: new Date(),
        wholesaleApprovedById: approverUserId,
      },
      include: {
        wholesaleApprovedBy: {
          select: { id: true, fullName: true, role: true },
        },
      },
    });
  }
}
