import { IsNotEmpty, IsString, IsUUID, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class PosLoginDto {
  @ApiProperty({ example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', description: 'Store branch UUID where terminal is located' })
  @IsUUID('4', { message: 'storeId must be a valid UUID' })
  @IsNotEmpty({ message: 'storeId is required' })
  storeId: string;

  @ApiProperty({ example: '1234', description: 'Cashier 4-6 digit numeric PIN' })
  @IsString()
  @IsNotEmpty({ message: 'pinCode is required' })
  @Matches(/^\d{4,6}$/, { message: 'PIN code must be 4 to 6 numeric digits' })
  pinCode: string;
}
