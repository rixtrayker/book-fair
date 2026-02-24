import { IsNotEmpty, IsOptional, IsNumber, IsInt, Min, IsString, MaxLength, Max } from 'class-validator';

export class BookSearchDto {
  @IsString({ message: 'validation.SEARCH_MUST_BE_STRING' })
  @IsNotEmpty({ message: 'validation.SEARCH_REQUIRED' })
  q: string;

  @IsOptional()
  @IsInt({ message: 'validation.LIMIT_MUST_BE_INT' })
  @Min(1, { message: 'validation.LIMIT_MIN_1' })
  @Max(50, { message: 'validation.LIMIT_MAX_50' })
  limit?: number = 20;
}

export class CreateBookDto {
  @IsString({ message: 'validation.TITLE_MUST_BE_STRING' })
  @IsNotEmpty({ message: 'validation.TITLE_REQUIRED' })
  @MaxLength(500, { message: 'validation.TITLE_TOO_LONG' })
  title: string;

  @IsOptional()
  @IsString({ message: 'validation.AUTHOR_MUST_BE_STRING' })
  @MaxLength(255, { message: 'validation.AUTHOR_TOO_LONG' })
  author?: string;

  @IsOptional()
  @IsString({ message: 'validation.ISBN_MUST_BE_STRING' })
  @MaxLength(20, { message: 'validation.ISBN_TOO_LONG' })
  isbn?: string;

  @IsOptional()
  @IsInt({ message: 'validation.PUBLISHER_ID_MUST_BE_INT' })
  @Min(1, { message: 'validation.PUBLISHER_ID_INVALID' })
  publisher_id?: number;

  @IsOptional()
  @IsNumber({}, { message: 'validation.PRICE_MUST_BE_NUMBER' })
  @Min(0, { message: 'validation.PRICE_MUST_BE_POSITIVE' })
  original_price?: number;

  @IsOptional()
  @IsString({ message: 'validation.CATEGORY_MUST_BE_STRING' })
  @MaxLength(100, { message: 'validation.CATEGORY_TOO_LONG' })
  category?: string;
}

export class UpdateBookDto {
  @IsOptional()
  @IsString({ message: 'validation.TITLE_MUST_BE_STRING' })
  @MaxLength(500, { message: 'validation.TITLE_TOO_LONG' })
  title?: string;

  @IsOptional()
  @IsString({ message: 'validation.AUTHOR_MUST_BE_STRING' })
  @MaxLength(255, { message: 'validation.AUTHOR_TOO_LONG' })
  author?: string;

  @IsOptional()
  @IsString({ message: 'validation.ISBN_MUST_BE_STRING' })
  @MaxLength(20, { message: 'validation.ISBN_TOO_LONG' })
  isbn?: string;

  @IsOptional()
  @IsInt({ message: 'validation.PUBLISHER_ID_MUST_BE_INT' })
  @Min(1, { message: 'validation.PUBLISHER_ID_INVALID' })
  publisher_id?: number;

  @IsOptional()
  @IsNumber({}, { message: 'validation.PRICE_MUST_BE_NUMBER' })
  @Min(0, { message: 'validation.PRICE_MUST_BE_POSITIVE' })
  original_price?: number;

  @IsOptional()
  @IsString({ message: 'validation.CATEGORY_MUST_BE_STRING' })
  @MaxLength(100, { message: 'validation.CATEGORY_TOO_LONG' })
  category?: string;
}
