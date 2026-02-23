import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { v4 as uuidv4 } from 'uuid';

declare global {
  interface Request {
    requestId?: string;
  }
}

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    
    const requestId = request.headers['x-request-id'] as string || uuidv4();
    request.requestId = requestId;
    response.setHeader('X-Request-Id', requestId);

    const { method, url, ip } = request;
    const userAgent = request.get('user-agent') || '';
    const now = Date.now();

    this.logger.log(
      `[${requestId}] --> ${method} ${url} ${ip} ${userAgent}`
    );

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - now;
          const statusCode = response.statusCode;
          this.logger.log(
            `[${requestId}] <-- ${method} ${url} ${statusCode} ${duration}ms`
          );
        },
        error: (error) => {
          const duration = Date.now() - now;
          this.logger.error(
            `[${requestId}] <-- ${method} ${url} ${error.status || 500} ${duration}ms - ${error.message}`
          );
        },
      }),
    );
  }
}
