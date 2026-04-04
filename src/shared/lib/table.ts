export type SortDirection = 'asc' | 'desc';

export function sortBy<T>(items: T[], accessor: (item: T) => string | number, direction: SortDirection) {
  return [...items].sort((left, right) => {
    const a = accessor(left);
    const b = accessor(right);

    if (a === b) {
      return 0;
    }

    if (direction === 'asc') {
      return a > b ? 1 : -1;
    }

    return a < b ? 1 : -1;
  });
}

export function paginate<T>(items: T[], page: number, pageSize: number) {
  const start = (page - 1) * pageSize;
  return items.slice(start, start + pageSize);
}
