import { Navigate, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from '../../features/auth/ui/protected-route';
import { RoleGate } from '../../features/auth/ui/role-gate';
import { useAuthStore } from '../../features/auth/model/auth-store';
import { AppShell } from '../../widgets/app-shell/app-shell';
import { LoginPage } from '../../pages/login/login-page';
import { appRoutes } from './navigation';

function RootRedirect() {
  const user = useAuthStore(state => state.user);
  return <Navigate to={user ? '/app/dashboard' : '/login'} replace />;
}

function AppLayout() {
  return (
    <AppShell>
      <Routes>
        {appRoutes.map(route => (
          <Route
            key={route.path}
            path={route.path.replace('/app/', '')}
            element={<RoleGate roles={route.roles}>{route.element}</RoleGate>}
          />
        ))}
        <Route path="*" element={<Navigate to="/app/dashboard" replace />} />
      </Routes>
    </AppShell>
  );
}

export function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute roles={['student', 'teacher', 'admin', 'owner', 'panda']} />}>
        <Route path="/app/*" element={<AppLayout />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
