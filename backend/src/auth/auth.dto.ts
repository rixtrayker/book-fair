import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, MinLength, IsString, MaxLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'user@example.com', description: 'User email address' })
  @IsEmail({}, { message: 'validation.EMAIL_INVALID' })
  @IsNotEmpty({ message: 'validation.EMAIL_REQUIRED' })
  email: string;

  @ApiProperty({ example: 'password123', description: 'User password (min 6 characters)' })
  @IsString({ message: 'validation.PASSWORD_MUST_BE_STRING' })
  @IsNotEmpty({ message: 'validation.PASSWORD_REQUIRED' })
  @MinLength(6, { message: 'validation.PASSWORD_TOO_SHORT' })
  password: string;

  @ApiProperty({ example: 'John Doe', description: 'User full name' })
  @IsString({ message: 'validation.NAME_MUST_BE_STRING' })
  @IsNotEmpty({ message: 'validation.NAME_REQUIRED' })
  @MaxLength(255, { message: 'validation.NAME_TOO_LONG' })
  name: string;
}

export class LoginDto {
  @ApiProperty({ example: 'user@example.com', description: 'User email address' })
  @IsEmail({}, { message: 'validation.EMAIL_INVALID' })
  @IsNotEmpty({ message: 'validation.EMAIL_REQUIRED' })
  email: string;

  @ApiProperty({ example: 'password123', description: 'User password' })
  @IsNotEmpty({ message: 'validation.PASSWORD_REQUIRED' })
  password: string;
}
