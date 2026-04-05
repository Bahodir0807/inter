import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../model/auth-store';
import { Button } from '../../../shared/ui/buttons/button';
import { Input } from '../../../shared/ui/forms/input';
import { Card } from '../../../shared/ui/surfaces/card';
import { toast } from '../../../shared/ui/feedback/toaster';

const schema = z.object({
  username: z.string().min(1, 'Enter your username'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormValues = z.infer<typeof schema>;

export function LoginForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const login = useAuthStore(state => state.login);
  const status = useAuthStore(state => state.status);
  const error = useAuthStore(state => state.error);
  const destination = (location.state as { from?: string } | null)?.from ?? '/app/dashboard';
  const destinationLabel =
    destination === '/app/dashboard'
      ? 'dashboard'
      : destination
          .replace('/app/', '')
          .replace('/', ' ')
          .replace(/-/g, ' ');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      username: '',
      password: '',
    },
  });

  const onSubmit = handleSubmit(async values => {
    try {
      await login(values);
      toast.success('Signed in successfully');
      navigate(destination, { replace: true });
    } catch (submitError) {
      const message = error?.message[0] ?? 'Unable to sign in';
      toast.error(message);
      console.error(submitError);
    }
  });

  return (
    <Card className="login-card">
      <div className="login-card__intro">
        <span className="eyebrow">Workspace access</span>
        <h1>Sign in</h1>
        <p>Continue into the live operations workspace with the account issued for your role.</p>
      </div>
      <div className="login-card__status">
        <span className="login-card__status-label">Next stop</span>
        <strong>{destinationLabel}</strong>
        <p>Authentication uses the live backend at `/auth/login`.</p>
      </div>
      <form className="login-form" onSubmit={onSubmit}>
        <Input
          label="Username"
          hint="Use the username issued by your team."
          placeholder="For example: aziza.teacher"
          autoComplete="username"
          fieldClassName="ui-field--primary"
          error={errors.username?.message}
          {...register('username')}
        />
        <Input
          label="Password"
          hint="Role-based access is applied after sign in."
          type="password"
          placeholder="Enter your password"
          autoComplete="current-password"
          error={errors.password?.message}
          {...register('password')}
        />
        {error ? <p className="form-error login-form__error">{error.message.join(', ')}</p> : null}
        <Button type="submit" disabled={status === 'loading'} fullWidth>
          {status === 'loading' ? 'Signing in...' : 'Sign in'}
        </Button>
      </form>
      <p className="login-card__footnote">People, courses, groups, schedule, rooms, and payments stay connected after sign in.</p>
    </Card>
  );
}
