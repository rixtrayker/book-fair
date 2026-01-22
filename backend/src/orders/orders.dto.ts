import { IsNotEmpty, IsNumber, IsOptional, IsIn } from 'class-validator';

export class UpdateTrackingDto {
  @IsNumber()
  list_book_id: number;

  @IsOptional()
  @IsIn(['searching', 'found', 'purchased'])
  search_status?: string;

  @IsOptional()
  @IsNumber()
  actual_price?: number;

  @IsOptional()
  @IsNumber()
  discount_amount?: number;

  @IsOptional()
  notes?: string;
}

export class CreateOrderDto {
  @IsNumber()
  user_id: number;

  @IsNotEmpty()
  list_book_ids: number[];
}

export class UpdateOrderDto {
  @IsOptional()
  @IsIn(['pending', 'shipped', 'delivered'])
  shipping_status?: string;
}
