import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { ModalShell } from '../../shared/ui/overlay/modal-shell';
import { ConfirmModal } from '../../shared/ui/overlay/confirm-modal';
import { Input } from '../../shared/ui/forms/input';
import { Select } from '../../shared/ui/forms/select';
import { Button } from '../../shared/ui/buttons/button';
import { AppUser, roleOptions } from '../../shared/types/auth';
import { useUnsavedChangesGuard } from '../../shared/hooks/use-unsaved-changes-guard';

const createSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['owner', 'admin', 'teacher', 'student', 'panda', 'guest']),
  email: z.string().email('Enter a valid email address').optional().or(z.literal('')),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  phoneNumber: z.string().optional(),
  avatarUrl: z.string().optional(),
  telegramId: z.string().optional(),
});

const editSchema = createSchema.extend({
  password: z.string().min(8, 'Password must be at least 8 characters').optional().or(z.literal('')),
});

export type UserFormInput = z.infer<typeof editSchema>;

interface UserFormModalProps {
  open: boolean;
  mode: 'create' | 'edit';
  user?: AppUser | null;
  onClose: () => void;
  onSubmit: (values: UserFormInput) => Promise<void>;
  loading: boolean;
}

export function UserFormModal({ open, mode, user, onClose, onSubmit, loading }: UserFormModalProps) {
  const schema = mode === 'create' ? createSchema : editSchema;
  const {
    register,
    reset,
    handleSubmit,
    setFocus,
    formState: { errors, isDirty, isValid },
  } = useForm<UserFormInput>({
    resolver: zodResolver(schema),
    mode: 'onChange',
    defaultValues: {
      username: '',
      password: '',
      role: 'student',
      email: '',
      firstName: '',
      lastName: '',
      phoneNumber: '',
      avatarUrl: '',
      telegramId: '',
    },
  });

  const closeGuard = useUnsavedChangesGuard({
    open,
    isDirty,
    onDiscard: onClose,
  });

  useEffect(() => {
    if (!open) {
      return;
    }

    reset({
      username: user?.username ?? '',
      password: '',
      role: user?.role ?? 'student',
      email: user?.email ?? '',
      firstName: user?.firstName ?? '',
      lastName: user?.lastName ?? '',
      phoneNumber: user?.phoneNumber ?? '',
      avatarUrl: user?.avatarUrl ?? '',
      telegramId: user?.telegramId ?? '',
    });

    window.setTimeout(() => setFocus('username'), 0);
  }, [open, reset, setFocus, user]);

  return (
    <>
      <ModalShell
        open={open}
        onClose={closeGuard.requestClose}
        title={mode === 'create' ? 'Create user' : 'Edit user'}
        description="Manage account details, role, and profile fields without leaving the registry."
      >
        <form
          className="stack"
          onSubmit={handleSubmit(async values => {
            await onSubmit(values);
          })}
        >
          <Input
            label="Username"
            placeholder="For example: aziza.student"
            autoComplete="username"
            error={errors.username?.message}
            {...register('username')}
          />
          <Input
            label={mode === 'create' ? 'Password' : 'New password'}
            type="password"
            placeholder={mode === 'create' ? 'Set a temporary password' : 'Leave blank to keep the current password'}
            autoComplete="new-password"
            error={errors.password?.message}
            {...register('password')}
          />
          <Select label="Role" error={errors.role?.message} {...register('role')}>
            {roleOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
          <div className="detail-grid">
            <Input label="First name" placeholder="First name" error={errors.firstName?.message} {...register('firstName')} />
            <Input label="Last name" placeholder="Last name" error={errors.lastName?.message} {...register('lastName')} />
            <Input label="Email" type="email" placeholder="name@example.com" error={errors.email?.message} {...register('email')} />
            <Input label="Phone" placeholder="+998 ..." error={errors.phoneNumber?.message} {...register('phoneNumber')} />
            <Input label="Telegram ID" placeholder="123456789" error={errors.telegramId?.message} {...register('telegramId')} />
            <Input label="Avatar URL" placeholder="https://..." error={errors.avatarUrl?.message} {...register('avatarUrl')} />
          </div>
          <div className="form-actions">
            <span className="subtle">{isDirty ? 'Unsaved changes' : mode === 'edit' ? 'No changes yet' : 'Fill in the fields to create a user'}</span>
            <div className="inline-actions">
              <Button type="submit" disabled={loading || !isValid || (mode === 'edit' && !isDirty)}>
                {loading ? 'Saving...' : mode === 'create' ? 'Create user' : 'Save changes'}
              </Button>
              <Button type="button" variant="ghost" onClick={closeGuard.requestClose} disabled={loading}>
                Cancel
              </Button>
            </div>
          </div>
        </form>
      </ModalShell>
      <ConfirmModal
        open={closeGuard.confirmOpen}
        title="Discard changes?"
        description="You have unsaved changes in this form. Close it without saving?"
        confirmLabel="Discard changes"
        tone="danger"
        onConfirm={closeGuard.confirmDiscard}
        onClose={closeGuard.cancelDiscard}
      />
    </>
  );
}
