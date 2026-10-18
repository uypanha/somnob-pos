import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsEmail,
  IsEnum,
  IsInt,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CustomerType, WholesaleStatus } from '@somnob/shared';

export class CreateCustomerDto {
  @ApiProperty({ example: 'Chan Dara', description: 'Customer full name' })
  @IsString()
  @IsNotEmpty({ message: 'Full name is required' })
  fullName: string;

  @ApiProperty({ example: '+855 12 345 678', description: 'Phone number' })
  @IsString()
  @IsNotEmpty({ message: 'Phone number is required' })
  phone: string;

  @ApiPropertyOptional({ example: 'dara@example.com', description: 'Email address' })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ enum: CustomerType, default: CustomerType.RETAIL })
  @IsEnum(CustomerType)
  @IsOptional()
  customerType?: CustomerType;

  @ApiPropertyOptional({ enum: WholesaleStatus, default: WholesaleStatus.NONE })
  @IsEnum(WholesaleStatus)
  @IsOptional()
  wholesaleStatus?: WholesaleStatus;
}

export class ReviewWholesaleDto {
  @ApiProperty({ enum: WholesaleStatus, example: WholesaleStatus.APPROVED, description: 'Approval decision: APPROVED or REJECTED' })
  @IsEnum(WholesaleStatus)
  @IsNotEmpty({ message: 'Decision is required' })
  status: WholesaleStatus;

  @ApiPropertyOptional({ example: 'Approved for grocery store bulk pricing tier' })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class CustomerQueryDto {
  @ApiPropertyOptional({ description: 'Search by full name, phone, or email' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ enum: CustomerType })
  @IsEnum(CustomerType)
  @IsOptional()
  customerType?: CustomerType;

  @ApiPropertyOptional({ enum: WholesaleStatus })
  @IsEnum(WholesaleStatus)
  @IsOptional()
  wholesaleStatus?: WholesaleStatus;

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
