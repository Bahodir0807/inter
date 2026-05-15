import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Course } from '../../entities/course/api';
import { PaymentFormValues } from '../../entities/payment/api';
import { AppUser } from '../../shared/types/auth';
import { ModalShell } from '../../shared/ui/overlay/modal-shell';
import { ConfirmModal } from '../../shared/ui/overlay/confirm-modal';
import { Select } from '../../shared/ui/forms/select';
import { Input } from '../../shared/ui/forms/input';
import { FormSection } from '../../shared/ui/forms/form-section';
import { Button } from '../../shared/ui/buttons/button';
import { getCourseDisplayName, getUserDisplayName } from '../../shared/lib/entity-display';
import { useUnsavedChangesGuard } from '../../shared/hooks/use-unsaved-changes-guard';
import { useI18n } from '../../shared/i18n/i18n';

const schema = z.object({
  student: z.string().min(1, 'payments.validation.student'),
  courseId: z.string().min(1, 'payments.validation.course'),
  method: z.string().optional(),
  paidAt: z.string().optional(),
});

type PaymentFormInput = z.infer<typeof schema>;

function toLocalDateTime(value?: string) {
  if (!value) {
    return '';
  }

  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function getDefaultPaymentValues(defaultStudentId: string, defaultCourseId: string) {
  return {
    student: defaultStudentId,
    courseId: defaultCourseId,
    method: '',
    paidAt: toLocalDateTime(new Date().toISOString()),
  };
}

export function PaymentFormModal({
  open,
  students,
  courses,
  loading,
  onClose,
  onSubmit,
}: {
  open: boolean;
  students: AppUser[];
  courses: Course[];
  loading: boolean;
  onClose: () => void;
  onSubmit: (values: PaymentFormValues) => Promise<void>;
}) {
  const { t } = useI18n();
  const resolveErrorMessage = (key: string | undefined) => (key ? t(key) : undefined);
  const {
    register,
    reset,
    handleSubmit,
    setFocus,
    formState: { errors, isDirty, isValid },
  } = useForm<PaymentFormInput>({
    resolver: zodResolver(schema),
    mode: 'onChange',
    defaultValues: {
      student: '',
      courseId: '',
      method: '',
      paidAt: '',
    },
  });

  const closeGuard = useUnsavedChangesGuard({
    open,
    isDirty,
    onDiscard: onClose,
  });

  const defaultStudentId = students.length === 1 ? students[0]?.id ?? '' : '';
  const defaultCourseId = courses.length === 1 ? courses[0]?.id ?? '' : '';

  useEffect(() => {
    if (!open) {
      return;
    }

    reset(getDefaultPaymentValues(defaultStudentId, defaultCourseId));

    window.setTimeout(() => setFocus('student'), 0);
  }, [defaultCourseId, defaultStudentId, open, reset, setFocus]);

  return (
    <>
      <ModalShell
        open={open}
        onClose={closeGuard.requestClose}
        closeOnBackdrop={!loading}
        closeOnEscape={!loading}
        closeDisabled={loading}
        title={t('payments.createPayment')}
        description={t('payments.formDescription')}
      >
        <form
          className="modal-form"
          onSubmit={handleSubmit(async values =>
            onSubmit({
              ...values,
              paidAt: values.paidAt ? new Date(values.paidAt).toISOString() : undefined,
            }))}
        >
          <FormSection
            title={t('payments.formSection.recordTitle')}
            description={t('payments.formSection.recordDescription')}
          >
            <div className="detail-grid">
              <Select
                label={t('academic.student')}
                hint={t('payments.field.studentHint')}
                error={resolveErrorMessage(errors.student?.message)}
                fieldClassName="ui-field--primary"
                {...register('student')}
              >
                <option value="">{t('academic.selectStudent')}</option>
                {students.map(student => (
                  <option key={student.id} value={student.id}>
                    {getUserDisplayName(student)}
                  </option>
                ))}
              </Select>
              <Select
                label={t('dashboard.table.course')}
                hint={t('payments.field.courseHint')}
                error={resolveErrorMessage(errors.courseId?.message)}
                {...register('courseId')}
              >
                <option value="">{t('payments.selectCourse')}</option>
                {courses.map(course => (
                  <option key={course.id} value={course.id}>
                    {getCourseDisplayName(course)}
                  </option>
                ))}
              </Select>
            </div>
          </FormSection>
          <FormSection
            title={t('payments.formSection.timingTitle')}
            description={t('payments.formSection.timingDescription')}
          >
            <Input
              label={t('payments.method')}
              hint={t('payments.methodHint')}
              placeholder={t('payments.methodPlaceholder')}
              error={resolveErrorMessage(errors.method?.message)}
              {...register('method')}
            />
            <Input
              label={t('payments.paidAt')}
              hint={t('payments.paidAtHint')}
              type="datetime-local"
              error={resolveErrorMessage(errors.paidAt?.message)}
              {...register('paidAt')}
            />
          </FormSection>
          <div className="form-actions">
            <span className="subtle">
              {isDirty ? t('common.changesReadyToSave') : t('payments.formHint.create')}
            </span>
            <div className="inline-actions">
              <Button type="submit" disabled={loading || !isValid}>
                {loading ? t('common.saving') : t('payments.createPayment')}
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
