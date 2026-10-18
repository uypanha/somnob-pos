import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CloseShiftDto {
  @IsNumber()
  @Min(0)
  closingCashUsd: number;

  @IsNumber()
  @Min(0)
  closingCashKhr: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
