import { Button } from '../../shared/ui/buttons/button';
import { Badge } from '../../shared/ui/badges/badge';
import { Breadcrumbs } from './breadcrumbs';
import { useAuthStore } from '../../features/auth/model/auth-store';
import { getRoleDisplayName, getUserDisplayName } from '../../shared/lib/entity-display';

export function Topbar({ onMenuToggle }: { onMenuToggle: () => void }) {
  const user = useAuthStore(state => state.user);
  const logout = useAuthStore(state => state.logout);

  return (
    <header className="app-topbar">
      <div className="app-topbar__left">
        <Button variant="ghost" className="app-topbar__menu" onClick={onMenuToggle}>
          Menu
        </Button>
        <div className="app-topbar__identity">
          <Breadcrumbs />
          <strong>{getUserDisplayName(user) || 'CRM'}</strong>
          <span className="subtle">Daily operations workspace</span>
        </div>
      </div>
      <div className="app-topbar__right">
        <Badge tone="info">{getRoleDisplayName(user?.role)}</Badge>
        <Button variant="secondary" onClick={logout}>
          Log out
        </Button>
      </div>
    </header>
  );
}
