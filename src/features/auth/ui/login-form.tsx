import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../../shared/ui/buttons/button';
import { Input } from '../../../shared/ui/forms/input';
import { toast } from '../../../shared/ui/feedback/toaster';
import { useAuthStore } from '../model/auth-store';

export function LoginForm() {
  const navigate = useNavigate();
  const login = useAuthStore(state => state.login);
  const isLoading = useAuthStore(state => state.isLoading);
  const error = useAuthStore(state => state.error);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      await login({ username, password });
      toast.success('Signed in successfully');
      navigate('/app/dashboard', { replace: true });
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : 'Login failed';
      toast.error(message);
    }
  }

  return (
    <div className="login-card">
      <form className="login-form" onSubmit={handleSubmit}>
        <div className="login-form__header">
          <span className="eyebrow">Sign in</span>
          <h1>Welcome back</h1>
          <p>Use your CRM account to continue.</p>
        </div>

        {error ? <div className="banner banner--error">{error}</div> : null}

        <div className="form-stack">
          <Input
            autoComplete="username"
            disabled={isLoading}
            label="Username"
            name="username"
            onChange={event => setUsername(event.target.value)}
            required
            type="text"
            value={username}
          />
          <Input
            autoComplete="current-password"
            disabled={isLoading}
            label="Password"
            name="password"
            onChange={event => setPassword(event.target.value)}
            required
            type="password"
            value={password}
          />
        </div>

        <Button disabled={isLoading} fullWidth type="submit">
          {isLoading ? 'Signing in...' : 'Sign in'}
        </Button>
      </form>
    </div>
  );
}
