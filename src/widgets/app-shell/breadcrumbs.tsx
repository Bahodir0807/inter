import { Link, useLocation } from 'react-router-dom';
import { routeMetaByPath } from '../../app/router/navigation';
import { AppIcon } from '../../shared/ui/icons/app-icon';
import { useI18n } from '../../shared/i18n/i18n';

export function Breadcrumbs({ onNavigate }: { onNavigate?: () => void }) {
  const location = useLocation();
  const { t } = useI18n();
  const segments = location.pathname.split('/').filter(Boolean);

  const buildPath = (index: number) => `/${segments.slice(0, index + 1).join('/')}`;

  const bestMetaForPath = (path: string) => {
    // try exact match, otherwise walk up to find known route
    if (routeMetaByPath[path]) return { path, meta: routeMetaByPath[path] };
    const parts = path.split('/').filter(Boolean);
    for (let i = parts.length - 1; i > 0; i--) {
      const p = `/${parts.slice(0, i).join('/')}`;
      if (routeMetaByPath[p]) return { path: p, meta: routeMetaByPath[p] };
    }
    return null;
  };

  return (
    <div className="breadcrumbs">
      <Link className="breadcrumbs__root" to="/app/dashboard" onClick={() => onNavigate?.()}>
        <AppIcon name="dashboard" />
        <span>{t('common.workspace')}</span>
      </Link>
      {segments.map((seg, index) => {
        const path = buildPath(index);
        if (path === '/app') return null;
        const match = bestMetaForPath(path);
        const isLast = index === segments.length - 1;

        const label = match ? t(match.meta.labelKey, match.meta.label) : (isLast ? t('common.details', 'Details') : decodeURIComponent(seg).replace(/[-_]/g, ' '));

        return (
          <span key={path} className="breadcrumbs__item">
            <span className="breadcrumbs__sep" aria-hidden="true">
              <AppIcon name="chevron-right" />
            </span>
            {isLast ? (
              <span className="breadcrumbs__current">{label}</span>
            ) : (
              <Link to={match?.path ?? path} onClick={() => onNavigate?.()}>{label}</Link>
            )}
          </span>
        );
      })}
    </div>
  );
}
