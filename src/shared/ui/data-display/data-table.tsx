import { ReactNode } from 'react';
import { cn } from '../../lib/cn';
import { EmptyState } from '../feedback/empty-state';

export interface Column<T> {
  key: string;
  header: string;
  cell: (row: T) => ReactNode;
  className?: string;
  headClassName?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  getRowKey?: (row: T, rowIndex: number) => string | number;
  emptyTitle?: string;
  emptyDescription?: string;
}

export function DataTable<T>({
  columns,
  rows,
  getRowKey,
  emptyTitle = 'No results',
  emptyDescription = 'Try another search or clear a filter.',
}: DataTableProps<T>) {
  return (
    <table className="data-table">
      <thead>
        <tr>
          {columns.map(column => (
            <th key={column.key} className={cn(column.headClassName)}>
              {column.header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.length > 0 ? (
          rows.map((row, rowIndex) => (
            <tr className="data-table__row" key={getRowKey ? getRowKey(row, rowIndex) : rowIndex}>
              {columns.map(column => (
                <td
                  key={column.key}
                  data-label={column.header}
                  className={cn('data-table__cell', column.className)}
                >
                  {column.cell(row)}
                </td>
              ))}
            </tr>
          ))
        ) : (
          <tr>
            <td className="data-table__empty" colSpan={columns.length}>
              <EmptyState title={emptyTitle} description={emptyDescription} compact />
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
}
