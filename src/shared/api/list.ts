export type ListSortOrder = 'asc' | 'desc';

export interface ListQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: ListSortOrder;
  [key: string]: string | number | boolean | undefined | null;
}

export const LIST_LIMITS = {
  table: 100,
  support: 100,
  dashboard: 100,
} as const;

export function buildListParams<T extends object | undefined>(params?: T) {
  if (!params) {
    return undefined;
  }

  return Object.fromEntries(
    Object.entries(params as Record<string, unknown>).filter(
      ([, value]) => value !== undefined && value !== null && value !== '',
    ),
  ) as T;
}

export function isListPossiblyTruncated(count: number, requestedLimit?: number) {
  return typeof requestedLimit === 'number' && count >= requestedLimit;
}

export function formatLoadedCount(count: number, possiblyTruncated: boolean) {
  return possiblyTruncated ? `${count}+` : `${count}`;
}

export function formatLoadedResultsLabel(count: number, possiblyTruncated: boolean) {
  if (possiblyTruncated) {
    return `${count} in loaded batch`;
  }

  return `${count} result${count === 1 ? '' : 's'}`;
}
