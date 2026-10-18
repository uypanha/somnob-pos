import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { OrderType } from '@somnob/shared';

export class ReportQueryDto {
  @IsOptional()
  @IsUUID()
  storeId?: string;

  @IsOptional()
  @IsEnum(OrderType)
  orderType?: OrderType;

  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;

  @IsOptional()
  @IsString()
  groupBy?: 'day' | 'month';
}
