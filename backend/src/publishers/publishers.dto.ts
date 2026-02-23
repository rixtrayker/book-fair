import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreatePublisherDto {
  @IsString({ message: 'validation.NAME_MUST_BE_STRING' })
  @IsNotEmpty({ message: 'validation.NAME_REQUIRED' })
  @MaxLength(255, { message: 'validation.NAME_TOO_LONG' })
  name: string;

  @IsOptional()
  @IsString({ message: 'validation.BOOTH_NUMBER_MUST_BE_STRING' })
  @MaxLength(50, { message: 'validation.BOOTH_NUMBER_TOO_LONG' })
  booth_number?: string;

  @IsOptional()
  @IsString({ message: 'validation.HALL_NUMBER_MUST_BE_STRING' })
  @MaxLength(50, { message: 'validation.HALL_NUMBER_TOO_LONG' })
  hall_number?: string;

  @IsOptional()
  @IsString({ message: 'validation.CONTACT_INFO_MUST_BE_STRING' })
  contact_info?: string;
}

export class UpdatePublisherDto {
  @IsOptional()
  @IsString({ message: 'validation.NAME_MUST_BE_STRING' })
  @MaxLength(255, { message: 'validation.NAME_TOO_LONG' })
  name?: string;

  @IsOptional()
  @IsString({ message: 'validation.BOOTH_NUMBER_MUST_BE_STRING' })
  @MaxLength(50, { message: 'validation.BOOTH_NUMBER_TOO_LONG' })
  booth_number?: string;

  @IsOptional()
  @IsString({ message: 'validation.HALL_NUMBER_MUST_BE_STRING' })
  @MaxLength(50, { message: 'validation.HALL_NUMBER_TOO_LONG' })
  hall_number?: string;

  @IsOptional()
  @IsString({ message: 'validation.CONTACT_INFO_MUST_BE_STRING' })
  contact_info?: string;
}
