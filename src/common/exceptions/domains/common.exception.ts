import { HttpStatus } from '@nestjs/common';
import { DomainException } from '../base/domain-exception.abstract';

export class CommonException extends DomainException {
  static readonly DOMAIN = 'common';
  readonly domain = CommonException.DOMAIN;

  static readonly CODES = {
    NOT_FOUND: 'NOT_FOUND',
    INTERNAL_ERROR: 'INTERNAL_ERROR',
    BAD_REQUEST: 'BAD_REQUEST',
    FORBIDDEN: 'FORBIDDEN',
  } as const;

  readonly code: string;

  constructor(
    code: keyof typeof CommonException.CODES,
    statusCode: HttpStatus = HttpStatus.BAD_REQUEST,
    message?: string,
    payload?: Record<string, any>,
  ) {
    super(CommonException.CODES[code], statusCode, message, payload);
    this.code = CommonException.CODES[code];
  }

  // Factory methods
  static notFound(resource?: string): CommonException {
    return new CommonException(
      'NOT_FOUND',
      HttpStatus.NOT_FOUND,
      undefined,
      resource ? { resource } : undefined,
    );
  }

  static internalError(error?: string): CommonException {
    return new CommonException(
      'INTERNAL_ERROR',
      HttpStatus.INTERNAL_SERVER_ERROR,
      undefined,
      error ? { error } : undefined,
    );
  }

  static badRequest(reason?: string): CommonException {
    return new CommonException(
      'BAD_REQUEST',
      HttpStatus.BAD_REQUEST,
      undefined,
      reason ? { reason } : undefined,
    );
  }

  static forbidden(action?: string): CommonException {
    return new CommonException(
      'FORBIDDEN',
      HttpStatus.FORBIDDEN,
      undefined,
      action ? { action } : undefined,
    );
  }
}
