import { IsEnum, IsNotEmpty } from 'class-validator';
import { OrderStatus } from '@somnob/shared';

export class UpdateOrderStatusDto {
  @IsEnum(OrderStatus)
  @IsNotEmpty()
  status: OrderStatus;
}
