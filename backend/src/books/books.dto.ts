import { IsNotEmpty, IsOptional, IsNumber } from 'class-validator';

export class CreateBookDto {
  @IsNotEmpty()
  title: string;

  @IsOptional()
  author?: string;

  @IsOptional()
  isbn?: string;

  @IsNumber()
  publisher_id: number;

  @IsNumber()
  original_price: number;

  @IsOptional()
  category?: string;
}

export class UpdateBookDto {
  @IsOptional()
  title?: string;

  @IsOptional()
  author?: string;

  @IsOptional()
  isbn?: string;

  @IsOptional()
  @IsNumber()
  publisher_id?: number;

  @IsOptional()
  @IsNumber()
  original_price?: number;

  @IsOptional()
  category?: string;
}
