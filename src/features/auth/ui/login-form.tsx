import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../../shared/ui/buttons/button';
import { Input } from '../../../shared/ui/forms/input';
import { toast } from '../../../shared/ui/feedback/toaster';
import { useAuthStore } from '../model/auth-store';
import { useI18n } from '../../../shared/i18n/i18n';

export function LoginForm() {
  const navigate = useNavigate();
  const login = useAuthStore(state => state.login);
  const isLoading = useAuthStore(state => state.isLoading);
  const error = useAuthStore(state => state.error);
  const { t } = useI18n();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      await login({ login: username, username, password });
      toast.success(t('login.success'));
      navigate('/app/dashboard', { replace: true });
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : t('login.failed');
      toast.error(message);
    }
  }

  return (
    <div className="login-card auth-panel">
      <form className="login-form auth-form" onSubmit={handleSubmit}>
        <div className="login-form__header auth-form__header">
          <span className="eyebrow">{t('login.signIn')}</span>
          <h1>{t('login.welcome')}</h1>
          <p>{t('login.useAccount')}</p>
        </div>

        {error ? <div className="banner banner--error">{error}</div> : null}

        <div className="form-stack">
          <Input
            autoComplete="username"
            disabled={isLoading}
            label={t('login.username')}
            name="username"
            onChange={event => setUsername(event.target.value)}
            required
            type="text"
            value={username}
          />
          <Input
            autoComplete="current-password"
            disabled={isLoading}
            label={t('login.password')}
            name="password"
            onChange={event => setPassword(event.target.value)}
            required
            type="password"
            value={password}
          />
        </div>

        <Button disabled={isLoading} fullWidth type="submit">
          {isLoading ? t('login.signingIn') : t('login.signIn')}
        </Button>
      </form>
    </div>
  );
}
