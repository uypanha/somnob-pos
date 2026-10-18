import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ProductService } from './product.service';
import { CreateProductDto, UpdateProductDto, ProductQueryDto } from './dto/product.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { AuthenticatedUser } from '../auth/interfaces/jwt-payload.interface';
import { Role } from '@somnob/shared';

@ApiTags('Catalog - Products')
@ApiBearerAuth()
@Controller('catalog/products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Post()
  @Roles(Role.SUPER_ADMIN, Role.BRANCH_MANAGER)
  @ApiOperation({ summary: 'Create a new product with variants and initialize store stock balances' })
  @ApiResponse({ status: 201, description: 'Product and variants created successfully' })
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateProductDto
  ) {
    return this.productService.createProduct(user.businessId, dto);
  }

  @Get('barcode/:barcode')
  @ApiOperation({ summary: 'Fast barcode / SKU lookup for cashier touchscreen scanning' })
  @ApiResponse({ status: 200, description: 'Product variant details with retail and wholesale pricing' })
  @ApiResponse({ status: 404, description: 'Barcode or SKU not found' })
  async findByBarcode(
    @CurrentUser() user: AuthenticatedUser,
    @Param('barcode') barcode: string
  ) {
    return this.productService.findByBarcode(user.businessId, barcode);
  }

  @Get()
  @ApiOperation({ summary: 'Paginated product list with search keyword and category filtering' })
  async findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ProductQueryDto
  ) {
    return this.productService.findAll(user.businessId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get single product details with all active variants and stock balances' })
  async findOne(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string
  ) {
    return this.productService.findOne(user.businessId, id);
  }

  @Put(':id')
  @Roles(Role.SUPER_ADMIN, Role.BRANCH_MANAGER)
  @ApiOperation({ summary: 'Update product information and variant pricing' })
  async update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProductDto
  ) {
    return this.productService.updateProduct(user.businessId, id, dto);
  }

  @Delete(':id')
  @Roles(Role.SUPER_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft-delete a product and its variants (Super Admin only)' })
  async remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string
  ) {
    await this.productService.deleteProduct(user.businessId, id);
  }
}
