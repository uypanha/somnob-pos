import {
  Controller,
  Get,
  Query,
  UseGuards,
  Header,
} from '@nestjs/common';
import { ReportService } from './report.service';
import { ReportQueryDto } from './dto/report-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@somnob/shared';

@Controller('api/v1/reports')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @Get('revenue')
  @Roles(Role.SUPER_ADMIN, Role.BRANCH_MANAGER)
  getRevenue(@Query() query: ReportQueryDto) {
    return this.reportService.getRevenueReport(query);
  }

  @Get('payments')
  @Roles(Role.SUPER_ADMIN, Role.BRANCH_MANAGER)
  getPayments(@Query() query: ReportQueryDto) {
    return this.reportService.getPaymentMethodBreakdown(query);
  }

  @Get('profit-margin')
  @Roles(Role.SUPER_ADMIN, Role.BRANCH_MANAGER)
  getProfitMargin(@Query() query: ReportQueryDto) {
    return this.reportService.getProfitMarginReport(query);
  }

  @Get('product-velocity')
  @Roles(Role.SUPER_ADMIN, Role.BRANCH_MANAGER)
  getProductVelocity(
    @Query() query: ReportQueryDto,
    @Query('limit') limit?: string,
  ) {
    return this.reportService.getProductVelocity(
      query,
      limit ? parseInt(limit, 10) : 10,
    );
  }

  @Get('shifts')
  @Roles(Role.SUPER_ADMIN, Role.BRANCH_MANAGER)
  getShifts(@Query() query: ReportQueryDto) {
    return this.reportService.getShiftAuditReport(query);
  }

  @Get('export')
  @Roles(Role.SUPER_ADMIN, Role.BRANCH_MANAGER)
  @Header('Content-Type', 'text/csv')
  @Header('Content-Disposition', 'attachment; filename="somnob-report.csv"')
  exportCsv(
    @Query('type') type: string = 'revenue',
    @Query() query: ReportQueryDto,
  ) {
    return this.reportService.exportCsv(type, query);
  }
}
