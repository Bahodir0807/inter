import { Link, useLocation } from 'react-router-dom';
import { routeMetaByPath } from '../../app/router/navigation';
import { AppIcon } from '../../shared/ui/icons/app-icon';
import { useI18n } from '../../shared/i18n/i18n';

export function Breadcrumbs() {
  const location = useLocation();
  const { t } = useI18n();
  const segments = location.pathname.split('/').filter(Boolean);
  const crumbs = segments.map((_, index) => `/${segments.slice(0, index + 1).join('/')}`);

  return (
    <div className="breadcrumbs">
      <Link className="breadcrumbs__root" to="/app/dashboard">
        <AppIcon name="dashboard" />
        <span>{t('common.workspace')}</span>
      </Link>
      {crumbs.map((path, index) => {
        const meta = routeMetaByPath[path];
        const isLast = index === crumbs.length - 1;

        if (!meta || path === '/app') {
          return null;
        }

        return (
          <span key={path} className="breadcrumbs__item">
            <span className="breadcrumbs__sep" aria-hidden="true">
              <AppIcon name="chevron-right" />
            </span>
            <span className={isLast ? 'breadcrumbs__current' : undefined}>{t(meta.labelKey, meta.label)}</span>
          </span>
        );
      })}
    </div>
  );
}
