import { ErrorCode } from '@exceptions/error-code.enum';
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { FastifyReply, FastifyRequest } from 'fastify';
import { I18nService } from 'nestjs-i18n';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(private readonly i18n: I18nService) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<FastifyReply>();
    const request = ctx.getRequest<FastifyRequest>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;
    console.log(exception);

    let code: ErrorCode = ErrorCode.COMMON_INTERNAL_ERROR;
    let payload: Record<string, any> | undefined;
    let hasCustomErrorCode = false;

    if (exception instanceof HttpException) {
      const res = exception.getResponse();
      if (typeof res === 'object' && (res as any).errorCode) {
        code = (res as any).errorCode as ErrorCode;
        payload = (res as any).payload;
        hasCustomErrorCode = true;
      } else if (typeof res === 'string') {
        payload = { message: res };
      } else if (typeof res === 'object') {
        payload = res as Record<string, any>;
      }
    }

    // Map HTTP status codes to appropriate ErrorCode when no custom errorCode is provided
    if (!hasCustomErrorCode) {
      switch (status) {
        case HttpStatus.NOT_FOUND:
          code = ErrorCode.COMMON_NOT_FOUND;
          break;
        case HttpStatus.UNAUTHORIZED:
          code = ErrorCode.AUTH_UNAUTHORIZED;
          break;
        case HttpStatus.FORBIDDEN:
          code = ErrorCode.AUTH_FORBIDDEN;
          break;
        case HttpStatus.BAD_REQUEST:
          code = ErrorCode.VALIDATION_FAILED;
          break;
        default:
          code = ErrorCode.COMMON_INTERNAL_ERROR;
      }
    }

    const lang = (request.headers['x-custom-lang'] as string) || 'en';
    const message = this.i18n.t(`exception.errors.${code}`, {
      lang,
      args: payload,
    });
    console.log(message);

    const errorResponse = {
      statusCode: status,
      errorCode: code,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message,
    };

    response.status(status).send(errorResponse);
  }
}
