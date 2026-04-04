import { NavLink } from 'react-router-dom';
import { Role } from '../../shared/types/auth';
import { navigationItems } from '../../app/router/navigation';
import { cn } from '../../shared/lib/cn';
import { getRoleDisplayName } from '../../shared/lib/entity-display';

export function Sidebar({
  role,
  open,
  onNavigate,
}: {
  role: Role;
  open: boolean;
  onNavigate?: () => void;
}) {
  const items = navigationItems.filter(item => item.roles.includes(role));

  return (
    <aside className={cn('app-sidebar', open && 'app-sidebar--open')}>
      <div className="app-sidebar__brand">
        <span className="app-sidebar__logo">IC</span>
        <div>
          <strong>Ibrat CRM</strong>
          <p>Education center workspace</p>
        </div>
      </div>
      <nav className="app-sidebar__nav">
        {items.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => cn('app-sidebar__link', isActive && 'app-sidebar__link--active')}
            onClick={onNavigate}
          >
            <span className="app-sidebar__icon">{item.shortLabel}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="app-sidebar__footer">
        <span className="subtle">Signed in as</span>
        <strong>{getRoleDisplayName(role)}</strong>
      </div>
    </aside>
  );
}
