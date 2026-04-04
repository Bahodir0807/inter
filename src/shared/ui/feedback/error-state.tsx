import { Button } from '../buttons/button';

export function ErrorState({
  title = 'Не удалось загрузить данные',
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
      {onRetry ? <Button onClick={onRetry}>Повторить</Button> : null}
    </div>
  );
}
