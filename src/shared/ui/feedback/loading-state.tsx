export function LoadingState({ label = 'Loading...' }: { label?: string }) {
  return (
    <div className="ui-state">
      <div className="ui-spinner" />
      <p>{label}</p>
    </div>
  );
}
