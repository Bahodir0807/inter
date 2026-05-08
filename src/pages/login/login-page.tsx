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
    <div className="login-page auth-page">
      <div className="login-page__form-shell auth-page__form-shell">
        <LoginForm />
      </div>
    </div>
  );
}
