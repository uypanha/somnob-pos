import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { AuthenticatedUser } from '../auth/interfaces/jwt-payload.interface';
import { Role } from '@somnob/shared';

@ApiTags('Admin Dashboard & KPIs')
@ApiBearerAuth()
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('metrics')
  @Roles(Role.SUPER_ADMIN, Role.BRANCH_MANAGER)
  @ApiOperation({ summary: 'Get business analytics, operational counts, and pending approval alerts' })
  @ApiResponse({ status: 200, description: 'Live operational KPIs' })
  async getMetrics(@CurrentUser() user: AuthenticatedUser) {
    return this.dashboardService.getMetrics(user.businessId);
  }
}
