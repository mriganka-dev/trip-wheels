export interface ApiResponse<T = unknown> {
  statusCode: number;
  data: T;
  message: string;
  success: true;
}

export interface ApiFieldError {
  field?: string;
  message: string;
}

export interface ApiErrorPayload {
  statusCode: number;
  message: string;
  errors?: ApiFieldError[];
  success: false;
}

export interface PaginatedData<T> {
  items: T[];
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
}

export type PaginatedResponse<T> = ApiResponse<PaginatedData<T>>;
