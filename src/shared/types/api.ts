export interface ApiSuccessResponse {
  success: boolean;
  message: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface ApiMeta {
  timestamp?: string;
  requestId?: string;
  pagination?: PaginationMeta;
}

export interface ListQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedList<T> {
  items: T[];
  pagination?: PaginationMeta;
}
