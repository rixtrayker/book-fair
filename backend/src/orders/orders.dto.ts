import { IsInt, IsIn, IsOptional, IsNumber, IsArray, ArrayNotEmpty, IsString, Min } from 'class-validator';

export class UpdateTrackingDto {
  @IsInt({ message: 'validation.LIST_BOOK_ID_MUST_BE_INT' })
  @Min(1, { message: 'validation.LIST_BOOK_ID_INVALID' })
  list_book_id: number;

  @IsOptional()
  @IsIn(['searching', 'found', 'purchased'], { message: 'validation.SEARCH_STATUS_INVALID' })
  search_status?: string;

  @IsOptional()
  @IsNumber({}, { message: 'validation.PRICE_MUST_BE_NUMBER' })
  actual_price?: number;

  @IsOptional()
  @IsNumber({}, { message: 'validation.DISCOUNT_MUST_BE_NUMBER' })
  discount_amount?: number;

  @IsOptional()
  @IsString({ message: 'validation.NOTES_MUST_BE_STRING' })
  notes?: string;
}

export class CreateOrderDto {
  @IsInt({ message: 'validation.USER_ID_MUST_BE_INT' })
  @Min(1, { message: 'validation.USER_ID_INVALID' })
  user_id: number;

  @IsArray({ message: 'validation.LIST_BOOK_IDS_MUST_BE_ARRAY' })
  @ArrayNotEmpty({ message: 'validation.LIST_BOOK_IDS_REQUIRED' })
  @IsInt({ each: true, message: 'validation.LIST_BOOK_ID_MUST_BE_INT' })
  list_book_ids: number[];
}

export class UpdateOrderDto {
  @IsOptional()
  @IsIn(['pending', 'processing', 'shipped', 'delivered', 'cancelled'], { message: 'validation.SHIPPING_STATUS_INVALID' })
  shipping_status?: string;

  @IsOptional()
  @IsString({ message: 'validation.SHIPPING_NOTES_MUST_BE_STRING' })
  shipping_notes?: string;

  @IsOptional()
  @IsString({ message: 'validation.TRACKING_SERIAL_MUST_BE_STRING' })
  shipping_tracking_serial?: string;
}

export class AssignCollectorDto {
  @IsInt({ message: 'validation.COLLECTOR_ID_MUST_BE_INT' })
  @Min(1, { message: 'validation.COLLECTOR_ID_INVALID' })
  collectorId: number;
}
