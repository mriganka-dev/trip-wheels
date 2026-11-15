export interface ApiResponse<T> {
  statusCode: number;
  data: T;
  message: string;
  success: boolean;
}

export interface ApiFieldError {
  field?: string;
  message: string;
  path?: (string | number)[];
}

export interface ApiErrorPayload {
  statusCode: number;
  message: string;
  errors?: ApiFieldError[];
  success: boolean;
}

export interface PaginatedResponse<T> {
  items: T[];
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}
