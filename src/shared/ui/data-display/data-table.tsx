import { ReactNode } from 'react';
import { EmptyState } from '../feedback/empty-state';

export interface Column<T> {
  key: string;
  header: string;
  cell: (row: T) => ReactNode;
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
  emptyTitle = 'No results found',
  emptyDescription = 'Try adjusting the search or filters.',
}: DataTableProps<T>) {
  return (
    <table className="data-table">
      <thead>
        <tr>
          {columns.map(column => (
            <th key={column.key}>{column.header}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.length > 0 ? (
          rows.map((row, rowIndex) => (
            <tr key={getRowKey ? getRowKey(row, rowIndex) : rowIndex}>
              {columns.map(column => (
                <td key={column.key}>{column.cell(row)}</td>
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
