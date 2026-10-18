import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  IsInt,
  IsBoolean,
  IsEnum,
  Min,
  NotEquals,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MovementType } from '@somnob/shared';

export class StockAdjustmentDto {
  @ApiProperty({ example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', description: 'Product variant UUID' })
  @IsUUID('4', { message: 'variantId must be a valid UUID' })
  @IsNotEmpty({ message: 'variantId is required' })
  variantId: string;

  @ApiProperty({ example: 10, description: 'Quantity change (+ for addition, - for reduction). Cannot be 0.' })
  @IsInt({ message: 'quantityDelta must be an integer' })
  @NotEquals(0, { message: 'quantityDelta cannot be 0' })
  quantityDelta: number;

  @ApiProperty({ example: 'Physical stock count variance', description: 'Reason for adjustment' })
  @IsString()
  @IsNotEmpty({ message: 'Reason is required for inventory audit trail' })
  reason: string;

  @ApiPropertyOptional({ example: 'Reconciled during month-end inventory check' })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class InventoryQueryDto {
  @ApiPropertyOptional({ example: 'Coke', description: 'Search term for product name, variant, SKU, or barcode' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ example: false, description: 'If true, only returns items where on-hand <= reorderPoint' })
  @Type(() => Boolean)
  @IsBoolean()
  @IsOptional()
  lowStockOnly?: boolean = false;

  @ApiPropertyOptional({ example: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ example: 25 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  limit?: number = 25;
}

export class StockMovementQueryDto {
  @ApiPropertyOptional({ description: 'Filter by product variant UUID' })
  @IsUUID('4')
  @IsOptional()
  variantId?: string;

  @ApiPropertyOptional({ enum: MovementType, description: 'Filter by movement type' })
  @IsEnum(MovementType)
  @IsOptional()
  movementType?: MovementType;

  @ApiPropertyOptional({ example: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ example: 30 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  limit?: number = 30;
}
