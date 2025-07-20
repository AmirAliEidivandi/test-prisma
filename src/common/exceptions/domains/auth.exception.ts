import { HttpStatus } from '@nestjs/common';
import { DomainException } from '../base/domain-exception.abstract';

export class AuthException extends DomainException {
  static readonly DOMAIN = 'auth';
  readonly domain = AuthException.DOMAIN;

  static readonly CODES = {
    UNAUTHORIZED: 'UNAUTHORIZED',
    FORBIDDEN: 'FORBIDDEN',
    TOKEN_EXPIRED: 'TOKEN_EXPIRED',
    TOKEN_INVALID: 'TOKEN_INVALID',
    CREDENTIALS_INVALID: 'CREDENTIALS_INVALID',
  } as const;

  readonly code: string;

  constructor(
    code: keyof typeof AuthException.CODES,
    statusCode: HttpStatus = HttpStatus.UNAUTHORIZED,
    message?: string,
    payload?: Record<string, any>,
  ) {
    super(AuthException.CODES[code], statusCode, message, payload);
    this.code = AuthException.CODES[code];
  }

  // Factory methods
  static unauthorized(): AuthException {
    return new AuthException('UNAUTHORIZED', HttpStatus.UNAUTHORIZED);
  }

  static forbidden(action?: string): AuthException {
    return new AuthException(
      'FORBIDDEN',
      HttpStatus.FORBIDDEN,
      undefined,
      action ? { action } : undefined,
    );
  }

  static tokenExpired(): AuthException {
    return new AuthException('TOKEN_EXPIRED', HttpStatus.UNAUTHORIZED);
  }

  static tokenInvalid(): AuthException {
    return new AuthException('TOKEN_INVALID', HttpStatus.UNAUTHORIZED);
  }

  static credentialsInvalid(): AuthException {
    return new AuthException('CREDENTIALS_INVALID', HttpStatus.UNAUTHORIZED);
  }
}
