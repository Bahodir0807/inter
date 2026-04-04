import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { Role } from '../../../shared/types/auth';
import { useAuthStore } from '../model/auth-store';
import { LoadingState } from '../../../shared/ui/feedback/loading-state';

export function ProtectedRoute({ roles }: { roles?: Role[] }) {
  const location = useLocation();
  const status = useAuthStore(state => state.status);
  const user = useAuthStore(state => state.user);

  if (status === 'loading' || status === 'idle') {
    return <LoadingState label="Проверяем сессию..." />;
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/app/dashboard" replace />;
  }

  return <Outlet />;
}
