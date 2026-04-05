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
          <h2>Daily center operations, kept in one calm workspace.</h2>
          <p>
            Sign in to work across people, programs, schedule, rooms, and payments without losing the operational context
            between screens.
          </p>
        </div>
        <div className="login-page__highlights">
          <div className="login-page__highlight">
            <strong>People and cohorts</strong>
            <span>Accounts, roles, groups, and ownership stay connected.</span>
          </div>
          <div className="login-page__highlight">
            <strong>Lesson flow</strong>
            <span>Courses, rooms, groups, teachers, and students remain visible in one path.</span>
          </div>
          <div className="login-page__highlight">
            <strong>Clean financial trace</strong>
            <span>Payments stay linked to the right learner and course from the first entry.</span>
          </div>
        </div>
        <p className="login-page__note">Built for real daily use, not just a demo dashboard.</p>
      </div>
      <LoginForm />
    </div>
  );
}
