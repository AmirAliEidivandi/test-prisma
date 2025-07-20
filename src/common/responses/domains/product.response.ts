import { HttpStatus, Injectable } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { ResponseBuilder } from '../base/response-builder.abstract';
import { IBaseResponse, IPaginatedResponse } from '../base/response.interface';

@Injectable()
export class ProductResponse extends ResponseBuilder {
  readonly domain = 'product';

  constructor(i18n: I18nService) {
    super(i18n);
  }

  // Success response codes for Product domain
  static readonly CODES = {
    CREATED: 'CREATED',
    UPDATED: 'UPDATED',
    DELETED: 'DELETED',
    RETRIEVED: 'RETRIEVED',
    LISTED: 'LISTED',
  } as const;

  // Factory methods for common responses
  created<T>(product: T): IBaseResponse<T> {
    return this.createSuccessResponse('CREATED', {
      data: product,
      statusCode: HttpStatus.CREATED,
    });
  }

  updated<T>(product: T): IBaseResponse<T> {
    return this.createSuccessResponse('UPDATED', {
      data: product,
      statusCode: HttpStatus.OK,
    });
  }

  deleted(): IBaseResponse<null> {
    return this.createSuccessResponse('DELETED', {
      data: null,
      statusCode: HttpStatus.OK,
    });
  }

  retrieved<T>(product: T): IBaseResponse<T> {
    return this.createSuccessResponse('RETRIEVED', {
      data: product,
      statusCode: HttpStatus.OK,
    });
  }

  listed<T>(
    products: T[],
    totalCount: number,
    page: number,
    limit: number,
  ): IPaginatedResponse<T> {
    return this.createPaginatedResponse(
      'LISTED',
      products,
      totalCount,
      page,
      limit,
    );
  }
}
