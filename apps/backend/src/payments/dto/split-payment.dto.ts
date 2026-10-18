import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PaymentMethod } from '@somnob/shared';

export class SplitTenderItemDto {
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @IsNumber()
  @Min(0.01)
  amountUsd: number;

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

export class SplitPaymentDto {
  @IsUUID()
  @IsNotEmpty()
  orderId: string;

  @IsOptional()
  @IsUUID()
  shiftId?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SplitTenderItemDto)
  tenders: SplitTenderItemDto[];
}
