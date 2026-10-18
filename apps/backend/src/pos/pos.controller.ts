import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { PosService } from './pos.service';
import { PosCheckoutDto } from './dto/pos-checkout.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@somnob/shared';

@Controller('api/v1/pos')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PosController {
  constructor(private readonly posService: PosService) {}

  @Post('checkout')
  @Roles(Role.SUPER_ADMIN, Role.BRANCH_MANAGER, Role.CASHIER)
  checkout(@Request() req: any, @Body() dto: PosCheckoutDto) {
    return this.posService.checkout(req.user.userId, dto);
  }

  @Post('sync')
  @Roles(Role.SUPER_ADMIN, Role.BRANCH_MANAGER, Role.CASHIER)
  syncOfflineSales(@Request() req: any, @Body() dtos: PosCheckoutDto[]) {
    return this.posService.syncOfflineSales(req.user.userId, dtos);
  }

  @Get('orders/:id/receipt')
  @Roles(Role.SUPER_ADMIN, Role.BRANCH_MANAGER, Role.CASHIER)
  getReceipt(@Param('id') id: string) {
    return this.posService.getReceipt(id);
  }

  @Get('orders/recent')
  @Roles(Role.SUPER_ADMIN, Role.BRANCH_MANAGER, Role.CASHIER)
  getRecentOrders(
    @Query('storeId') storeId: string,
    @Query('limit') limit?: string,
  ) {
    return this.posService.getRecentOrders(
      storeId,
      limit ? parseInt(limit, 10) : 20,
    );
  }
}
