import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsBoolean,
  IsNumber,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateStoreDto {
  @ApiProperty({ example: 'BKK1 Flagship Store' })
  @IsString()
  @IsNotEmpty({ message: 'Store name is required' })
  name: string;

  @ApiProperty({ example: 'STR-001' })
  @IsString()
  @IsNotEmpty({ message: 'Store code is required' })
  code: string;

  @ApiPropertyOptional({ example: '+855 23 888 999' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ example: 'Street 302, BKK1, Phnom Penh' })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({ example: 4100.0 })
  @IsNumber()
  @Min(1)
  @IsOptional()
  initialExchangeRate?: number;
}

export class UpdateStoreDto {
  @ApiPropertyOptional({ example: 'BKK1 Flagship Store' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: '+855 23 888 999' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ example: 'Street 302, BKK1, Phnom Penh' })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class UpdateExchangeRateDto {
  @ApiProperty({ example: 4100.0, description: 'Exchange rate multiplier (1 USD = X KHR)' })
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(1, { message: 'Exchange rate must be positive' })
  rate: number;
}
