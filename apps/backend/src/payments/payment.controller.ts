import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { PaymentService } from './payment.service';
import { GenerateKhqrDto } from './dto/generate-khqr.dto';
import { ProcessRefundDto } from './dto/process-refund.dto';
import { SplitPaymentDto } from './dto/split-payment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@somnob/shared';

@Controller('api/v1/payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('khqr/generate')
  generateKhqr(@Body() dto: GenerateKhqrDto) {
    return this.paymentService.generateKhqr(dto);
  }

  @Post('split')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.BRANCH_MANAGER, Role.CASHIER)
  processSplitPayment(@Request() req: any, @Body() dto: SplitPaymentDto) {
    return this.paymentService.processSplitPayment(dto, req.user.userId);
  }

  @Post('orders/:id/refund')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.BRANCH_MANAGER)
  processRefund(
    @Param('id') id: string,
    @Request() req: any,
    @Body() dto: ProcessRefundDto,
  ) {
    return this.paymentService.processRefund(id, dto, req.user.userId);
  }

  @Get('orders/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.BRANCH_MANAGER, Role.CASHIER)
  getOrderPayments(@Param('id') id: string) {
    return this.paymentService.getOrderPayments(id);
  }
}
