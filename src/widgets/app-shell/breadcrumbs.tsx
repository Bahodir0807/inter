import { Link, useLocation } from 'react-router-dom';
import { routeMetaByPath } from '../../app/router/navigation';
import { AppIcon } from '../../shared/ui/icons/app-icon';

export function Breadcrumbs() {
  const location = useLocation();
  const segments = location.pathname.split('/').filter(Boolean);
  const crumbs = segments.map((_, index) => `/${segments.slice(0, index + 1).join('/')}`);

  return (
    <div className="breadcrumbs">
      <Link className="breadcrumbs__root" to="/app/dashboard">
        <AppIcon name="dashboard" />
        <span>Workspace</span>
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
            <span className={isLast ? 'breadcrumbs__current' : undefined}>{meta.label}</span>
          </span>
        );
      })}
    </div>
  );
}
