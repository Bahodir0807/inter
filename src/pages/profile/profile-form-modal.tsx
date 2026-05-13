import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { AppUser } from '../../shared/types/auth';
import { ProfileSelfServiceValues } from '../../entities/user/api';
import { ModalShell } from '../../shared/ui/overlay/modal-shell';
import { ConfirmModal } from '../../shared/ui/overlay/confirm-modal';
import { Input } from '../../shared/ui/forms/input';
import { FormSection } from '../../shared/ui/forms/form-section';
import { Button } from '../../shared/ui/buttons/button';
import { useUnsavedChangesGuard } from '../../shared/hooks/use-unsaved-changes-guard';
import { useI18n } from '../../shared/i18n/i18n';

const schema = z.object({
  firstName: z.string().trim().min(1, 'First name is required'),
  lastName: z.string().trim().min(1, 'Last name is required'),
  email: z.string().email('Enter a valid email address').optional().or(z.literal('')),
  phoneNumber: z.string().optional(),
});

type ProfileFormInput = z.infer<typeof schema>;

export function ProfileFormModal({
  open,
  profile,
  loading,
  onClose,
  onSubmit,
}: {
  open: boolean;
  profile: AppUser | null;
  loading: boolean;
  onClose: () => void;
  onSubmit: (values: ProfileSelfServiceValues) => Promise<void>;
}) {
  const { t } = useI18n();
  const {
    register,
    reset,
    handleSubmit,
    setFocus,
    formState: { errors, isDirty, isValid },
  } = useForm<ProfileFormInput>({
    resolver: zodResolver(schema),
    mode: 'onChange',
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phoneNumber: '',
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
      firstName: profile?.firstName ?? '',
      lastName: profile?.lastName ?? '',
      email: profile?.email ?? '',
      phoneNumber: profile?.phoneNumber ?? '',
    });

    window.setTimeout(() => setFocus('firstName'), 0);
  }, [open, profile, reset, setFocus]);

  return (
    <>
      <ModalShell
        open={open}
        onClose={closeGuard.requestClose}
        closeOnBackdrop={!loading}
        closeOnEscape={!loading}
        closeDisabled={loading}
        title={t('profile.editButton')}
        description={t('profile.formDescription')}
      >
        <form className="modal-form" onSubmit={handleSubmit(async values => onSubmit(values))}>
          <FormSection
            title={t('profile.personalDetails')}
            description={t('profile.personalDetailsDescription')}
          >
            <div className="detail-grid">
              <Input
                label={t('users.field.firstName')}
                placeholder="Aziza"
                autoComplete="given-name"
                error={errors.firstName?.message}
                fieldClassName="ui-field--primary"
                required
                {...register('firstName')}
              />
              <Input
                label={t('users.field.lastName')}
                placeholder="Karimova"
                autoComplete="family-name"
                error={errors.lastName?.message}
                fieldClassName="ui-field--primary"
                required
                {...register('lastName')}
              />
            </div>
          </FormSection>
          <FormSection
            title={t('dashboard.contactDetails')}
            description={t('profile.contactDetailsDescription')}
          >
            <div className="detail-grid">
              <Input
                label={t('profile.email')}
                type="email"
                placeholder="name@example.com"
                autoComplete="email"
                error={errors.email?.message}
                {...register('email')}
              />
              <Input
                label={t('profile.phone')}
                placeholder="+998 90 123 45 67"
                autoComplete="tel"
                error={errors.phoneNumber?.message}
                {...register('phoneNumber')}
              />
            </div>
          </FormSection>
          <div className="form-actions">
            <span className="subtle">
              {isDirty
                ? t('common.changesReadyToSave')
                : t('profile.formHint')}
            </span>
            <div className="inline-actions">
              <Button type="submit" disabled={loading || !isValid || !isDirty}>
                {loading ? t('common.saving') : t('profile.saveProfile')}
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
        description={t('profile.discardDescription')}
        confirmLabel={t('common.discardChangesConfirm')}
        cancelLabel={t('common.keepEditing')}
        tone="danger"
        onConfirm={closeGuard.confirmDiscard}
        onClose={closeGuard.cancelDiscard}
      />
    </>
  );
}
