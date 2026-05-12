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
import { getRoleDisplayName } from '../../shared/lib/entity-display';
import { useI18n } from '../../shared/i18n/i18n';

const requiredText = (message: string) => z.string().trim().min(1, message);
const optionalText = z.string().trim().optional().or(z.literal(''));

const createSchema = z.object({
  username: z.string().trim().min(3, 'Username must be at least 3 characters'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['owner', 'admin', 'teacher', 'student', 'panda', 'guest']).optional(),
  email: z.string().email('Enter a valid email address').optional().or(z.literal('')),
  firstName: requiredText('First name is required'),
  lastName: requiredText('Last name is required'),
  phoneNumber: optionalText,
  avatarUrl: z.string().url('Enter a valid URL').optional().or(z.literal('')),
  telegramId: optionalText,
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
  const { t } = useI18n();
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
        title={mode === 'create' ? t('common.createUser') : t('users.editUser')}
        description={t('users.formDescription')}
      >
        <form
          className="modal-form"
          onSubmit={handleSubmit(async values => {
            await onSubmit(values);
          })}
        >
          <FormSection
            title={t('users.formSection.accountTitle')}
            description={t('users.formSection.accountDescription')}
          >
            <Input
              label={t('profile.username')}
              hint={t('users.field.usernameHint')}
              placeholder={t('users.field.usernamePlaceholder')}
              autoComplete="username"
              error={errors.username?.message}
              fieldClassName="ui-field--primary"
              required
              {...register('username')}
            />
            <div className="detail-grid">
              <Input
                label={mode === 'create' ? t('login.password') : t('profile.newPassword')}
                hint={
                  mode === 'create'
                    ? t('users.field.passwordHintCreate')
                    : t('users.field.passwordHintEdit')
                }
                type="password"
                placeholder={mode === 'create' ? t('users.field.passwordPlaceholderCreate') : t('users.field.passwordPlaceholderEdit')}
                autoComplete="new-password"
                error={errors.password?.message}
                required={mode === 'create'}
                {...register('password')}
              />
              <Select
                label={t('users.detailRole')}
                hint={t('users.field.roleHint')}
                error={errors.role?.message}
                {...register('role')}
              >
                {roleOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {getRoleDisplayName(option.value)}
                  </option>
                ))}
              </Select>
            </div>
          </FormSection>
          <FormSection
            title={t('profile.title')}
            description={t('users.formSection.profileDescription')}
          >
            <div className="detail-grid">
              <Input
                label={t('users.field.firstName')}
                placeholder="Aziza"
                autoComplete="given-name"
                error={errors.firstName?.message}
                required
                {...register('firstName')}
              />
              <Input
                label={t('users.field.lastName')}
                placeholder="Karimova"
                autoComplete="family-name"
                error={errors.lastName?.message}
                required
                {...register('lastName')}
              />
              <Input
                label={t('profile.email')}
                hint={t('users.field.emailHint')}
                type="email"
                placeholder="name@example.com"
                autoComplete="email"
                error={errors.email?.message}
                {...register('email')}
              />
              <Input
                label={t('profile.phone')}
                hint={t('users.field.phoneHint')}
                placeholder="+998 90 123 45 67"
                autoComplete="tel"
                error={errors.phoneNumber?.message}
                {...register('phoneNumber')}
              />
            </div>
          </FormSection>
          <FormSection
            title={t('users.formSection.linksTitle')}
            description={t('users.formSection.linksDescription')}
          >
            <div className="detail-grid">
              <Input
                label={t('users.field.telegramId')}
                hint={t('users.field.telegramHint')}
                placeholder="@aziza_karimova or 123456789"
                error={errors.telegramId?.message}
                fieldClassName="ui-field--quiet"
                {...register('telegramId')}
              />
              <Input
                label={t('users.field.avatarUrl')}
                hint={t('users.field.avatarHint')}
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
              {isDirty ? t('common.changesReadyToSave') : mode === 'edit' ? t('users.formHint.edit') : t('common.startWithAccountDetails')}
            </span>
            <div className="inline-actions">
              <Button type="submit" disabled={loading || !isValid || (mode === 'edit' && !isDirty)}>
                {loading ? t('common.saving') : mode === 'create' ? t('common.createUser') : t('common.saveChanges')}
              </Button>
              <Button type="button" variant="ghost" onClick={closeGuard.requestClose} disabled={loading}>
                {t('common.cancel')}
              </Button>
            </div>
          </div>
        </form>
      </ModalShell>
      <ConfirmModal
        open={closeGuard.confirmOpen}
        title={t('common.discardChangesTitle')}
        description={t('common.discardChangesDescription')}
        confirmLabel={t('common.discardChangesConfirm')}
        cancelLabel={t('common.keepEditing')}
        tone="danger"
        onConfirm={closeGuard.confirmDiscard}
        onClose={closeGuard.cancelDiscard}
      />
    </>
  );
}
