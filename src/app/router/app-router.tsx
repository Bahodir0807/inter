import { Navigate, Route, Routes } from 'react-router-dom';
import { Suspense } from 'react';
import { ProtectedRoute } from '../../features/auth/ui/protected-route';
import { RoleGate } from '../../features/auth/ui/role-gate';
import { useAuthStore } from '../../features/auth/model/auth-store';
import { AppShell } from '../../widgets/app-shell/app-shell';
import { LoginPage } from '../../pages/login/login-page';
import { appRoutes } from './navigation';
import { LoadingState } from '../../shared/ui/feedback/loading-state';
import { translate } from '../../shared/i18n/i18n';

function RootRedirect() {
  const user = useAuthStore(state => state.user);
  return <Navigate to={user ? '/app/dashboard' : '/login'} replace />;
}

export function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute roles={['student', 'teacher', 'admin', 'owner', 'panda']} />}>
        <Route path="/app" element={<AppShell />}>
          <Route index element={<Navigate to="/app/dashboard" replace />} />
          <Route path="homework" element={<Navigate to="/app/dashboard" replace />} />
          {appRoutes.map(route => (
            <Route
              key={route.path}
              path={route.path.replace('/app/', '')}
              element={(
                <RoleGate roles={route.roles}>
                  <Suspense fallback={<LoadingState label={translate('common.loadingPage')} />}>
                    {route.element}
                  </Suspense>
                </RoleGate>
              )}
            />
          ))}
          <Route path="*" element={<Navigate to="/app/dashboard" replace />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
