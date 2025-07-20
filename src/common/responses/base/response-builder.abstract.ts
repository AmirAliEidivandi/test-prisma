import { HttpStatus } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import {
  IBaseResponse,
  IPaginatedResponse,
  ISuccessResponseOptions,
} from './response.interface';

export abstract class ResponseBuilder {
  abstract readonly domain: string;

  protected constructor(private readonly i18n: I18nService) {}

  protected createSuccessResponse<T>(
    messageKey: string,
    options: ISuccessResponseOptions = {},
  ): IBaseResponse<T> {
    const { data, meta, statusCode = HttpStatus.OK } = options;

    // Get language from global context (set by LanguageInterceptor)
    const lang = this.getCurrentLanguage();

    const message = this.i18n.t(`success.${this.domain}.${messageKey}`, {
      lang,
      defaultValue: `Operation completed successfully`,
    });

    return {
      success: true,
      message,
      data,
      meta,
      timestamp: new Date().toISOString(),
      statusCode,
    };
  }

  protected createPaginatedResponse<T>(
    messageKey: string,
    data: T[],
    totalCount: number,
    page: number,
    limit: number,
  ): IPaginatedResponse<T> {
    const totalPages = Math.ceil(totalCount / limit);

    const lang = this.getCurrentLanguage();
    const message = this.i18n.t(`success.${this.domain}.${messageKey}`, {
      lang,
      defaultValue: `Data retrieved successfully`,
    });

    return {
      success: true,
      message,
      data,
      meta: {
        total: totalCount,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages - 1,
        hasPreviousPage: page > 0,
      },
      timestamp: new Date().toISOString(),
      statusCode: HttpStatus.OK,
    };
  }

  private getCurrentLanguage(): string {
    try {
      const contextStore = (global as any).__nestjs_req_lang__;
      return contextStore || 'fa';
    } catch {
      return 'fa';
    }
  }
}
