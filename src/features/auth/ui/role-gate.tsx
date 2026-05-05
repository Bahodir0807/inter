import { PropsWithChildren } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../model/auth-store';
import { Role } from '../../../shared/types/auth';

interface RoleGateProps extends PropsWithChildren {
  roles: Role[];
}

export function RoleGate({ roles, children }: RoleGateProps) {
  const user = useAuthStore(state => state.user);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!roles.includes(user.role)) {
    return <Navigate to="/app/dashboard" replace />;
  }

  return <>{children}</>;
}
