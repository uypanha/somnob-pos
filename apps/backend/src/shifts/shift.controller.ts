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
import { ShiftService } from './shift.service';
import { OpenShiftDto } from './dto/open-shift.dto';
import { CloseShiftDto } from './dto/close-shift.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@somnob/shared';

@Controller('api/v1/shifts')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ShiftController {
  constructor(private readonly shiftService: ShiftService) {}

  @Get('registers')
  @Roles(Role.SUPER_ADMIN, Role.BRANCH_MANAGER, Role.CASHIER)
  getRegisters(@Query('storeId') storeId: string) {
    return this.shiftService.getRegisters(storeId);
  }

  @Get('current')
  @Roles(Role.SUPER_ADMIN, Role.BRANCH_MANAGER, Role.CASHIER)
  getCurrentShift(@Request() req: any, @Query('registerId') registerId?: string) {
    return this.shiftService.getCurrentShift(req.user.userId, registerId);
  }

  @Post('open')
  @Roles(Role.SUPER_ADMIN, Role.BRANCH_MANAGER, Role.CASHIER)
  openShift(@Request() req: any, @Body() dto: OpenShiftDto) {
    return this.shiftService.openShift(req.user.userId, dto);
  }

  @Post(':id/close')
  @Roles(Role.SUPER_ADMIN, Role.BRANCH_MANAGER, Role.CASHIER)
  closeShift(
    @Param('id') id: string,
    @Request() req: any,
    @Body() dto: CloseShiftDto,
  ) {
    return this.shiftService.closeShift(id, req.user.userId, dto);
  }

  @Get(':id/z-report')
  @Roles(Role.SUPER_ADMIN, Role.BRANCH_MANAGER, Role.CASHIER)
  getShiftSummary(@Param('id') id: string) {
    return this.shiftService.getShiftSummary(id);
  }
}
