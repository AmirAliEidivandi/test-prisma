import { HttpStatus } from '@nestjs/common';
import { DomainException } from '../base/domain-exception.abstract';

export class ValidationException extends DomainException {
  static readonly DOMAIN = 'validation';
  readonly domain = ValidationException.DOMAIN;

  static readonly CODES = {
    FAILED: 'FAILED',
    REQUIRED_FIELD: 'REQUIRED_FIELD',
    INVALID_FORMAT: 'INVALID_FORMAT',
    OUT_OF_RANGE: 'OUT_OF_RANGE',
    DUPLICATE_VALUE: 'DUPLICATE_VALUE',
  } as const;

  readonly code: string;

  constructor(
    code: keyof typeof ValidationException.CODES,
    statusCode: HttpStatus = HttpStatus.BAD_REQUEST,
    message?: string,
    payload?: Record<string, any>,
  ) {
    super(ValidationException.CODES[code], statusCode, message, payload);
    this.code = ValidationException.CODES[code];
  }

  // Factory methods
  static failed(errors?: any[]): ValidationException {
    return new ValidationException(
      'FAILED',
      HttpStatus.BAD_REQUEST,
      undefined,
      errors ? { errors } : undefined,
    );
  }

  static requiredField(field: string): ValidationException {
    return new ValidationException(
      'REQUIRED_FIELD',
      HttpStatus.BAD_REQUEST,
      undefined,
      { field },
    );
  }

  static invalidFormat(
    field: string,
    expectedFormat: string,
  ): ValidationException {
    return new ValidationException(
      'INVALID_FORMAT',
      HttpStatus.BAD_REQUEST,
      undefined,
      { field, expectedFormat },
    );
  }

  static outOfRange(
    field: string,
    min?: number,
    max?: number,
  ): ValidationException {
    return new ValidationException(
      'OUT_OF_RANGE',
      HttpStatus.BAD_REQUEST,
      undefined,
      { field, min, max },
    );
  }

  static duplicateValue(field: string, value: any): ValidationException {
    return new ValidationException(
      'DUPLICATE_VALUE',
      HttpStatus.CONFLICT,
      undefined,
      { field, value },
    );
  }
}
