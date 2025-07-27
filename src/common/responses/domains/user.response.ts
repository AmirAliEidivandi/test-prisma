import { HttpStatus, Injectable } from '@nestjs/common';
import { ResponseBuilder } from '@responses/base/response-builder.abstract';
import {
  IBaseResponse,
  IPaginatedResponse,
} from '@responses/base/response.interface';
import { I18nService } from 'nestjs-i18n';

@Injectable()
export class UserResponse extends ResponseBuilder {
  readonly domain = 'user';

  constructor(i18n: I18nService) {
    super(i18n);
  }

  // Success response codes for User domain
  static readonly CODES = {
    CREATED: 'CREATED',
    UPDATED: 'UPDATED',
    DELETED: 'DELETED',
    RETRIEVED: 'RETRIEVED',
    LISTED: 'LISTED',
  } as const;

  // Factory methods for common responses
  created<T>(user: T): IBaseResponse<T> {
    return this.createSuccessResponse('CREATED', {
      data: user,
      statusCode: HttpStatus.CREATED,
    });
  }

  updated<T>(user: T): IBaseResponse<T> {
    return this.createSuccessResponse('UPDATED', {
      data: user,
      statusCode: HttpStatus.OK,
    });
  }

  deleted(): IBaseResponse<null> {
    return this.createSuccessResponse('DELETED', {
      data: null,
      statusCode: HttpStatus.OK,
    });
  }

  retrieved<T>(user: T): IBaseResponse<T> {
    return this.createSuccessResponse('RETRIEVED', {
      data: user,
      statusCode: HttpStatus.OK,
    });
  }

  listed<T>(
    users: T[],
    totalCount: number,
    page: number,
    limit: number,
  ): IPaginatedResponse<T> {
    return this.createPaginatedResponse(
      'LISTED',
      users,
      totalCount,
      page,
      limit,
    );
  }
}
