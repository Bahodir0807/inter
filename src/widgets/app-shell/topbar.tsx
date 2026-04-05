import { Button } from '../../shared/ui/buttons/button';
import { Breadcrumbs } from './breadcrumbs';
import { useAuthStore } from '../../features/auth/model/auth-store';
import { getRoleDisplayName, getUserDisplayName } from '../../shared/lib/entity-display';
import { AppIcon } from '../../shared/ui/icons/app-icon';

export function Topbar({ open, onMenuToggle }: { open: boolean; onMenuToggle: () => void }) {
  const user = useAuthStore(state => state.user);
  const logout = useAuthStore(state => state.logout);
  const userName = getUserDisplayName(user) || 'CRM user';
  const initials = userName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase() ?? '')
    .join('') || 'IC';

  return (
    <header className="app-topbar">
      <div className="app-topbar__left">
        <Button
          variant="ghost"
          className="app-topbar__menu"
          aria-expanded={open}
          aria-controls="app-sidebar"
          onClick={onMenuToggle}
        >
          <AppIcon name="menu" />
          <span>Menu</span>
        </Button>
        <div className="app-topbar__identity">
          <Breadcrumbs />
          <div className="app-topbar__headline">
            <strong>Workspace</strong>
            <span className="subtle">People, courses, schedule, rooms, and payments.</span>
          </div>
        </div>
      </div>
      <div className="app-topbar__right">
        <div className="app-topbar__user-chip">
          <span className="app-topbar__avatar" aria-hidden="true">
            {initials}
          </span>
          <div className="app-topbar__user-copy">
            <strong>{userName}</strong>
            <span className="subtle">{getRoleDisplayName(user?.role)}</span>
          </div>
        </div>
        <Button variant="ghost" onClick={logout}>
          <AppIcon name="logout" />
          <span>Log out</span>
        </Button>
      </div>
    </header>
  );
}
