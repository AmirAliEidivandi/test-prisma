export interface IBaseResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  meta?: Record<string, any>;
  timestamp: string;
  statusCode: number;
}

export interface IPaginatedResponse<T> extends IBaseResponse<T[]> {
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export interface ISuccessResponseOptions {
  data?: any;
  meta?: Record<string, any>;
  statusCode?: number;
}
