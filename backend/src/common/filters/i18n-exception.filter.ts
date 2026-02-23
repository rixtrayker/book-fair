import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { Request, Response } from 'express';

@Catch()
export class I18nExceptionFilter implements ExceptionFilter {
  constructor(private readonly i18n: I18nService) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    
    const lang = (request.headers['accept-language'] as string) || 'ar';

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string;
    let code = 'INTERNAL_ERROR';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const responseObj = exceptionResponse as Record<string, any>;
        
        if (responseObj['message']) {
          const messages = Array.isArray(responseObj['message'])
            ? responseObj['message']
            : [responseObj['message']];
          
          message = messages.map(msg => {
            const translation = this.i18n.translate(`validation.${msg}`, { lang });
            return translation !== `validation.${msg}` ? translation : msg;
          }).join(', ');
          code = 'VALIDATION_ERROR';
        } else if (responseObj['error']) {
          code = responseObj['error'];
          message = this.i18n.translate(`errors.${code}`, { lang });
          if (message === `errors.${code}`) {
            message = responseObj['error'];
          }
        } else {
          message = this.i18n.translate('errors.INTERNAL_ERROR', { lang });
        }
      } else if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else {
        message = this.i18n.translate('errors.INTERNAL_ERROR', { lang });
      }
    } else if (exception instanceof Error) {
      message = exception.message;
    } else {
      message = this.i18n.translate('errors.INTERNAL_ERROR', { lang });
    }

    response.status(status).json({
      success: false,
      statusCode: status,
      message,
      code,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
