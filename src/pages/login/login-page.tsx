import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LoginForm } from '../../features/auth/ui/login-form';
import { useAuthStore } from '../../features/auth/model/auth-store';
import { cn } from '../../shared/lib/cn';
import styles from './login-page.module.css';

export function LoginPage() {
  const navigate = useNavigate();
  const user = useAuthStore(state => state.user);

  useEffect(() => {
    if (user) {
      navigate('/app/dashboard', { replace: true });
    }
  }, [navigate, user]);

  return (
    <div className={cn(styles.loginPage, styles.authPage)}>
      <div className={cn(styles.loginPageFormShell, styles.authPageFormShell)}>
        <LoginForm />
      </div>
    </div>
  );
}
