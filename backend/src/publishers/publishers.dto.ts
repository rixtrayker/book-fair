import { IsNotEmpty, IsOptional } from 'class-validator';

export class CreatePublisherDto {
  @IsNotEmpty()
  name: string;

  @IsOptional()
  booth_number?: string;

  @IsOptional()
  hall_number?: string;

  @IsOptional()
  contact_info?: string;
}

export class UpdatePublisherDto {
  @IsOptional()
  name?: string;

  @IsOptional()
  booth_number?: string;

  @IsOptional()
  hall_number?: string;

  @IsOptional()
  contact_info?: string;
}
