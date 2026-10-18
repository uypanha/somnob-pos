import { IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class OpenShiftDto {
  @IsUUID()
  @IsNotEmpty()
  registerId: string;

  @IsNumber()
  @Min(0)
  openingFloatUsd: number;

  @IsNumber()
  @Min(0)
  openingFloatKhr: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
