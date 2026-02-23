import { IsInt, IsEnum, IsString, IsOptional, IsObject, Min } from 'class-validator';
import { NotificationType } from './notifications.interface';

export class CreateNotificationDto {
  @IsInt()
  @Min(1)
  userId: number;

  @IsEnum(NotificationType)
  type: NotificationType;

  @IsString()
  title: string;

  @IsString()
  message: string;

  @IsOptional()
  @IsObject()
  payload?: Record<string, any>;
}

export class MarkReadDto {
  @IsInt()
  @Min(1)
  notificationId: number;
}
