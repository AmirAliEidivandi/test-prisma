import { HttpException, HttpStatus } from '@nestjs/common';
import { IBaseException } from './base-exception.interface';

export abstract class DomainException
  extends HttpException
  implements IBaseException
{
  abstract readonly domain: string;
  abstract readonly code: string;

  constructor(
    code: string,
    statusCode: HttpStatus = HttpStatus.BAD_REQUEST,
    message?: string,
    public readonly payload?: Record<string, any>,
  ) {
    super(
      {
        domain: (new.target as any).DOMAIN,
        code,
        message,
        payload,
      },
      statusCode,
    );
  }

  get statusCode(): HttpStatus {
    return this.getStatus();
  }

  getErrorCode(): string {
    return `${this.domain}.${this.code}`;
  }
}
