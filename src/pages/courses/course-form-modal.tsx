import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Course, CourseFormValues } from '../../entities/course/api';
import { AppUser } from '../../shared/types/auth';
import { ModalShell } from '../../shared/ui/overlay/modal-shell';
import { useI18n } from '../../shared/i18n/i18n';
import { ConfirmModal } from '../../shared/ui/overlay/confirm-modal';
import { Input } from '../../shared/ui/forms/input';
import { Textarea } from '../../shared/ui/forms/textarea';
import { Select } from '../../shared/ui/forms/select';
import { CheckboxGroup } from '../../shared/ui/forms/checkbox-group';
import { FormSection } from '../../shared/ui/forms/form-section';
import { Button } from '../../shared/ui/buttons/button';
import { getUserDisplayName } from '../../shared/lib/entity-display';
import { useUnsavedChangesGuard } from '../../shared/hooks/use-unsaved-changes-guard';

const schema = z.object({
  name: z.string().min(1, 'course.validation.name'),
  description: z.string().optional(),
  price: z.coerce.number().min(0, 'course.validation.price'),
  teacherId: z.string().optional(),
  students: z.array(z.string()),
});

type CourseFormInput = z.input<typeof schema>;
type CourseFormOutput = z.output<typeof schema>;

interface CourseFormModalProps {
  open: boolean;
  course?: Course | null;
  teachers: AppUser[];
  students: AppUser[];
  defaultTeacherId?: string;
  teacherLocked?: boolean;
  loading: boolean;
  onClose: () => void;
  onSubmit: (values: CourseFormValues) => Promise<void>;
}

export function CourseFormModal({
  open,
  course,
  teachers,
  students,
  defaultTeacherId,
  teacherLocked = false,
  loading,
  onClose,
  onSubmit,
}: CourseFormModalProps) {
  const {
    register,
    watch,
    setValue,
    reset,
    handleSubmit,
    setFocus,
    formState: { errors, isDirty, isValid },
  } = useForm<CourseFormInput, unknown, CourseFormOutput>({
    resolver: zodResolver(schema),
    mode: 'onChange',
    defaultValues: {
      name: '',
      description: '',
      price: 0,
      teacherId: '',
      students: [],
    },
  });

  const { t } = useI18n();
  const resolveErrorMessage = (key: string | undefined) => (key ? t(key) : undefined);

  const closeGuard = useUnsavedChangesGuard({
    open,
    isDirty,
    onDiscard: onClose,
  });

  const preferredTeacherId = defaultTeacherId ?? (teachers.length === 1 ? teachers[0]?.id ?? '' : '');

  useEffect(() => {
    if (!open) {
      return;
    }

    const teacherId =
      typeof course?.teacherId === 'string'
        ? course.teacherId
        : course?.teacherId?.id ?? preferredTeacherId;
    const selectedStudents = (course?.students ?? []).map(student =>
      typeof student === 'string' ? student : student.id,
    );

    reset({
      name: course?.name ?? '',
      description: course?.description ?? '',
      price: course?.price ?? 0,
      teacherId,
      students: selectedStudents,
    });

    window.setTimeout(() => setFocus('name'), 0);
  }, [course, open, preferredTeacherId, reset, setFocus]);

  const selectedStudents = watch('students');
  const selectedTeacherId = watch('teacherId');
  const teacherLabel = getUserDisplayName(
    teachers.find(teacher => teacher.id === selectedTeacherId)
      ?? teachers.find(teacher => teacher.id === preferredTeacherId),
  );

  return (
    <>
      <ModalShell
        open={open}
        onClose={closeGuard.requestClose}
        closeOnBackdrop={!loading}
        closeOnEscape={!loading}
        closeDisabled={loading}
        title={course ? t('course.editTitle') : t('course.createTitle')}
        description={t('course.formDescription')}
      >
        <form className="modal-form" onSubmit={handleSubmit(async values => onSubmit(values))}>
          <FormSection
            title={t('course.formSection.coreTitle')}
            description={t('course.formSection.coreDescription')}
          >
            <Input
              label={t('course.field.name')}
              hint={t('course.field.nameHint')}
              placeholder={t('course.field.namePlaceholder')}
              error={resolveErrorMessage(errors.name?.message)}
              fieldClassName="ui-field--primary"
              {...register('name')}
            />
            <Textarea
              label={t('course.field.description')}
              hint={t('course.field.descriptionHint')}
              placeholder={t('course.field.descriptionPlaceholder')}
              error={resolveErrorMessage(errors.description?.message)}
              {...register('description')}
            />
          </FormSection>
          <FormSection
            title={t('course.formSection.deliveryTitle')}
            description={t('course.formSection.deliveryDescription')}
          >
            <div className="detail-grid">
              <Input
                label={t('course.field.price')}
                hint={t('course.field.priceHint')}
                type="number"
                placeholder={t('course.field.pricePlaceholder')}
                error={resolveErrorMessage(errors.price?.message)}
                {...register('price')}
              />
              {teacherLocked ? (
                <>
                  <input type="hidden" {...register('teacherId')} />
                  <Input
                    label={t('course.field.teacher')}
                    hint={t('course.field.teacherHintLocked')}
                    value={teacherLabel || t('course.field.currentTeacher')}
                    readOnly
                  />
                </>
              ) : (
                <Select
                  label={t('course.field.teacher')}
                  hint={t('course.field.teacherHint')}
                  error={resolveErrorMessage(errors.teacherId?.message)}
                  {...register('teacherId')}
                >
                  <option value="">{t('course.noTeacherAssigned')}</option>
                  {teachers.map(teacher => (
                    <option key={teacher.id} value={teacher.id}>
                      {getUserDisplayName(teacher)}
                    </option>
                  ))}
                </Select>
              )}
            </div>
          </FormSection>
          <FormSection
            title={t('course.formSection.enrollmentTitle')}
            description={t('course.formSection.enrollmentDescription')}
          >
            <CheckboxGroup
              label={t('course.field.studentsLabel', { count: selectedStudents.length })}
              hint={t('course.field.studentsHint')}
              options={students.map(student => ({
                value: student.id,
                label: getUserDisplayName(student),
                description: student.phoneNumber || student.email,
              }))}
              values={selectedStudents}
              onChange={values => setValue('students', values, { shouldDirty: true, shouldValidate: true })}
            />
          </FormSection>
          <div className="form-actions">
            <span className="subtle">
              {isDirty ? t('common.changesReadyToSave') : course ? t('course.formHint.edit') : t('course.formHint.create')}
            </span>
            <div className="inline-actions">
              <Button type="submit" disabled={loading || !isValid || (!!course && !isDirty)}>
                {loading ? t('common.saving') : course ? t('common.saveChanges') : t('common.create')}
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
