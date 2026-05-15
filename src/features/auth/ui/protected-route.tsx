import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../model/auth-store';
import { useI18n } from '../../../shared/i18n/i18n';
import { Role } from '../../../shared/types/auth';

interface ProtectedRouteProps {
  roles?: Role[];
}

export function ProtectedRoute({ roles = [] }: ProtectedRouteProps) {
  const location = useLocation();
  const user = useAuthStore(state => state.user);
  const bootstrapped = useAuthStore(state => state.bootstrapped);
  const { t } = useI18n();

  if (!bootstrapped) {
    return <div className="app-loading">{t('common.loading')}</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (roles.length > 0 && !roles.includes(user.role)) {
    return <Navigate to="/app/dashboard" replace />;
  }

  return <Outlet />;
}
