import { Controller, Post, Body, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { PosLoginDto } from './dto/pos-login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { Public } from './decorators/public.decorator';
import { CurrentUser } from './decorators/current-user.decorator';
import { AuthenticatedUser } from './interfaces/jwt-payload.interface';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Email and password authentication for administrators and staff' })
  @ApiResponse({ status: 200, description: 'Successfully authenticated, returns access and refresh tokens' })
  @ApiResponse({ status: 401, description: 'Invalid email or password' })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Public()
  @Post('pos-login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Quick terminal login using storeId and cashier 4-6 digit numeric PIN' })
  @ApiResponse({ status: 200, description: 'Cashier authenticated for specific branch station' })
  @ApiResponse({ status: 401, description: 'Invalid PIN for specified store' })
  async posLogin(@Body() posLoginDto: PosLoginDto) {
    return this.authService.loginWithPosPin(posLoginDto);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Exchange a valid refresh token for a fresh access token' })
  @ApiResponse({ status: 200, description: 'Returns a new access token' })
  @ApiResponse({ status: 401, description: 'Invalid or expired refresh token' })
  async refresh(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshToken(refreshTokenDto);
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current authenticated user session and assigned store permissions' })
  @ApiResponse({ status: 200, description: 'Authenticated user profile' })
  async getProfile(@CurrentUser() user: AuthenticatedUser) {
    return {
      user,
    };
  }
}
