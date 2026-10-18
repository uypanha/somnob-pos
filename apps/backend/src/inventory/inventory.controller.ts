import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { InventoryService } from './inventory.service';
import { StockAdjustmentDto, InventoryQueryDto, StockMovementQueryDto } from './dto/inventory.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { RequireStore } from '../auth/decorators/require-store.decorator';
import { AuthenticatedUser } from '../auth/interfaces/jwt-payload.interface';
import { Role } from '@somnob/shared';

@ApiTags('Inventory Management')
@ApiBearerAuth()
@Controller('stores/:storeId/inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get()
  @RequireStore()
  @ApiOperation({ summary: 'Get current on-hand and reserved inventory balances for a branch' })
  async getStoreInventory(
    @CurrentUser() user: AuthenticatedUser,
    @Param('storeId', ParseUUIDPipe) storeId: string,
    @Query() query: InventoryQueryDto
  ) {
    return this.inventoryService.getStoreInventory(user.businessId, storeId, query);
  }

  @Get('low-stock')
  @RequireStore()
  @ApiOperation({ summary: 'Get low stock items triggering reorder thresholds for branch replenishment' })
  async getLowStockAlerts(
    @CurrentUser() user: AuthenticatedUser,
    @Param('storeId', ParseUUIDPipe) storeId: string
  ) {
    return this.inventoryService.getLowStockAlerts(user.businessId, storeId);
  }

  @Post('adjust')
  @RequireStore()
  @Roles(Role.SUPER_ADMIN, Role.BRANCH_MANAGER)
  @ApiOperation({ summary: 'Adjust branch stock level with reason code and create immutable movement record' })
  @ApiResponse({ status: 201, description: 'Stock adjusted and movement ledger logged' })
  @ApiResponse({ status: 400, description: 'Adjustment would result in negative stock' })
  async adjustStock(
    @CurrentUser() user: AuthenticatedUser,
    @Param('storeId', ParseUUIDPipe) storeId: string,
    @Body() dto: StockAdjustmentDto
  ) {
    return this.inventoryService.adjustStock(user.businessId, storeId, user.id, dto);
  }

  @Get('movements')
  @RequireStore()
  @ApiOperation({ summary: 'View immutable stock movement audit ledger for a branch' })
  async getStockMovements(
    @CurrentUser() user: AuthenticatedUser,
    @Param('storeId', ParseUUIDPipe) storeId: string,
    @Query() query: StockMovementQueryDto
  ) {
    return this.inventoryService.getStockMovements(user.businessId, storeId, query);
  }
}
