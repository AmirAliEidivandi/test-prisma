import { HttpStatus } from '@nestjs/common';
import { DomainException } from '../base/domain-exception.abstract';

export class ProductException extends DomainException {
  static readonly DOMAIN = 'product';
  readonly domain = ProductException.DOMAIN;

  // Error codes specific to Product domain
  static readonly CODES = {
    NOT_FOUND: 'NOT_FOUND',
    ALREADY_EXISTS: 'ALREADY_EXISTS',
    INVALID_STATUS: 'INVALID_STATUS',
    INSUFFICIENT_STOCK: 'INSUFFICIENT_STOCK',
    PRICE_INVALID: 'PRICE_INVALID',
  } as const;

  readonly code: string;

  constructor(
    code: keyof typeof ProductException.CODES,
    statusCode: HttpStatus = HttpStatus.BAD_REQUEST,
    message?: string,
    payload?: Record<string, any>,
  ) {
    super(ProductException.CODES[code], statusCode, message, payload);
    this.code = ProductException.CODES[code];
  }

  // Factory methods for common exceptions
  static notFound(id?: string): ProductException {
    return new ProductException(
      'NOT_FOUND',
      HttpStatus.NOT_FOUND,
      undefined,
      id ? { productId: id } : undefined,
    );
  }

  static alreadyExists(name: string): ProductException {
    return new ProductException(
      'ALREADY_EXISTS',
      HttpStatus.CONFLICT,
      undefined,
      { name },
    );
  }

  static invalidStatus(status: string): ProductException {
    return new ProductException(
      'INVALID_STATUS',
      HttpStatus.BAD_REQUEST,
      undefined,
      { status },
    );
  }

  static insufficientStock(
    requestedQuantity: number,
    availableQuantity: number,
  ): ProductException {
    return new ProductException(
      'INSUFFICIENT_STOCK',
      HttpStatus.BAD_REQUEST,
      undefined,
      { requestedQuantity, availableQuantity },
    );
  }

  static invalidPrice(price: number): ProductException {
    return new ProductException(
      'PRICE_INVALID',
      HttpStatus.BAD_REQUEST,
      undefined,
      { price },
    );
  }
}
