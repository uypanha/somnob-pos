import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsEmail,
  IsEnum,
  IsArray,
  IsUUID,
  MinLength,
  Matches,
  IsBoolean,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Role } from '@somnob/shared';

export class CreateUserDto {
  @ApiProperty({ example: 'Sophea Chan' })
  @IsString()
  @IsNotEmpty({ message: 'Full name is required' })
  fullName: string;

  @ApiProperty({ example: 'sophea@somnob.com' })
  @IsEmail()
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @ApiProperty({ example: 'Cashier123!@#' })
  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters' })
  @IsNotEmpty({ message: 'Password is required' })
  password: string;

  @ApiProperty({ enum: Role, example: Role.CASHIER })
  @IsEnum(Role)
  @IsNotEmpty({ message: 'Role is required' })
  role: Role;

  @ApiPropertyOptional({ example: '1234', description: '4-6 digit POS quick switch PIN' })
  @IsString()
  @Matches(/^\d{4,6}$/, { message: 'PIN code must be 4 to 6 numeric digits' })
  @IsOptional()
  pinCode?: string;

  @ApiPropertyOptional({ type: [String], description: 'List of store branch UUIDs this user can access' })
  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  storeIds?: string[];
}

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'Sophea Chan' })
  @IsString()
  @IsOptional()
  fullName?: string;

  @ApiPropertyOptional({ enum: Role })
  @IsEnum(Role)
  @IsOptional()
  role?: Role;

  @ApiPropertyOptional({ example: 'NewPass123!@#' })
  @IsString()
  @MinLength(6)
  @IsOptional()
  password?: string;

  @ApiPropertyOptional({ example: '5678' })
  @IsString()
  @Matches(/^\d{4,6}$/)
  @IsOptional()
  pinCode?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  storeIds?: string[];

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
