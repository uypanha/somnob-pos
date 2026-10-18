import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException } from '@nestjs/common';
import { UserService } from './user.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from '../auth/auth.service';
import { Role } from '@somnob/shared';

describe('UserService (Employee & Branch Assignment)', () => {
  let service: UserService;
  let prisma: any;
  let authService: any;

  beforeEach(async () => {
    prisma = {
      user: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      userStore: {
        createMany: jest.fn(),
        deleteMany: jest.fn(),
      },
      $transaction: jest.fn((callback) => callback(prisma)),
    };

    authService = {
      hashPassword: jest.fn().mockResolvedValue('hashed_password'),
      hashPinCode: jest.fn().mockResolvedValue('hashed_pin'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuthService, useValue: authService },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  describe('createUser', () => {
    it('creates employee, hashes password and PIN, and assigns stores', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue({
        id: 'user-new',
        fullName: 'Vireak Men',
        email: 'vireak@somnob.com',
        role: Role.CASHIER,
        pinCodeHash: 'hashed_pin',
        isActive: true,
      });

      const result = await service.createUser('biz-1', {
        fullName: 'Vireak Men',
        email: 'vireak@somnob.com',
        password: 'Password123',
        role: Role.CASHIER,
        pinCode: '1234',
        storeIds: ['store-1'],
      });

      expect(result.id).toBe('user-new');
      expect(authService.hashPassword).toHaveBeenCalledWith('Password123');
      expect(authService.hashPinCode).toHaveBeenCalledWith('1234');
      expect(prisma.userStore.createMany).toHaveBeenCalledWith({
        data: [{ userId: 'user-new', storeId: 'store-1', isDefault: true }],
      });
    });

    it('rejects duplicate employee email', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'existing', email: 'taken@somnob.com' });

      await expect(
        service.createUser('biz-1', {
          fullName: 'Test User',
          email: 'taken@somnob.com',
          password: 'Password123',
          role: Role.CASHIER,
        })
      ).rejects.toThrow(ConflictException);
    });
  });
});
