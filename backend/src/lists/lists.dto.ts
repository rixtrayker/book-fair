import { IsNotEmpty, IsOptional, IsNumber, IsBoolean, IsIn, Min, Max } from 'class-validator';

export class CreateListDto {
  @IsNotEmpty()
  name: string;

  @IsOptional()
  description?: string;

  @IsOptional()
  @IsBoolean()
  is_public?: boolean;
}

export class UpdateListDto {
  @IsOptional()
  name?: string;

  @IsOptional()
  description?: string;

  @IsOptional()
  @IsBoolean()
  is_public?: boolean;
}

export class AddBookToListDto {
  @IsNumber()
  book_id: number;

  @IsOptional()
  @IsIn(['want', 'maybe', 'thinking', 'cancel'])
  status?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  priority?: number;

  @IsOptional()
  notes?: string;
}

export class UpdateListBookDto {
  @IsOptional()
  @IsIn(['want', 'maybe', 'thinking', 'cancel'])
  status?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  priority?: number;

  @IsOptional()
  notes?: string;
}

export class MergeListsDto {
  @IsNumber()
  source_list_id: number;

  @IsNumber()
  target_list_id: number;
}
