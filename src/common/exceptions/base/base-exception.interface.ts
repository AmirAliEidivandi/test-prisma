import { HttpStatus } from '@nestjs/common';

export interface IBaseException {
  readonly domain: string;
  readonly code: string;
  readonly message?: string;
  readonly statusCode: HttpStatus;
  readonly payload?: Record<string, any>;
}

export interface IExceptionResponse extends IBaseException {
  readonly timestamp: string;
  readonly path: string;
  readonly method: string;
}
