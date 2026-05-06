import { Button } from '../buttons/button';
import { translate } from '../../i18n/i18n';

export function ErrorState({
  title = translate('common.error', 'Unable to load data'),
  description,
  onRetry,
}: {
  title?: string;
  description: string;
  onRetry?: () => void;
}) {
  return (
    <div className="ui-state ui-state--error">
      <h3>{title}</h3>
      <p>{description}</p>
      {onRetry ? <Button onClick={onRetry}>{translate('common.retry')}</Button> : null}
    </div>
  );
}
