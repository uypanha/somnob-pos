import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from '../auth/auth.service';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';

@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authService: AuthService
  ) {}

  /**
   * Retrieves all users and employee accounts for the business.
   */
  async getUsers(businessId: string) {
    const users = await this.prisma.user.findMany({
      where: { businessId },
      orderBy: { fullName: 'asc' },
      include: {
        userStores: {
          include: {
            store: {
              select: { id: true, name: true, code: true },
            },
          },
        },
      },
    });

    return users.map((u) => ({
      id: u.id,
      fullName: u.fullName,
      email: u.email,
      role: u.role,
      hasPin: Boolean(u.pinCodeHash),
      isActive: u.isActive,
      createdAt: u.createdAt,
      assignedStores: u.userStores.map((us) => us.store),
    }));
  }

  /**
   * Creates an employee user with hashed credentials and store assignments.
   */
  async createUser(businessId: string, dto: CreateUserDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase().trim() },
    });

    if (existing) {
      throw new ConflictException(`User with email '${dto.email}' already exists`);
    }

    const passwordHash = await this.authService.hashPassword(dto.password);
    const pinCodeHash = dto.pinCode ? await this.authService.hashPinCode(dto.pinCode) : null;

    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          businessId,
          fullName: dto.fullName.trim(),
          email: dto.email.toLowerCase().trim(),
          passwordHash,
          role: dto.role,
          pinCodeHash,
        },
      });

      if (dto.storeIds && dto.storeIds.length > 0) {
        await tx.userStore.createMany({
          data: dto.storeIds.map((storeId, index) => ({
            userId: user.id,
            storeId,
            isDefault: index === 0,
          })),
        });
      }

      return {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        hasPin: Boolean(user.pinCodeHash),
        isActive: user.isActive,
      };
    });
  }

  /**
   * Updates an existing employee profile, credentials, or store assignments.
   */
  async updateUser(businessId: string, id: string, dto: UpdateUserDto) {
    const user = await this.prisma.user.findFirst({
      where: { id, businessId },
    });

    if (!user) {
      throw new NotFoundException(`User with ID '${id}' not found`);
    }

    const passwordHash = dto.password ? await this.authService.hashPassword(dto.password) : undefined;
    const pinCodeHash = dto.pinCode ? await this.authService.hashPinCode(dto.pinCode) : undefined;

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.user.update({
        where: { id },
        data: {
          fullName: dto.fullName?.trim(),
          role: dto.role,
          passwordHash,
          pinCodeHash,
          isActive: dto.isActive,
        },
      });

      if (dto.storeIds) {
        // Re-sync assigned stores
        await tx.userStore.deleteMany({ where: { userId: id } });
        if (dto.storeIds.length > 0) {
          await tx.userStore.createMany({
            data: dto.storeIds.map((storeId, index) => ({
              userId: id,
              storeId,
              isDefault: index === 0,
            })),
          });
        }
      }

      return {
        id: updated.id,
        fullName: updated.fullName,
        email: updated.email,
        role: updated.role,
        hasPin: Boolean(updated.pinCodeHash),
        isActive: updated.isActive,
      };
    });
  }
}
