import { IsNotEmpty, IsOptional, IsNumber, IsBoolean, IsIn, Min, Max, IsInt, IsString, IsEnum, MaxLength } from 'class-validator';
import { ListBookStatus } from '../common/constants';

export class CreateListDto {
  @IsString({ message: 'validation.NAME_MUST_BE_STRING' })
  @IsNotEmpty({ message: 'validation.NAME_REQUIRED' })
  @MaxLength(255, { message: 'validation.NAME_TOO_LONG' })
  name: string;

  @IsOptional()
  @IsString({ message: 'validation.DESCRIPTION_MUST_BE_STRING' })
  description?: string;

  @IsOptional()
  @IsIn(['public', 'private'], { message: 'validation.VISIBILITY_INVALID' })
  visibility?: string;
}

export class UpdateListDto {
  @IsOptional()
  @IsString({ message: 'validation.NAME_MUST_BE_STRING' })
  @MaxLength(255, { message: 'validation.NAME_TOO_LONG' })
  name?: string;

  @IsOptional()
  @IsString({ message: 'validation.DESCRIPTION_MUST_BE_STRING' })
  description?: string;

  @IsOptional()
  @IsIn(['public', 'private'], { message: 'validation.VISIBILITY_INVALID' })
  visibility?: string;
}

export class AddBookToListDto {
  @IsInt({ message: 'validation.BOOK_ID_MUST_BE_INT' })
  @Min(1, { message: 'validation.BOOK_ID_INVALID' })
  book_id: number;

  @IsOptional()
  @IsEnum(ListBookStatus, { message: 'validation.STATUS_INVALID' })
  status?: ListBookStatus;

  @IsOptional()
  @IsInt({ message: 'validation.PRIORITY_MUST_BE_INT' })
  @Min(1, { message: 'validation.PRIORITY_INVALID' })
  @Max(5, { message: 'validation.PRIORITY_INVALID' })
  priority?: number;

  @IsOptional()
  @IsString({ message: 'validation.NOTES_MUST_BE_STRING' })
  notes?: string;
}

export class UpdateListBookDto {
  @IsOptional()
  @IsEnum(ListBookStatus, { message: 'validation.STATUS_INVALID' })
  status?: ListBookStatus;

  @IsOptional()
  @IsInt({ message: 'validation.PRIORITY_MUST_BE_INT' })
  @Min(1, { message: 'validation.PRIORITY_INVALID' })
  @Max(5, { message: 'validation.PRIORITY_INVALID' })
  priority?: number;

  @IsOptional()
  @IsString({ message: 'validation.NOTES_MUST_BE_STRING' })
  notes?: string;

  @IsOptional()
  @IsInt({ message: 'validation.SORT_ORDER_MUST_BE_INT' })
  sort_order?: number;
}

export class MergeListsDto {
  @IsInt({ message: 'validation.LIST_ID_MUST_BE_INT' })
  @Min(1, { message: 'validation.LIST_ID_INVALID' })
  source_list_id: number;

  @IsInt({ message: 'validation.LIST_ID_MUST_BE_INT' })
  @Min(1, { message: 'validation.LIST_ID_INVALID' })
  target_list_id: number;
}

export class InviteCollectorDto {
  @IsInt({ message: 'validation.COLLECTOR_ID_MUST_BE_INT' })
  @Min(1, { message: 'validation.COLLECTOR_ID_INVALID' })
  collector_id: number;
}

export class AssignCollectorDto {
  @IsInt({ message: 'validation.COLLECTOR_ID_MUST_BE_INT' })
  @Min(1, { message: 'validation.COLLECTOR_ID_INVALID' })
  collector_id: number;
}

export class RespondInvitationDto {
  @IsBoolean({ message: 'validation.ACCEPT_MUST_BE_BOOLEAN' })
  accept: boolean;
}
