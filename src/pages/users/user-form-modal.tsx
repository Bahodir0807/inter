import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { ModalShell } from '../../shared/ui/overlay/modal-shell';
import { ConfirmModal } from '../../shared/ui/overlay/confirm-modal';
import { Input } from '../../shared/ui/forms/input';
import { Select } from '../../shared/ui/forms/select';
import { FormSection } from '../../shared/ui/forms/form-section';
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

const editSchema = createSchema;

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
        closeOnBackdrop={!loading}
        closeOnEscape={!loading}
        closeDisabled={loading}
        title={mode === 'create' ? 'Create user' : 'Edit user'}
        description="Manage account details, role, and profile fields without leaving the registry."
      >
        <form
          className="modal-form"
          onSubmit={handleSubmit(async values => {
            await onSubmit(values);
          })}
        >
          <FormSection
            title="Account"
            description="Start with the login identity and access level. These fields define how the user enters the system."
          >
            <Input
              label="Username"
              hint="Used for sign in and internal search."
              placeholder="For example: aziza.student"
              autoComplete="username"
              error={errors.username?.message}
              fieldClassName="ui-field--primary"
              {...register('username')}
            />
            <div className="detail-grid">
              <Input
                label={mode === 'create' ? 'Password' : 'New password'}
                hint={
                  mode === 'create'
                    ? 'Set a temporary password the user can change later.'
                    : 'Password is required when updating the account.'
                }
                type="password"
                placeholder={mode === 'create' ? 'Set a temporary password' : 'Enter a new password'}
                autoComplete="new-password"
                error={errors.password?.message}
                {...register('password')}
              />
              <Select
                label="Role"
                hint="Controls the screens and actions available after sign in."
                error={errors.role?.message}
                {...register('role')}
              >
                {roleOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </div>
          </FormSection>
          <FormSection
            title="Profile"
            description="Add the details operators use most often when they scan the directory or need to contact the user."
          >
            <div className="detail-grid">
              <Input
                label="First name"
                placeholder="Aziza"
                autoComplete="given-name"
                error={errors.firstName?.message}
                {...register('firstName')}
              />
              <Input
                label="Last name"
                placeholder="Karimova"
                autoComplete="family-name"
                error={errors.lastName?.message}
                {...register('lastName')}
              />
              <Input
                label="Email"
                hint="Useful for receipts, reminders, and account recovery."
                type="email"
                placeholder="name@example.com"
                autoComplete="email"
                error={errors.email?.message}
                {...register('email')}
              />
              <Input
                label="Phone"
                hint="Shown in tables and quick contact flows."
                placeholder="+998 90 123 45 67"
                autoComplete="tel"
                error={errors.phoneNumber?.message}
                {...register('phoneNumber')}
              />
            </div>
          </FormSection>
          <FormSection
            title="Additional links"
            description="These fields are optional and only help when your team needs richer profile context."
          >
            <div className="detail-grid">
              <Input
                label="Telegram ID"
                hint="Numeric ID or handle used by your team."
                placeholder="@aziza_karimova or 123456789"
                error={errors.telegramId?.message}
                fieldClassName="ui-field--quiet"
                {...register('telegramId')}
              />
              <Input
                label="Avatar URL"
                hint="Public image URL used in user cards and profile references."
                placeholder="https://example.com/avatar.jpg"
                autoComplete="url"
                error={errors.avatarUrl?.message}
                fieldClassName="ui-field--quiet"
                {...register('avatarUrl')}
              />
            </div>
          </FormSection>
          <div className="form-actions">
            <span className="subtle">
              {isDirty ? 'Changes are ready to save.' : mode === 'edit' ? 'Update the fields you want to change.' : 'Start with account access, then add profile details.'}
            </span>
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
        description="You have unsaved changes in this form. Discard them and close the modal?"
        confirmLabel="Discard changes"
        cancelLabel="Keep editing"
        tone="danger"
        onConfirm={closeGuard.confirmDiscard}
        onClose={closeGuard.cancelDiscard}
      />
    </>
  );
}
