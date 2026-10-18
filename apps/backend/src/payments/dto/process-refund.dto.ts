import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class ProcessRefundDto {
  @IsString()
  @IsNotEmpty()
  reason: string;

  @IsOptional()
  @IsBoolean()
  restockItems?: boolean;
}
