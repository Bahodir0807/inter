import { translate } from '../../i18n/i18n';

export function LoadingState({ label = translate('common.loading') }: { label?: string }) {
  return (
    <div className="ui-state">
      <div className="ui-spinner" />
      <p>{label}</p>
    </div>
  );
}
