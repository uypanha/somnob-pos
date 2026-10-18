import { IsEnum, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';

export class GenerateKhqrDto {
  @IsUUID()
  @IsNotEmpty()
  orderId: string;

  @IsOptional()
  @IsEnum(['USD', 'KHR'])
  currency?: 'USD' | 'KHR';
}
