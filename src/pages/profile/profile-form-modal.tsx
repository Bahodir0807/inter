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

const schema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  email: z.string().email('Enter a valid email address').optional().or(z.literal('')),
  phoneNumber: z.string().optional(),
  avatarUrl: z.string().url('Enter a valid URL').optional().or(z.literal('')),
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
      avatarUrl: '',
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
      avatarUrl: profile?.avatarUrl ?? '',
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
        title="Edit profile"
        description="Update the contact details you manage yourself. Login access, role, and Telegram linkage stay admin-managed."
      >
        <form className="modal-form" onSubmit={handleSubmit(async values => onSubmit(values))}>
          <FormSection
            title="Personal details"
            description="These details appear across the workspace wherever your profile is referenced."
          >
            <div className="detail-grid">
              <Input
                label="First name"
                placeholder="Aziza"
                autoComplete="given-name"
                error={errors.firstName?.message}
                fieldClassName="ui-field--primary"
                {...register('firstName')}
              />
              <Input
                label="Last name"
                placeholder="Karimova"
                autoComplete="family-name"
                error={errors.lastName?.message}
                fieldClassName="ui-field--primary"
                {...register('lastName')}
              />
            </div>
          </FormSection>
          <FormSection
            title="Contact details"
            description="Keep these up to date so reminders, receipts, and team follow-ups reach the right place."
          >
            <div className="detail-grid">
              <Input
                label="Email"
                type="email"
                placeholder="name@example.com"
                autoComplete="email"
                error={errors.email?.message}
                {...register('email')}
              />
              <Input
                label="Phone"
                placeholder="+998 90 123 45 67"
                autoComplete="tel"
                error={errors.phoneNumber?.message}
                {...register('phoneNumber')}
              />
              <Input
                label="Avatar URL"
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
              {isDirty
                ? 'Changes are ready to save.'
                : 'Update only the details you want other operators to see and use.'}
            </span>
            <div className="inline-actions">
              <Button type="submit" disabled={loading || !isValid || !isDirty}>
                {loading ? 'Saving...' : 'Save profile'}
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
        description="You have unsaved profile changes. Discard them and close the modal?"
        confirmLabel="Discard changes"
        cancelLabel="Keep editing"
        tone="danger"
        onConfirm={closeGuard.confirmDiscard}
        onClose={closeGuard.cancelDiscard}
      />
    </>
  );
}
