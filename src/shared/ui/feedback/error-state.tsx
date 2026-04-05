import { Button } from '../buttons/button';

export function ErrorState({
  title = 'Unable to load data',
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
      {onRetry ? <Button onClick={onRetry}>Retry</Button> : null}
    </div>
  );
}
