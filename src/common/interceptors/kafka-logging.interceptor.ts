import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { LogKafkaService } from '@services/kafka/log/log-kafka.service';
import { Observable } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

@Injectable()
export class KafkaLoggingInterceptor implements NestInterceptor {
  constructor(private readonly logKafka: LogKafkaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const startedAt = Date.now();
    const requestId = request.id || request.headers?.['x-request-id'];
    const ip =
      request.ip ||
      request.headers?.['x-forwarded-for'] ||
      request.socket?.remoteAddress;
    const userAgent = request.headers?.['user-agent'];
    const method = request.method;
    const url = request.url;
    const user = request.user;

    return next.handle().pipe(
      tap(() => {
        const durationMs = Date.now() - startedAt;
        const statusCode = request.raw?.statusCode ?? request.res?.statusCode;
        this.logKafka.emit({
          service: 'test-prisma',
          level: 'INFO',
          message: 'HTTP_REQUEST_COMPLETED',
          metadata: {
            requestId,
            method,
            url,
            statusCode,
            ip,
            userAgent,
            durationMs,
            userId: user?.sub || user?.id || user?.userId,
          },
        });
      }),
      catchError((err) => {
        const durationMs = Date.now() - startedAt;
        const statusCode = err?.status ?? err?.statusCode ?? 500;
        this.logKafka.emit({
          service: 'test-prisma',
          level: 'ERROR',
          message: 'HTTP_REQUEST_FAILED',
          metadata: {
            requestId,
            method,
            url,
            statusCode,
            ip,
            userAgent,
            durationMs,
            userId: user?.sub || user?.id || user?.userId,
          },
          error: {
            name: err?.name ?? 'Error',
            message: err?.message ?? 'Unknown error',
            stack: err?.stack,
          },
        });
        throw err;
      }),
    );
  }
}
