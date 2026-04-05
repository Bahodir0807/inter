import { NavLink } from 'react-router-dom';
import { Role } from '../../shared/types/auth';
import { navigationItems } from '../../app/router/navigation';
import { cn } from '../../shared/lib/cn';
import { getRoleDisplayName } from '../../shared/lib/entity-display';
import { AppIcon } from '../../shared/ui/icons/app-icon';

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
    <aside id="app-sidebar" className={cn('app-sidebar', open && 'app-sidebar--open')}>
      <div className="app-sidebar__brand">
        <span className="app-sidebar__logo" aria-hidden="true">
          <AppIcon name="spark" />
        </span>
        <div className="app-sidebar__brand-copy">
          <strong>Ibrat CRM</strong>
          <p>Daily operations across people, learning, schedule, and payments.</p>
        </div>
      </div>
      <div className="app-sidebar__section">
        <span className="app-sidebar__section-label">Workspace</span>
        <nav className="app-sidebar__nav">
          {items.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => cn('app-sidebar__link', isActive && 'app-sidebar__link--active')}
              onClick={onNavigate}
            >
              <span className="app-sidebar__icon" aria-hidden="true">
                <AppIcon name={item.icon} />
              </span>
              <span className="app-sidebar__label">{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </div>
      <div className="app-sidebar__footer">
        <span className="subtle">Current role</span>
        <strong>{getRoleDisplayName(role)}</strong>
      </div>
    </aside>
  );
}
