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
    const response = context.switchToHttp().getResponse();
    const startedAt = Date.now();
    const xRealIp = request.headers?.['x-real-ip'] as string | undefined;
    const xForwardedFor = request.headers?.['x-forwarded-for'] as
      | string
      | undefined;
    const fwdIp = xForwardedFor?.split(',')[0]?.trim();
    const ip = xRealIp || fwdIp || request.ip || request.socket?.remoteAddress;
    const userAgent = request.headers?.['user-agent'];
    const method = request.method;
    const url = request.url;
    const user = request.user;
    const requestId = request.id || request.headers?.['x-request-id'];
    const path = request.route?.path;

    return next.handle().pipe(
      tap(() => {
        const durationMs = Date.now() - startedAt;
        const statusCode = response.statusCode;
        const headers = { ...(request.headers || {}) } as Record<string, any>;
        if (headers['authorization']) headers['authorization'] = '[REDACTED]';
        if (headers['cookie']) headers['cookie'] = '[REDACTED]';
        if (headers['set-cookie']) headers['set-cookie'] = '[REDACTED]';
        const body = request.body;
        this.logKafka.emit({
          service: 'test-prisma',
          level: 'INFO',
          message: `${method} ${url} ${statusCode} ${durationMs}ms`,
          metadata: {
            requestId,
            method,
            url,
            statusCode,
            ip,
            userAgent,
            durationMs,
            userId: user?.sub || user?.id || user?.userId,
            path,
            headers,
            body,
          },
        });
      }),
      catchError((err) => {
        const durationMs = Date.now() - startedAt;
        const statusCode = response.statusCode;
        const headers = { ...(request.headers || {}) } as Record<string, any>;
        if (headers['authorization']) headers['authorization'] = '[REDACTED]';
        if (headers['cookie']) headers['cookie'] = '[REDACTED]';
        if (headers['set-cookie']) headers['set-cookie'] = '[REDACTED]';
        const body = request.body;
        this.logKafka.emit({
          service: 'test-prisma',
          level: 'ERROR',
          message: `${method} ${url} ${statusCode} ${durationMs}ms`,
          metadata: {
            requestId,
            method,
            url,
            statusCode,
            ip,
            userAgent,
            durationMs,
            userId: user?.sub || user?.id || user?.userId,
            path,
            headers,
            body,
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
