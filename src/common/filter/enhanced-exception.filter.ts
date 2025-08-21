import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { LogKafkaService } from '@services/kafka/log/log-kafka.service';
import { FastifyReply, FastifyRequest } from 'fastify';
import { I18nService } from 'nestjs-i18n';
import { IExceptionResponse } from '../exceptions/base/base-exception.interface';
import { DomainException } from '../exceptions/base/domain-exception.abstract';
import { SentryExceptionCaptured } from '@sentry/nestjs';

@Catch()
export class EnhancedExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(EnhancedExceptionFilter.name);

  constructor(
    private readonly i18n: I18nService,
    private readonly logKafka: LogKafkaService,
  ) {}

  @SentryExceptionCaptured()
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<FastifyReply>();
    const request = ctx.getRequest<FastifyRequest>();

    // Log the exception for debugging
    this.logger.error('Exception caught:', {
      exception: exception instanceof Error ? exception.message : exception,
      stack: exception instanceof Error ? exception.stack : undefined,
      url: request.url,
      method: request.method,
    });

    const exceptionResponse = this.handleException(exception, request);

    // Emit to Kafka for centralized log collection
    // Prepare headers with redaction
    const headers = { ...(request.headers as any) } as Record<string, any>;
    if (headers['authorization']) headers['authorization'] = '[REDACTED]';
    if (headers['cookie']) headers['cookie'] = '[REDACTED]';
    if (headers['set-cookie']) headers['set-cookie'] = '[REDACTED]';

    // Resolve client IP
    const xRealIp = (request.headers as any)?.['x-real-ip'] as
      | string
      | undefined;
    const xForwardedFor = (request.headers as any)?.['x-forwarded-for'] as
      | string
      | undefined;
    const fwdIp = xForwardedFor?.split(',')[0]?.trim();
    const ip =
      xRealIp ||
      fwdIp ||
      (request as any)?.ip ||
      (request as any)?.socket?.remoteAddress;

    this.logKafka.emit({
      service: 'test-prisma',
      level: 'ERROR',
      message: 'UNCAUGHT_EXCEPTION',
      metadata: {
        requestId:
          (request as any)?.id || (request.headers as any)?.['x-request-id'],
        method: request.method,
        url: request.url,
        ip,
        statusCode:
          (response as any)?.statusCode ??
          (response as any)?.raw?.statusCode ??
          500,
        headers,
      },
      error: {
        name: (exception as any)?.name ?? 'Error',
        message: (exception as any)?.message ?? 'Unknown error',
        stack: (exception as any)?.stack,
      },
    });

    response.status(exceptionResponse.statusCode).send(exceptionResponse);
  }

  private handleException(
    exception: unknown,
    request: FastifyRequest,
  ): IExceptionResponse {
    const timestamp = new Date().toISOString();
    const path = request.url;
    const method = request.method;
    const lang = this.getLanguage(request);

    // Handle Domain Exceptions (our custom exceptions)
    if (exception instanceof DomainException) {
      return this.handleDomainException(exception, {
        timestamp,
        path,
        method,
        lang,
      });
    }

    // Handle standard HTTP Exceptions
    if (exception instanceof HttpException) {
      return this.handleHttpException(exception, {
        timestamp,
        path,
        method,
        lang,
      });
    }

    // Handle unknown exceptions
    return this.handleUnknownException(exception, {
      timestamp,
      path,
      method,
      lang,
    });
  }

  private handleDomainException(
    exception: DomainException,
    context: { timestamp: string; path: string; method: string; lang: string },
  ): IExceptionResponse {
    const errorCode = exception.getErrorCode();
    const message = this.getI18nMessage(
      errorCode,
      context.lang,
      exception.payload,
    );

    return {
      domain: exception.domain,
      code: exception.code,
      statusCode: exception.statusCode,
      message,
      payload: exception.payload,
      timestamp: context.timestamp,
      path: context.path,
      method: context.method,
    };
  }

  private handleHttpException(
    exception: HttpException,
    context: { timestamp: string; path: string; method: string; lang: string },
  ): IExceptionResponse {
    const status = exception.getStatus();
    const response = exception.getResponse();

    // Check if it's already our custom format
    if (typeof response === 'object' && (response as any).domain) {
      const customResponse = response as any;
      const message = this.getI18nMessage(
        `${customResponse.domain}.${customResponse.code}`,
        context.lang,
        customResponse.payload,
      );

      return {
        domain: customResponse.domain,
        code: customResponse.code,
        statusCode: status,
        message,
        payload: customResponse.payload,
        timestamp: context.timestamp,
        path: context.path,
        method: context.method,
      };
    }

    // Map HTTP status to common domain
    const { domain, code } = this.mapHttpStatusToCommon(status);
    const errorCode = `${domain}.${code}`;
    const message = this.getI18nMessage(errorCode, context.lang);

    return {
      domain,
      code,
      statusCode: status,
      message,
      payload:
        typeof response === 'object' ? response : { originalMessage: response },
      timestamp: context.timestamp,
      path: context.path,
      method: context.method,
    };
  }

  private handleUnknownException(
    exception: unknown,
    context: { timestamp: string; path: string; method: string; lang: string },
  ): IExceptionResponse {
    const domain = 'common';
    const code = 'INTERNAL_ERROR';
    const errorCode = `${domain}.${code}`;
    const message = this.getI18nMessage(errorCode, context.lang);

    return {
      domain,
      code,
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message,
      payload: {
        error:
          exception instanceof Error
            ? exception.message
            : 'Unknown error occurred',
      },
      timestamp: context.timestamp,
      path: context.path,
      method: context.method,
    };
  }

  private mapHttpStatusToCommon(status: HttpStatus): {
    domain: string;
    code: string;
  } {
    switch (status) {
      case HttpStatus.NOT_FOUND:
        return { domain: 'common', code: 'NOT_FOUND' };
      case HttpStatus.UNAUTHORIZED:
        return { domain: 'auth', code: 'UNAUTHORIZED' };
      case HttpStatus.FORBIDDEN:
        return { domain: 'auth', code: 'FORBIDDEN' };
      case HttpStatus.BAD_REQUEST:
        return { domain: 'validation', code: 'FAILED' };
      case HttpStatus.CONFLICT:
        return { domain: 'common', code: 'CONFLICT' };
      default:
        return { domain: 'common', code: 'INTERNAL_ERROR' };
    }
  }

  private getI18nMessage(
    errorCode: string,
    lang: string,
    payload?: Record<string, any>,
  ): string {
    try {
      return this.i18n.t(`exception.errors.${errorCode}`, {
        lang,
        args: payload,
      });
    } catch (error) {
      this.logger.warn(`Translation not found for: ${errorCode}`);
      return `Error: ${errorCode}`;
    }
  }

  private getLanguage(request: FastifyRequest): string {
    return (
      (request.headers['x-custom-lang'] as string) ||
      request.headers['accept-language']?.split(',')[0]?.split('-')[0] ||
      'en'
    );
  }
}
