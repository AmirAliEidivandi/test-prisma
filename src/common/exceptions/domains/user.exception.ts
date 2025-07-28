import { DomainException } from '@exceptions/base/domain-exception.abstract';
import { HttpStatus } from '@nestjs/common';

export class UserException extends DomainException {
  static readonly DOMAIN = 'user';
  readonly domain = UserException.DOMAIN;

  static readonly CODES = {
    NOT_FOUND: 'NOT_FOUND',
    ALREADY_EXISTS_EMAIL: 'ALREADY_EXISTS_EMAIL',
    ALREADY_EXISTS_NATIONAL_CODE: 'ALREADY_EXISTS_NATIONAL_CODE',
    INVALID_EMAIL: 'INVALID_EMAIL',
  } as const;

  readonly code: string;

  constructor(
    code: keyof typeof UserException.CODES,
    statusCode: HttpStatus = HttpStatus.BAD_REQUEST,
    message?: string,
    payload?: Record<string, any>,
  ) {
    super(UserException.CODES[code], statusCode, message, payload);
    this.code = UserException.CODES[code];
  }

  static notFound(id?: string): UserException {
    return new UserException(
      'NOT_FOUND',
      HttpStatus.NOT_FOUND,
      undefined,
      id ? { userId: id } : undefined,
    );
  }

  static alreadyExistsEmail(email: string): UserException {
    return new UserException(
      'ALREADY_EXISTS_EMAIL',
      HttpStatus.CONFLICT,
      undefined,
      { email },
    );
  }

  static alreadyExistsNationalCode(nationalCode: string): UserException {
    return new UserException(
      'ALREADY_EXISTS_NATIONAL_CODE',
      HttpStatus.CONFLICT,
      undefined,
      { nationalCode },
    );
  }
}
