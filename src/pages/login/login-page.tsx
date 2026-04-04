import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LoginForm } from '../../features/auth/ui/login-form';
import { useAuthStore } from '../../features/auth/model/auth-store';

export function LoginPage() {
  const navigate = useNavigate();
  const user = useAuthStore(state => state.user);

  useEffect(() => {
    if (user) {
      navigate('/app/dashboard', { replace: true });
    }
  }, [navigate, user]);

  return (
    <div className="login-page">
      <div className="login-page__panel">
        <span className="eyebrow">Education operations</span>
        <h2>Run the center from one workspace</h2>
        <p>
          Ibrat CRM already works as a real application: secure sign-in, role-based access, operational dashboards,
          and daily workflows for courses, groups, schedule, and payments.
        </p>
      </div>
      <LoginForm />
    </div>
  );
}
