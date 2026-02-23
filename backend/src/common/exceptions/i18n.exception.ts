import { HttpException, HttpStatus } from '@nestjs/common';

export class I18nException extends HttpException {
  constructor(
    public readonly translationKey: string,
    public readonly statusCode: number = HttpStatus.INTERNAL_SERVER_ERROR,
    public readonly args?: Record<string, any>,
  ) {
    super(translationKey, statusCode);
  }
}

export class NotFoundException extends I18nException {
  constructor(resource: string, id?: number | string) {
    super(
      `errors.${resource.toUpperCase()}_NOT_FOUND`,
      HttpStatus.NOT_FOUND,
      { id }
    );
  }
}

export class ForbiddenException extends I18nException {
  constructor(message: string = 'FORBIDDEN') {
    super(`errors.${message}`, HttpStatus.FORBIDDEN);
  }
}

export class UnauthorizedException extends I18nException {
  constructor(message: string = 'UNAUTHORIZED') {
    super(`errors.${message}`, HttpStatus.UNAUTHORIZED);
  }
}

export class BadRequestException extends I18nException {
  constructor(message: string, args?: Record<string, any>) {
    super(`errors.${message}`, HttpStatus.BAD_REQUEST, args);
  }
}

export class ConflictException extends I18nException {
  constructor(message: string, args?: Record<string, any>) {
    super(`errors.${message}`, HttpStatus.CONFLICT, args);
  }
}
