import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LoginForm } from '../../features/auth/ui/login-form';
import { useAuthStore } from '../../features/auth/model/auth-store';
import { useI18n } from '../../shared/i18n/i18n';

export function LoginPage() {
  const navigate = useNavigate();
  const user = useAuthStore(state => state.user);
  const { t } = useI18n();

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
          <h2>{t('login.title')}</h2>
          <p>{t('login.description')}</p>
        </div>
        <div className="login-page__highlights">
          <div className="login-page__highlight">
            <strong>{t('login.people')}</strong>
            <span>{t('login.peopleHint')}</span>
          </div>
          <div className="login-page__highlight">
            <strong>{t('login.schedule')}</strong>
            <span>{t('login.scheduleHint')}</span>
          </div>
          <div className="login-page__highlight">
            <strong>{t('login.payments')}</strong>
            <span>{t('login.paymentsHint')}</span>
          </div>
        </div>
        <p className="login-page__note">{t('login.note')}</p>
      </div>
      <div className="login-page__form-shell">
        <LoginForm />
      </div>
    </div>
  );
}
