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
      <span className="ui-state__eyebrow">{compact ? 'No results' : 'Nothing here yet'}</span>
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
}
