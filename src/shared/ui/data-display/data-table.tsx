import { ReactNode } from 'react';
import { EmptyState } from '../feedback/empty-state';

export interface Column<T> {
  key: string;
  header: string;
  cell: (row: T) => ReactNode;
}

export function DataTable<T>({
  columns,
  rows,
  emptyTitle = 'No results found',
  emptyDescription = 'Try adjusting the search or filters.',
}: {
  columns: Column<T>[];
  rows: T[];
  emptyTitle?: string;
  emptyDescription?: string;
}) {
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
            <tr key={rowIndex}>
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
