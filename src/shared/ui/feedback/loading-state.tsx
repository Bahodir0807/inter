export function LoadingState({ label = 'Загрузка...' }: { label?: string }) {
  return (
    <div className="ui-state">
      <div className="ui-spinner" />
      <p>{label}</p>
    </div>
  );
}
