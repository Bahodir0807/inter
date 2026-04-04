import { Link, useLocation } from 'react-router-dom';
import { routeMetaByPath } from '../../app/router/navigation';

export function Breadcrumbs() {
  const location = useLocation();
  const segments = location.pathname.split('/').filter(Boolean);
  const crumbs = segments.map((_, index) => `/${segments.slice(0, index + 1).join('/')}`);

  return (
    <div className="breadcrumbs">
      <Link to="/app/dashboard">CRM</Link>
      {crumbs.map(path => {
        const meta = routeMetaByPath[path];

        if (!meta || path === '/app') {
          return null;
        }

        return (
          <span key={path}>
            <span className="breadcrumbs__sep">/</span>
            <span>{meta.label}</span>
          </span>
        );
      })}
    </div>
  );
}
