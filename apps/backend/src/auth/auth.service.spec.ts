import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@somnob/shared';
import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: any;
  let jwtService: any;
  let configService: any;

  beforeEach(async () => {
    prisma = {
      user: {
        findUnique: jest.fn(),
      },
      store: {
        findUnique: jest.fn(),
      },
      userStore: {
        findMany: jest.fn(),
      },
    };

    jwtService = {
      signAsync: jest.fn().mockResolvedValue('mock_token'),
      sign: jest.fn().mockReturnValue('mock_access_token'),
      verify: jest.fn(),
    };

    configService = {
      get: jest.fn((key: string, defaultVal: string) => defaultVal),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: jwtService },
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('Password & PIN Hashing', () => {
    it('correctly hashes and verifies passwords', async () => {
      const rawPassword = 'SecretPassword123!';
      const hash = await service.hashPassword(rawPassword);

      expect(hash).toBeDefined();
      expect(hash).not.toEqual(rawPassword);

      const isValid = await service.comparePassword(rawPassword, hash);
      expect(isValid).toBe(true);

      const isInvalid = await service.comparePassword('WrongPassword', hash);
      expect(isInvalid).toBe(false);
    });

    it('correctly hashes and verifies cashier PIN codes', async () => {
      const rawPin = '1234';
      const hash = await service.hashPinCode(rawPin);

      expect(hash).toBeDefined();
      const isValid = await service.comparePinCode(rawPin, hash);
      expect(isValid).toBe(true);

      const isInvalid = await service.comparePinCode('9999', hash);
      expect(isInvalid).toBe(false);
    });
  });

  describe('Email & Password Login', () => {
    it('successfully logs in an active user with correct password', async () => {
      const passwordHash = await bcrypt.hash('CorrectPassword', 10);
      const mockUser = {
        id: 'user-uuid-1',
        email: 'cashier@somnob.com',
        fullName: 'Sophea Chan',
        role: Role.CASHIER,
        businessId: 'biz-uuid-1',
        passwordHash,
        isActive: true,
        userStores: [
          {
            storeId: 'store-uuid-1',
            isDefault: true,
            store: { id: 'store-uuid-1', name: 'BKK1 Branch', code: 'STR-001' },
          },
        ],
      };

      prisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.login({
        email: 'cashier@somnob.com',
        password: 'CorrectPassword',
      });

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.user.email).toBe('cashier@somnob.com');
      expect(result.stores).toHaveLength(1);
    });

    it('throws UnauthorizedException if user is not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.login({ email: 'unknown@somnob.com', password: 'password' })
      ).rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException if password does not match', async () => {
      const passwordHash = await bcrypt.hash('RealPassword', 10);
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'user@somnob.com',
        passwordHash,
        isActive: true,
        userStores: [],
      });

      await expect(
        service.login({ email: 'user@somnob.com', password: 'WrongPassword' })
      ).rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException if user is deactivated', async () => {
      const passwordHash = await bcrypt.hash('Password123', 10);
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'deactivated@somnob.com',
        passwordHash,
        isActive: false,
        userStores: [],
      });

      await expect(
        service.login({ email: 'deactivated@somnob.com', password: 'Password123' })
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('POS PIN Login', () => {
    it('successfully logs in cashier with valid PIN for assigned store', async () => {
      const pinHash = await bcrypt.hash('1234', 10);
      prisma.store.findUnique.mockResolvedValue({ id: 'store-1', name: 'BKK1', code: 'STR-001', isActive: true });
      prisma.userStore.findMany
        .mockResolvedValueOnce([
          {
            user: {
              id: 'cashier-1',
              email: 'cashier@somnob.com',
              fullName: 'Cashier 1',
              role: Role.CASHIER,
              businessId: 'biz-1',
              pinCodeHash: pinHash,
              isActive: true,
            },
          },
        ])
        .mockResolvedValueOnce([{ storeId: 'store-1' }]);

      const result = await service.loginWithPosPin({
        storeId: 'store-1',
        pinCode: '1234',
      });

      expect(result.user.id).toBe('cashier-1');
      expect(result.activeStore.id).toBe('store-1');
    });

    it('throws NotFoundException if store does not exist', async () => {
      prisma.store.findUnique.mockResolvedValue(null);

      await expect(
        service.loginWithPosPin({ storeId: 'missing-store', pinCode: '1234' })
      ).rejects.toThrow(NotFoundException);
    });

    it('throws UnauthorizedException if PIN does not match any cashier in store', async () => {
      const pinHash = await bcrypt.hash('1234', 10);
      prisma.store.findUnique.mockResolvedValue({ id: 'store-1', isActive: true });
      prisma.userStore.findMany.mockResolvedValueOnce([
        {
          user: {
            id: 'cashier-1',
            pinCodeHash: pinHash,
            isActive: true,
          },
        },
      ]);

      await expect(
        service.loginWithPosPin({ storeId: 'store-1', pinCode: '9999' })
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
