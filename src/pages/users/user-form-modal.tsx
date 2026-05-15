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
  username: z.string().trim().min(3, 'users.validation.username'),
  password: z.string().min(8, 'users.validation.password'),
  role: z.enum(['owner', 'admin', 'teacher', 'student', 'panda', 'guest']).optional(),
  email: z.string().email('validation.email').optional().or(z.literal('')),
  firstName: requiredText('users.validation.firstName'),
  lastName: requiredText('users.validation.lastName'),
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
  password: z.string().min(8, 'users.validation.password').optional().or(z.literal('')),
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
  const resolveErrorMessage = (key: string | undefined) => (key ? t(key) : undefined);
  const schema = mode === 'create' ? createSchema : editSchema;
  const {
    register,
    reset,
    watch,
    setValue,
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
  const isStudent = selectedRole === 'student';

  useEffect(() => {
    if (selectedRole !== 'student') {
      setValue('groupId', '');
      setValue('studentYear', '');
      setValue('paymentMethod', '');
      setValue('contactOwner', '');
      setValue('contactOwnerFullName', '');
      setValue('contactOwnerRelation', '');
      setValue('telegramId', '');
      setValue('email', '');
    }
  }, [selectedRole, setValue]);

  const showGroupSelector = isStudent;
  const currentGroupNames = currentGroupIds
    .map(groupId => groups.find(group => group.id === groupId))
    .filter((group): group is Group => !!group)
    .map(group => group.name);
  const groupSelectorHint = groupsLoading
    ? t('users.group.loading')
    : groupsError
      ? groupsError
      : groups.length === 0
        ? t('users.group.empty')
        : currentGroupNames.length > 0
          ? t('users.group.current', { group: currentGroupNames.join(', ') })
          : t('users.group.hint');

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
            const payload = isStudent
              ? values
              : {
                username: values.username,
                password: values.password,
                role: values.role,
                firstName: values.firstName,
                lastName: values.lastName,
                phoneNumber: values.phoneNumber,
              };

            await onSubmit(payload as UserFormInput);
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
              error={resolveErrorMessage(errors.username?.message)}
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
                error={resolveErrorMessage(errors.password?.message)}
                required={mode === 'create'}
                {...register('password')}
              />
              <Select
                label={t('users.detailRole')}
                hint={t('users.field.roleHint')}
                error={resolveErrorMessage(errors.role?.message)}
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
                placeholder={t('users.placeholder.firstName')}
                autoComplete="given-name"
                error={resolveErrorMessage(errors.firstName?.message)}
                required
                {...register('firstName')}
              />
              <Input
                label={t('users.field.lastName')}
                placeholder={t('users.placeholder.lastName')}
                autoComplete="family-name"
                error={resolveErrorMessage(errors.lastName?.message)}
                required
                {...register('lastName')}
              />
              {isStudent ? (
                <Input
                  label={t('profile.email')}
                  hint={t('users.field.emailHint')}
                  type="email"
                  placeholder={t('common.placeholder.email')}
                  autoComplete="email"
                  error={resolveErrorMessage(errors.email?.message)}
                  {...register('email')}
                />
              ) : null}
              <Input
                label={t('profile.phone')}
                hint={t('users.field.phoneHint')}
                placeholder={t('common.placeholder.phone')}
                autoComplete="tel"
                error={resolveErrorMessage(errors.phoneNumber?.message)}
                {...register('phoneNumber')}
              />
            </div>
          </FormSection>
          {isStudent ? (
            <>
              <FormSection
                title={t('users.formSection.studentTitle')}
                description={t('users.formSection.studentDescription')}
              >
                <div className="detail-grid">
                  {showGroupSelector ? (
                    <Select
                      label={t('users.field.group')}
                      hint={groupSelectorHint}
                      disabled={loading || groupsLoading || groups.length === 0}
                      fieldClassName="ui-field--quiet"
                      {...register('groupId')}
                    >
                      <option value="">{t('users.group.notAssigned')}</option>
                      {groups.map(group => (
                        <option key={group.id} value={group.id}>
                          {getGroupOptionLabel(group)}
                        </option>
                      ))}
                    </Select>
                  ) : null}
                  <Input
                    label={t('users.field.studentYear')}
                    placeholder={t('users.placeholder.studentYear')}
                    error={resolveErrorMessage(errors.studentYear?.message)}
                    fieldClassName="ui-field--quiet"
                    {...register('studentYear')}
                  />
                  <Select
                    label={t('users.field.paymentMethod')}
                    error={resolveErrorMessage(errors.paymentMethod?.message)}
                    fieldClassName="ui-field--quiet"
                    {...register('paymentMethod')}
                  >
                    <option value="">{t('common.notSet')}</option>
                    <option value="cash">{t('users.paymentMethod.cash')}</option>
                    <option value="card">{t('users.paymentMethod.card')}</option>
                  </Select>
                  <Input
                    label={t('users.field.contactOwner')}
                    placeholder={t('users.placeholder.contactOwner')}
                    error={resolveErrorMessage(errors.contactOwner?.message)}
                    fieldClassName="ui-field--quiet"
                    {...register('contactOwner')}
                  />
                  <Input
                    label={t('users.field.contactOwnerFullName')}
                    placeholder={t('users.placeholder.contactOwnerFullName')}
                    error={resolveErrorMessage(errors.contactOwnerFullName?.message)}
                    fieldClassName="ui-field--quiet"
                    {...register('contactOwnerFullName')}
                  />
                  <Input
                    label={t('users.field.contactOwnerRelation')}
                    placeholder={t('users.placeholder.contactOwnerRelation')}
                    error={resolveErrorMessage(errors.contactOwnerRelation?.message)}
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
                    placeholder={t('users.placeholder.telegramId')}
                    error={resolveErrorMessage(errors.telegramId?.message)}
                    fieldClassName="ui-field--quiet"
                    {...register('telegramId')}
                  />
                </div>
              </FormSection>
            </>
          ) : null}
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
