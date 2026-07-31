import { useMemo, useState } from 'react';
import { paginate, sortBy, SortDirection } from '../table';

export interface UseTableStateOptions {
  initialPage?: number;
  initialPageSize?: number;
  initialSort?: SortDirection;
}

export function useTableState<T>({ initialPage = 1, initialPageSize = 10, initialSort = 'asc' }: UseTableStateOptions = {}) {
  const [page, setPage] = useState(initialPage);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [search, setSearch] = useState('');
  const [sortDirection, setSortDirection] = useState<SortDirection>(initialSort);
  const [filters, setFilters] = useState<Record<string, any>>({});

  const setFilter = (key: string, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const clearFilter = (key: string) => {
    setFilters(prev => {
      const copy = { ...prev };
      delete copy[key];
      return copy;
    });
    setPage(1);
  };

  const reset = () => {
    setPage(1);
    setSearch('');
    setFilters({});
    setSortDirection(initialSort);
  };

  function apply(items: T[], opts?: { filterFn?: (item: T) => boolean; sortAccessor?: (item: T) => string | number }) {
    const filterFn = opts?.filterFn;
    const sortAccessor = opts?.sortAccessor;

    const filtered = filterFn ? items.filter(filterFn) : items.slice();
    const sorted = sortAccessor ? sortBy(filtered, sortAccessor, sortDirection) : filtered;
    const total = sorted.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const paged = paginate(sorted, page, pageSize);

    return { paged, total, totalPages };
  }

  return useMemo(() => ({
    page,
    setPage,
    pageSize,
    setPageSize,
    search,
    setSearch: (s: string) => { setSearch(s); setPage(1); },
    sortDirection,
    setSortDirection: (d: SortDirection) => { setSortDirection(d); setPage(1); },
    filters,
    setFilter,
    clearFilter,
    reset,
    apply,
  }), [page, pageSize, search, sortDirection, filters]);
}

export default useTableState;
