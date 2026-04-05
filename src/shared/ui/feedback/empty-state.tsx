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
      <span className="ui-state__eyebrow">{compact ? 'Nothing matches this view' : 'Workspace update'}</span>
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
}
