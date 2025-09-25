// logging.interceptor.ts
import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
    Logger,
  } from '@nestjs/common';
  import { Observable, tap } from 'rxjs';
  
  @Injectable()
  export class LoggingInterceptor implements NestInterceptor {
    private readonly logger = new Logger('HTTP');
  
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
      const request = context.switchToHttp().getRequest();
      const { method, url } = request;
      const now = Date.now();
  
      return next.handle().pipe(
        tap(() => {
          const response = context.switchToHttp().getResponse();
          const statusCode = response.statusCode;
          this.logger.log(`${method} ${url} ${statusCode} - ${Date.now() - now}ms`);
        }),
      );
    }
  }
  