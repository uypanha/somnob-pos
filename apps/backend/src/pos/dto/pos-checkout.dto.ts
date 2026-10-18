import {
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PaymentMethod, PricingTier } from '@somnob/shared';

export class PosCheckoutItemDto {
  @IsUUID()
  @IsNotEmpty()
  variantId: string;

  @IsInt()
  @Min(1)
  quantity: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  discountUsd?: number;
}

export class PosPaymentDto {
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @IsOptional()
  @IsNumber()
  @Min(0)
  tenderedUsd?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  tenderedKhr?: number;

  @IsOptional()
  @IsString()
  transactionRef?: string;
}

export class PosCheckoutDto {
  @IsString()
  @IsNotEmpty()
  idempotencyKey: string;

  @IsUUID()
  @IsNotEmpty()
  storeId: string;

  @IsOptional()
  @IsUUID()
  shiftId?: string;

  @IsOptional()
  @IsUUID()
  customerId?: string;

  @IsOptional()
  @IsEnum(PricingTier)
  pricingTier?: PricingTier;

  @IsOptional()
  @IsNumber()
  @Min(0)
  orderDiscountUsd?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  taxRatePercentage?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PosCheckoutItemDto)
  items: PosCheckoutItemDto[];

  @ValidateNested()
  @Type(() => PosPaymentDto)
  payment: PosPaymentDto;

  @IsOptional()
  isOfflineSale?: boolean;

  @IsOptional()
  @IsString()
  notes?: string;
}
