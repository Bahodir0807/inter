import { Button } from '../buttons/button';
import { translate } from '../../i18n/i18n';

interface PaginationProps {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}

export function Pagination({ page, totalPages, onChange }: PaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="table-pagination">
      <Button size="sm" variant="ghost" disabled={page <= 1} onClick={() => onChange(page - 1)}>
        {translate('common.previous')}
      </Button>
      <span>
        {translate('common.pageOf', { page, totalPages })}
      </span>
      <Button size="sm" variant="ghost" disabled={page >= totalPages} onClick={() => onChange(page + 1)}>
        {translate('common.next')}
      </Button>
    </div>
  );
}
