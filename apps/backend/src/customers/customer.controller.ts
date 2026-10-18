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
import { CustomerService } from './customer.service';
import { CreateCustomerDto, ReviewWholesaleDto, CustomerQueryDto } from './dto/customer.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { AuthenticatedUser } from '../auth/interfaces/jwt-payload.interface';
import { Role } from '@somnob/shared';

@ApiTags('Customer & Wholesale Management')
@ApiBearerAuth()
@Controller('customers')
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  @Post()
  @ApiOperation({ summary: 'Register a new customer or wholesale applicant' })
  @ApiResponse({ status: 201, description: 'Customer created successfully' })
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateCustomerDto
  ) {
    return this.customerService.createCustomer(user.businessId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all customers with wholesale status filters' })
  async getCustomers(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: CustomerQueryDto
  ) {
    return this.customerService.getCustomers(user.businessId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get single customer details' })
  async getCustomerById(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string
  ) {
    return this.customerService.getCustomerById(user.businessId, id);
  }

  @Post(':id/wholesale-review')
  @Roles(Role.SUPER_ADMIN, Role.BRANCH_MANAGER)
  @ApiOperation({ summary: 'Approve or reject customer wholesale status (Owner / Manager only)' })
  @ApiResponse({ status: 200, description: 'Wholesale review applied successfully' })
  async reviewWholesale(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReviewWholesaleDto
  ) {
    return this.customerService.reviewWholesaleStatus(user.businessId, id, user.id, dto);
  }
}
