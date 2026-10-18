import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { StoreService } from './store.service';
import { CreateStoreDto, UpdateStoreDto, UpdateExchangeRateDto } from './dto/store.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { AuthenticatedUser } from '../auth/interfaces/jwt-payload.interface';
import { Role } from '@somnob/shared';

@ApiTags('Store & Branch Management')
@ApiBearerAuth()
@Controller('stores')
export class StoreController {
  constructor(private readonly storeService: StoreService) {}

  @Get()
  @ApiOperation({ summary: 'List all branch stores' })
  async getStores(@CurrentUser() user: AuthenticatedUser) {
    return this.storeService.getStores(user.businessId);
  }

  @Post()
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create a new physical branch location (Super Admin only)' })
  @ApiResponse({ status: 201, description: 'Store created successfully' })
  async createStore(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateStoreDto
  ) {
    return this.storeService.createStore(user.businessId, dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get details for a specific branch store' })
  async getStoreById(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string
  ) {
    return this.storeService.getStoreById(user.businessId, id);
  }

  @Put(':id')
  @Roles(Role.SUPER_ADMIN, Role.BRANCH_MANAGER)
  @ApiOperation({ summary: 'Update store contact and operational details' })
  async updateStore(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateStoreDto
  ) {
    return this.storeService.updateStore(user.businessId, id, dto);
  }

  @Get(':id/exchange-rate')
  @ApiOperation({ summary: 'Get active USD/KHR exchange rate for store terminal' })
  async getExchangeRate(@Param('id', ParseUUIDPipe) id: string) {
    return this.storeService.getActiveExchangeRate(id);
  }

  @Put(':id/exchange-rate')
  @Roles(Role.SUPER_ADMIN, Role.BRANCH_MANAGER)
  @ApiOperation({ summary: 'Update live USD/KHR exchange rate for branch' })
  async updateExchangeRate(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateExchangeRateDto
  ) {
    return this.storeService.updateExchangeRate(user.businessId, id, dto);
  }
}
