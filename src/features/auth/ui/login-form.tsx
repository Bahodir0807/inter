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
      const destination = (location.state as { from?: string } | null)?.from ?? '/app/dashboard';
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
        <span className="eyebrow">Ibrat CRM</span>
        <h1>Sign in</h1>
        <p>Authentication uses the live backend at `/auth/login`, not mocked demo data.</p>
      </div>
      <form className="login-form" onSubmit={onSubmit}>
        <Input label="Username" autoComplete="username" error={errors.username?.message} {...register('username')} />
        <Input
          label="Password"
          type="password"
          autoComplete="current-password"
          error={errors.password?.message}
          {...register('password')}
        />
        {error ? <p className="form-error">{error.message.join(', ')}</p> : null}
        <Button type="submit" disabled={status === 'loading'} fullWidth>
          {status === 'loading' ? 'Signing in...' : 'Sign in'}
        </Button>
      </form>
    </Card>
  );
}
