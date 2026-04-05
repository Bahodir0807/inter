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
        <span className="eyebrow">Ibrat CRM</span>
        <div className="login-page__headline">
          <h2>Run daily center work from one place.</h2>
          <p>People, courses, groups, schedule, rooms, and payments stay connected.</p>
        </div>
        <div className="login-page__highlights">
          <div className="login-page__highlight">
            <strong>People</strong>
            <span>Accounts, roles, and groups stay together.</span>
          </div>
          <div className="login-page__highlight">
            <strong>Schedule</strong>
            <span>Courses, rooms, teachers, and groups stay linked.</span>
          </div>
          <div className="login-page__highlight">
            <strong>Payments</strong>
            <span>Each payment stays tied to the right student and course.</span>
          </div>
        </div>
        <p className="login-page__note">Built for daily work.</p>
      </div>
      <LoginForm />
    </div>
  );
}
