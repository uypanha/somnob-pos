import { Injectable, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { PosLoginDto } from './dto/pos-login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { Role } from '@somnob/shared';

@Injectable()
export class AuthService {
  private readonly saltRounds = 10;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService
  ) {}

  /**
   * Securely hashes a plain-text password using bcrypt.
   */
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.saltRounds);
  }

  /**
   * Compares a plain-text password with a stored bcrypt hash.
   */
  async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Hashes a 4-6 digit cashier PIN code using bcrypt.
   */
  async hashPinCode(pin: string): Promise<string> {
    return bcrypt.hash(pin, this.saltRounds);
  }

  /**
   * Compares a cashier PIN code with a stored bcrypt hash.
   */
  async comparePinCode(pin: string, hash: string): Promise<boolean> {
    return bcrypt.compare(pin, hash);
  }

  /**
   * Standard login using email and password.
   */
  async login(loginDto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: loginDto.email.toLowerCase().trim() },
      include: {
        userStores: {
          include: {
            store: true,
          },
        },
      },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isPasswordValid = await this.comparePassword(loginDto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const storeIds = user.userStores.map((us) => us.storeId);
    const tokens = await this.generateTokens({
      sub: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role as Role,
      businessId: user.businessId,
      storeIds,
    });

    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        businessId: user.businessId,
      },
      stores: user.userStores.map((us) => ({
        id: us.store.id,
        name: us.store.name,
        code: us.store.code,
        isDefault: us.isDefault,
      })),
    };
  }

  /**
   * Cashier quick terminal switch using 4-6 digit PIN code at a specific store.
   */
  async loginWithPosPin(posLoginDto: PosLoginDto) {
    const store = await this.prisma.store.findUnique({
      where: { id: posLoginDto.storeId },
    });

    if (!store || !store.isActive) {
      throw new NotFoundException('Store branch is not active or does not exist');
    }

    // Find all users assigned to this branch who have a PIN configured
    const userStores = await this.prisma.userStore.findMany({
      where: { storeId: posLoginDto.storeId },
      include: {
        user: true,
      },
    });

    let matchedUser = null;

    for (const record of userStores) {
      const user = record.user;
      if (user.isActive && user.pinCodeHash) {
        const isPinMatch = await this.comparePinCode(posLoginDto.pinCode, user.pinCodeHash);
        if (isPinMatch) {
          matchedUser = user;
          break;
        }
      }
    }

    if (!matchedUser) {
      throw new UnauthorizedException('Invalid cashier PIN for this branch');
    }

    // Also get all storeIds this matched user has access to
    const allUserStores = await this.prisma.userStore.findMany({
      where: { userId: matchedUser.id },
      select: { storeId: true },
    });

    const storeIds = allUserStores.map((us) => us.storeId);
    const tokens = await this.generateTokens({
      sub: matchedUser.id,
      email: matchedUser.email,
      fullName: matchedUser.fullName,
      role: matchedUser.role as Role,
      businessId: matchedUser.businessId,
      storeIds,
    });

    return {
      ...tokens,
      user: {
        id: matchedUser.id,
        email: matchedUser.email,
        fullName: matchedUser.fullName,
        role: matchedUser.role,
        businessId: matchedUser.businessId,
      },
      activeStore: {
        id: store.id,
        name: store.name,
        code: store.code,
      },
    };
  }

  /**
   * Refreshes an expired access token using a valid refresh token.
   */
  async refreshToken(dto: RefreshTokenDto) {
    try {
      const refreshSecret = this.configService.get<string>(
        'JWT_REFRESH_SECRET',
        'somnob_refresh_secret_fallback'
      );

      const payload = this.jwtService.verify<JwtPayload>(dto.refreshToken, {
        secret: refreshSecret,
      });

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        include: {
          userStores: {
            select: { storeId: true },
          },
        },
      });

      if (!user || !user.isActive) {
        throw new UnauthorizedException('User session is invalid or user is inactive');
      }

      const storeIds = user.userStores.map((us) => us.storeId);
      const accessToken = this.jwtService.sign(
        {
          sub: user.id,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          businessId: user.businessId,
          storeIds,
        },
        {
          secret: this.configService.get<string>('JWT_ACCESS_SECRET', 'somnob_secret_fallback'),
          expiresIn: this.configService.get<string>('JWT_ACCESS_EXPIRATION', '15m'),
        }
      );

      return { accessToken };
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  /**
   * Internal helper to generate dual tokens (short-lived access + long-lived refresh).
   */
  private async generateTokens(payload: JwtPayload) {
    const accessSecret = this.configService.get<string>(
      'JWT_ACCESS_SECRET',
      'somnob_secret_fallback'
    );
    const accessExpiration = this.configService.get<string>('JWT_ACCESS_EXPIRATION', '15m');

    const refreshSecret = this.configService.get<string>(
      'JWT_REFRESH_SECRET',
      'somnob_refresh_secret_fallback'
    );
    const refreshExpiration = this.configService.get<string>('JWT_REFRESH_EXPIRATION', '7d');

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: accessSecret,
        expiresIn: accessExpiration,
      }),
      this.jwtService.signAsync(payload, {
        secret: refreshSecret,
        expiresIn: refreshExpiration,
      }),
    ]);

    return {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn: accessExpiration,
    };
  }
}
