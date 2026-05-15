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
import { Group } from '../../entities/group/api';
import { useUnsavedChangesGuard } from '../../shared/hooks/use-unsaved-changes-guard';
import { getCourseDisplayName, getRoleDisplayName, getUserListSummary } from '../../shared/lib/entity-display';
import { useI18n } from '../../shared/i18n/i18n';

const requiredText = (message: string) => z.string().trim().min(1, message);
const optionalText = z.string().trim().optional().or(z.literal(''));
const paymentMethodSchema = z.enum(['cash', 'card']).optional().or(z.literal(''));

const createSchema = z.object({
  username: z.string().trim().min(3, 'Username must be at least 3 characters'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['owner', 'admin', 'teacher', 'student', 'panda', 'guest']).optional(),
  email: z.string().email('Enter a valid email address').optional().or(z.literal('')),
  firstName: requiredText('First name is required'),
  lastName: requiredText('Last name is required'),
  phoneNumber: optionalText,
  studentYear: optionalText,
  paymentMethod: paymentMethodSchema,
  contactOwner: optionalText,
  contactOwnerFullName: optionalText,
  contactOwnerRelation: optionalText,
  telegramId: optionalText,
  groupId: z.string().optional().or(z.literal('')),
});

const editSchema = createSchema.extend({
  password: z.string().min(8, 'Password must be at least 8 characters').optional().or(z.literal('')),
});

export type UserFormInput = z.infer<typeof editSchema>;

interface UserFormModalProps {
  open: boolean;
  mode: 'create' | 'edit';
  user?: AppUser | null;
  groups?: Group[];
  currentGroupIds?: string[];
  groupsLoading?: boolean;
  groupsError?: string | null;
  onClose: () => void;
  onSubmit: (values: UserFormInput) => Promise<void>;
  loading: boolean;
}

function getGroupTeachers(group: Group) {
  if (group.course && typeof group.course !== 'string' && Array.isArray(group.course.teachers) && group.course.teachers.length > 0) {
    return group.course.teachers;
  }

  if (group.course && typeof group.course !== 'string' && Array.isArray(group.course.teacherIds) && group.course.teacherIds.length > 0) {
    return group.course.teacherIds;
  }

  return [group.teacher].filter(Boolean);
}

function getGroupOptionLabel(group: Group) {
  return [
    getCourseDisplayName(group.course),
    group.name,
    getUserListSummary(getGroupTeachers(group), 3),
  ].filter(Boolean).join(' / ');
}

export function UserFormModal({
  open,
  mode,
  user,
  groups = [],
  currentGroupIds = [],
  groupsLoading = false,
  groupsError = null,
  onClose,
  onSubmit,
  loading,
}: UserFormModalProps) {
  const { t } = useI18n();
  const schema = mode === 'create' ? createSchema : editSchema;
  const {
    register,
    reset,
    watch,
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
      studentYear: '',
      paymentMethod: '',
      contactOwner: '',
      contactOwnerFullName: '',
      contactOwnerRelation: '',
      telegramId: '',
      groupId: '',
    },
  });

  const closeGuard = useUnsavedChangesGuard({
    open,
    isDirty,
    onDiscard: onClose,
  });
  const currentGroupId = currentGroupIds[0] ?? '';

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
      studentYear: user?.studentYear ?? '',
      paymentMethod: user?.paymentMethod ?? '',
      contactOwner: user?.contactOwner ?? '',
      contactOwnerFullName: user?.contactOwnerFullName ?? '',
      contactOwnerRelation: user?.contactOwnerRelation ?? '',
      telegramId: user?.telegramId ?? '',
      groupId: currentGroupId,
    });

    window.setTimeout(() => setFocus('username'), 0);
  }, [currentGroupId, open, reset, setFocus, user]);

  const selectedRole = watch('role');
  const showGroupSelector = selectedRole === 'student';
  const currentGroupNames = currentGroupIds
    .map(groupId => groups.find(group => group.id === groupId))
    .filter((group): group is Group => !!group)
    .map(group => group.name);
  const groupSelectorHint = groupsLoading
    ? t('users.group.loading', 'Loading groups...')
    : groupsError
      ? groupsError
      : groups.length === 0
        ? t('users.group.empty', 'No groups available yet.')
        : currentGroupNames.length > 0
          ? t('users.group.current', 'Current group: {{group}}', { group: currentGroupNames.join(', ') })
          : t('users.group.hint', 'Select a group to attach this student after save.');

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
            title={t('users.formSection.studentTitle')}
            description={t('users.formSection.studentDescription')}
          >
            <div className="detail-grid">
              {showGroupSelector ? (
                <Select
                  label={t('users.field.group', 'Group')}
                  hint={groupSelectorHint}
                  disabled={loading || groupsLoading || groups.length === 0}
                  fieldClassName="ui-field--quiet"
                  {...register('groupId')}
                >
                  <option value="">{t('users.group.notAssigned', 'No group selected')}</option>
                  {groups.map(group => (
                    <option key={group.id} value={group.id}>
                      {getGroupOptionLabel(group)}
                    </option>
                  ))}
                </Select>
              ) : null}
              <Input
                label={t('users.field.studentYear')}
                placeholder="2026, 1-kurs, 9-sinf"
                error={errors.studentYear?.message}
                fieldClassName="ui-field--quiet"
                {...register('studentYear')}
              />
              <Select
                label={t('users.field.paymentMethod')}
                error={errors.paymentMethod?.message}
                fieldClassName="ui-field--quiet"
                {...register('paymentMethod')}
              >
                <option value="">{t('common.notSet')}</option>
                <option value="cash">{t('users.paymentMethod.cash')}</option>
                <option value="card">{t('users.paymentMethod.card')}</option>
              </Select>
              <Input
                label={t('users.field.contactOwner')}
                placeholder="ota, ona, aka, opa, o'zi"
                error={errors.contactOwner?.message}
                fieldClassName="ui-field--quiet"
                {...register('contactOwner')}
              />
              <Input
                label={t('users.field.contactOwnerFullName')}
                placeholder="Aliyev Sardor"
                error={errors.contactOwnerFullName?.message}
                fieldClassName="ui-field--quiet"
                {...register('contactOwnerFullName')}
              />
              <Input
                label={t('users.field.contactOwnerRelation')}
                placeholder="otasi, onasi, akasi, opasi, vasiy, o'zi"
                error={errors.contactOwnerRelation?.message}
                fieldClassName="ui-field--quiet"
                {...register('contactOwnerRelation')}
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
