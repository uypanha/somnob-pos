import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  IsNumber,
  IsBoolean,
  IsArray,
  ValidateNested,
  Min,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProductVariantDto {
  @ApiPropertyOptional({ example: 'Standard', description: 'Variant name (e.g. 500ml, Red XL, Case 24x)' })
  @IsString()
  @IsOptional()
  variantName?: string;

  @ApiProperty({ example: 'COKE-330', description: 'Unique Stock Keeping Unit' })
  @IsString()
  @IsNotEmpty({ message: 'SKU is required' })
  sku: string;

  @ApiPropertyOptional({ example: '8850123456789', description: 'Barcode (EAN-13, UPC, Code128)' })
  @IsString()
  @IsOptional()
  barcode?: string;

  @ApiPropertyOptional({ example: 0.5, description: 'Cost price in USD' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @IsOptional()
  costPriceUsd?: number;

  @ApiProperty({ example: 0.75, description: 'Standard retail selling price in USD' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  sellingPriceUsd: number;

  @ApiPropertyOptional({ example: 0.6, description: 'Approved wholesale selling price in USD' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @IsOptional()
  wholesalePriceUsd?: number;

  @ApiPropertyOptional({ example: 10, description: 'Minimum quantity required to unlock wholesale price' })
  @IsNumber()
  @Min(1)
  @IsOptional()
  minWholesaleQty?: number;

  @ApiPropertyOptional({ example: 'PCS', description: 'Unit of measure (e.g. PCS, BOX, PACK, KG)' })
  @IsString()
  @IsOptional()
  unitOfMeasure?: string;
}

export class UpdateProductVariantDto {
  @ApiPropertyOptional({ example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' })
  @IsUUID('4')
  @IsOptional()
  id?: string;

  @ApiPropertyOptional({ example: 'Standard' })
  @IsString()
  @IsOptional()
  variantName?: string;

  @ApiPropertyOptional({ example: 'COKE-330' })
  @IsString()
  @IsOptional()
  sku?: string;

  @ApiPropertyOptional({ example: '8850123456789' })
  @IsString()
  @IsOptional()
  barcode?: string;

  @ApiPropertyOptional({ example: 0.5 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @IsOptional()
  costPriceUsd?: number;

  @ApiPropertyOptional({ example: 0.75 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @IsOptional()
  sellingPriceUsd?: number;

  @ApiPropertyOptional({ example: 0.6 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @IsOptional()
  wholesalePriceUsd?: number;

  @ApiPropertyOptional({ example: 10 })
  @IsNumber()
  @Min(1)
  @IsOptional()
  minWholesaleQty?: number;

  @ApiPropertyOptional({ example: 'PCS' })
  @IsString()
  @IsOptional()
  unitOfMeasure?: string;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class CreateProductDto {
  @ApiProperty({ example: 'Coca Cola Can', description: 'Product title' })
  @IsString()
  @IsNotEmpty({ message: 'Product title is required' })
  name: string;

  @ApiPropertyOptional({ example: 'Carbonated soft drink 330ml can' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: 'https://images.example.com/coke.png' })
  @IsString()
  @IsOptional()
  imageUrl?: string;

  @ApiPropertyOptional({ example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', description: 'Category UUID' })
  @IsUUID('4')
  @IsOptional()
  categoryId?: string;

  @ApiPropertyOptional({ example: false, description: 'True if product has multiple variants (e.g. sizes/flavors)' })
  @IsBoolean()
  @IsOptional()
  hasVariants?: boolean;

  @ApiProperty({ type: [CreateProductVariantDto], description: 'List of product variants (at least 1 required)' })
  @IsArray()
  @ArrayMinSize(1, { message: 'A product must have at least one variant' })
  @ValidateNested({ each: true })
  @Type(() => CreateProductVariantDto)
  variants: CreateProductVariantDto[];
}

export class UpdateProductDto {
  @ApiPropertyOptional({ example: 'Coca Cola Can' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: 'Updated description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: 'https://images.example.com/coke-new.png' })
  @IsString()
  @IsOptional()
  imageUrl?: string;

  @ApiPropertyOptional({ example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' })
  @IsUUID('4')
  @IsOptional()
  categoryId?: string;

  @ApiPropertyOptional({ example: false })
  @IsBoolean()
  @IsOptional()
  hasVariants?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({ type: [UpdateProductVariantDto] })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => UpdateProductVariantDto)
  variants?: UpdateProductVariantDto[];
}

export class ProductQueryDto {
  @ApiPropertyOptional({ description: 'Filter by category UUID' })
  @IsUUID('4')
  @IsOptional()
  categoryId?: string;

  @ApiPropertyOptional({ description: 'Search term for product name, variant name, SKU, or barcode' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ example: 1, description: 'Page number' })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ example: 20, description: 'Page size limit' })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @IsOptional()
  limit?: number = 20;

  @ApiPropertyOptional({ example: false, description: 'Whether to include inactive/archived products' })
  @Type(() => Boolean)
  @IsBoolean()
  @IsOptional()
  includeInactive?: boolean = false;
}
