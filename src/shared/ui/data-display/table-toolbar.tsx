import { ReactNode } from 'react';
import { Input } from '../forms/input';

interface TableToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  resultsLabel?: string;
  activeFilters?: string[];
  filters?: ReactNode;
  actions?: ReactNode;
}

export function TableToolbar({
  search,
  onSearchChange,
  searchPlaceholder = 'Search...',
  resultsLabel,
  activeFilters = [],
  filters,
  actions,
}: TableToolbarProps) {
  const searchValue = search.trim();
  const summaryItems = [
    ...(searchValue ? [`Search: ${searchValue}`] : []),
    ...activeFilters,
  ];

  return (
    <div className="table-toolbar">
      <div className="table-toolbar__main">
        <div className="table-toolbar__search-wrap">
          <span className="table-toolbar__label">Search</span>
          <Input
            className="table-toolbar__search"
            fieldClassName="table-toolbar__search-field"
            value={search}
            onChange={event => onSearchChange(event.target.value)}
            placeholder={searchPlaceholder}
            aria-label={searchPlaceholder}
          />
        </div>
        {filters ? (
          <div className="table-toolbar__filters-wrap">
            <span className="table-toolbar__label table-toolbar__label--quiet">Refine</span>
            <div className="table-toolbar__filters">{filters}</div>
          </div>
        ) : null}
        {summaryItems.length ? (
          <div className="table-toolbar__active" aria-live="polite">
            {summaryItems.map(item => (
              <span key={item} className="table-toolbar__chip">
                {item}
              </span>
            ))}
          </div>
        ) : null}
      </div>
      <div className="table-toolbar__side">
        {resultsLabel ? <span className="table-toolbar__meta">{resultsLabel}</span> : null}
        {actions ? <div className="table-toolbar__actions">{actions}</div> : null}
      </div>
    </div>
  );
}
