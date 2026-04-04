import { ReactNode } from 'react';
import { Input } from '../forms/input';

interface TableToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  resultsLabel?: string;
  filters?: ReactNode;
  actions?: ReactNode;
}

export function TableToolbar({
  search,
  onSearchChange,
  searchPlaceholder = 'Search...',
  resultsLabel,
  filters,
  actions,
}: TableToolbarProps) {
  return (
    <div className="table-toolbar">
      <div className="table-toolbar__main">
        <Input
          className="table-toolbar__search"
          value={search}
          onChange={event => onSearchChange(event.target.value)}
          placeholder={searchPlaceholder}
        />
        {filters ? <div className="table-toolbar__filters">{filters}</div> : null}
      </div>
      <div className="table-toolbar__side">
        {resultsLabel ? <span className="table-toolbar__meta">{resultsLabel}</span> : null}
        {actions ? <div className="table-toolbar__actions">{actions}</div> : null}
      </div>
    </div>
  );
}
