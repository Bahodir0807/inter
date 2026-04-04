import { PropsWithChildren } from 'react';
import { Navigate } from 'react-router-dom';
import { Role } from '../../../shared/types/auth';
import { useAuthStore } from '../model/auth-store';

export function RoleGate({ roles, children }: PropsWithChildren<{ roles: Role[] }>) {
  const user = useAuthStore(state => state.user);

  if (!user || !roles.includes(user.role)) {
    return <Navigate to="/app/dashboard" replace />;
  }

  return <>{children}</>;
}
