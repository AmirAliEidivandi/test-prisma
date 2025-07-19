import { HttpException, HttpStatus } from '@nestjs/common';
import { ErrorCode } from './error-code.enum';

export class AppException extends HttpException {
  constructor(
    public readonly code: ErrorCode,
    status: HttpStatus,
    public readonly payload?: Record<string, any>,
  ) {
    super({ errorCode: code, payload }, status);
  }
}
