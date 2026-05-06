export function EmptyState({
  title,
  description,
  compact = false,
}: {
  title: string;
  description: string;
  compact?: boolean;
}) {
  return (
    <div className={`ui-state${compact ? ' ui-state--compact' : ''}`} role="status">
      <span className="ui-state__eyebrow">{compact ? translate('common.noResults') : translate('common.nothingHereYet')}</span>
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
}
import { translate } from '../../i18n/i18n';
