import { PropsWithChildren, useState } from 'react';
import { useAuthStore } from '../../features/auth/model/auth-store';
import { Sidebar } from './sidebar';
import { Topbar } from './topbar';
import { cn } from '../../shared/lib/cn';

export function AppShell({ children }: PropsWithChildren) {
  const user = useAuthStore(state => state.user);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!user) {
    return null;
  }

  return (
    <div className="app-shell">
      <button
        type="button"
        aria-label="Close sidebar"
        className={cn('app-shell__backdrop', sidebarOpen && 'app-shell__backdrop--visible')}
        onClick={() => setSidebarOpen(false)}
      />
      <Sidebar role={user.role} open={sidebarOpen} onNavigate={() => setSidebarOpen(false)} />
      <div className="app-shell__main">
        <Topbar onMenuToggle={() => setSidebarOpen(current => !current)} />
        <main className="app-shell__content">{children}</main>
      </div>
    </div>
  );
}
