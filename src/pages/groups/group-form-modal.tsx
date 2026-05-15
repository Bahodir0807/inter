import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Group, GroupFormValues } from '../../entities/group/api';
import { Course } from '../../entities/course/api';
import { AppUser } from '../../shared/types/auth';
import { ModalShell } from '../../shared/ui/overlay/modal-shell';
import { ConfirmModal } from '../../shared/ui/overlay/confirm-modal';
import { Input } from '../../shared/ui/forms/input';
import { Select } from '../../shared/ui/forms/select';
import { CheckboxGroup } from '../../shared/ui/forms/checkbox-group';
import { FormSection } from '../../shared/ui/forms/form-section';
import { Button } from '../../shared/ui/buttons/button';
import { getCourseDisplayName, getUserDisplayName } from '../../shared/lib/entity-display';
import { useUnsavedChangesGuard } from '../../shared/hooks/use-unsaved-changes-guard';
import { useI18n } from '../../shared/i18n/i18n';

const schema = z.object({
  name: z.string().min(1, 'group.validation.name'),
  course: z.string().min(1, 'group.validation.course'),
  teacher: z.string().min(1, 'group.validation.teacher'),
  students: z.array(z.string()),
});

type GroupFormInput = z.input<typeof schema>;
type GroupFormOutput = z.output<typeof schema>;

export function GroupFormModal({
  open,
  group,
  courses,
  teachers,
  students,
  defaultTeacherId,
  teacherLocked = false,
  loading,
  onClose,
  onSubmit,
}: {
  open: boolean;
  group?: Group | null;
  courses: Course[];
  teachers: AppUser[];
  students: AppUser[];
  defaultTeacherId?: string;
  teacherLocked?: boolean;
  loading: boolean;
  onClose: () => void;
  onSubmit: (values: GroupFormValues) => Promise<void>;
}) {
  const { t } = useI18n();
  const resolveErrorMessage = (key: string | undefined) => (key ? t(key) : undefined);
  const {
    register,
    watch,
    setValue,
    setError,
    clearErrors,
    reset,
    handleSubmit,
    setFocus,
    formState: { errors, isDirty, isValid },
  } = useForm<GroupFormInput, unknown, GroupFormOutput>({
    resolver: zodResolver(schema),
    mode: 'onChange',
    defaultValues: {
      name: '',
      course: '',
      teacher: '',
      students: [],
    },
  });

  const closeGuard = useUnsavedChangesGuard({
    open,
    isDirty,
    onDiscard: onClose,
  });

  const preferredTeacherId = defaultTeacherId ?? (teachers.length === 1 ? teachers[0]?.id ?? '' : '');
  const preferredCourseId = courses.length === 1 ? courses[0]?.id ?? '' : '';

  useEffect(() => {
    if (!open) {
      return;
    }

    reset({
      name: group?.name ?? '',
      course: typeof group?.course === 'string' ? group.course : group?.course?.id ?? preferredCourseId,
      teacher: typeof group?.teacher === 'string' ? group.teacher : group?.teacher?.id ?? preferredTeacherId,
      students: (group?.students ?? []).map(student => (typeof student === 'string' ? student : student.id)),
    });

    window.setTimeout(() => setFocus('name'), 0);
  }, [group, open, preferredCourseId, preferredTeacherId, reset, setFocus]);

  const selectedStudents = watch('students');
  const selectedCourseId = watch('course');
  const selectedTeacherId = watch('teacher');
  const selectedCourse = courses.find(course => course.id === selectedCourseId);
  const courseTeacherIds = selectedCourse ? getCourseTeacherIds(selectedCourse) : [];
  const courseTeacherOptions = selectedCourse ? getCourseTeacherOptions(selectedCourse, teachers) : [];
  const hasSelectedCourse = !!selectedCourseId;
  const courseHasTeachers = courseTeacherOptions.length > 0;
  const selectedTeacherIsValid = !!selectedTeacherId && courseTeacherIds.includes(selectedTeacherId);
  const existingTeacherId = group
    ? typeof group.teacher === 'string' ? group.teacher : group.teacher.id
    : '';
  const existingTeacherNoLongerLinked = !!group && !!selectedCourse && !!existingTeacherId && !courseTeacherIds.includes(existingTeacherId);
  const teacherHint = !hasSelectedCourse
    ? t('group.field.teacherHintSelectCourse')
    : !courseHasTeachers
      ? t('group.field.teacherHintNoCourseTeachers')
      : existingTeacherNoLongerLinked
        ? t('group.field.teacherHintInvalidExisting')
        : t('group.field.teacherHintCourseTeachers');
  const teacherLabel = getUserDisplayName(
    courseTeacherOptions.find(teacher => teacher.id === selectedTeacherId)
      ?? courseTeacherOptions.find(teacher => teacher.id === preferredTeacherId),
  );
  const canSubmit = isValid && selectedTeacherIsValid && courseHasTeachers;

  useEffect(() => {
    if (!open || !selectedCourseId) {
      return;
    }

    if (selectedTeacherId && !courseTeacherIds.includes(selectedTeacherId)) {
      setValue('teacher', '', { shouldDirty: true, shouldValidate: true });
      return;
    }

    if (!selectedTeacherId && courseTeacherOptions.length === 1) {
      setValue('teacher', courseTeacherOptions[0].id, { shouldDirty: true, shouldValidate: true });
    }
  }, [courseTeacherIds, courseTeacherOptions, open, selectedCourseId, selectedTeacherId, setValue]);

  useEffect(() => {
    if (!selectedTeacherId || selectedTeacherIsValid) {
      clearErrors('teacher');
    }
  }, [clearErrors, selectedTeacherId, selectedTeacherIsValid]);

  async function submit(values: GroupFormOutput) {
    const submitCourse = courses.find(course => course.id === values.course);
    const validTeacherIds = submitCourse ? getCourseTeacherIds(submitCourse) : [];

    if (!validTeacherIds.includes(values.teacher)) {
      setError('teacher', {
        type: 'validate',
        message: 'group.field.teacherCourseMismatch',
      });
      return;
    }

    await onSubmit(values);
  }

  return (
    <>
      <ModalShell
        open={open}
        onClose={closeGuard.requestClose}
        closeOnBackdrop={!loading}
        closeOnEscape={!loading}
        closeDisabled={loading}
        title={group ? t('group.editGroup') : t('group.createGroup')}
        description={t('group.formDescription')}
      >
        <form className="modal-form" onSubmit={handleSubmit(submit)}>
          <FormSection
            title={t('group.formSection.coreTitle')}
            description={t('group.formSection.coreDescription')}
          >
            <Input
              label={t('group.field.name')}
              hint={t('group.field.nameHint')}
              placeholder={t('group.field.namePlaceholder')}
              error={resolveErrorMessage(errors.name?.message)}
              fieldClassName="ui-field--primary"
              {...register('name')}
            />
            <div className="detail-grid">
              <Select
                label={t('dashboard.table.course')}
                hint={t('group.field.courseHint')}
                error={resolveErrorMessage(errors.course?.message)}
                {...register('course')}
              >
                <option value="">{t('payments.selectCourse')}</option>
                {courses.map(course => (
                  <option key={course.id} value={course.id}>
                    {getCourseDisplayName(course)}
                  </option>
                ))}
              </Select>
              {teacherLocked ? (
                <>
                  <input type="hidden" {...register('teacher')} />
                  <Input
                    label={t('dashboard.table.teacher')}
                    hint={teacherHint || t('group.field.teacherHintLocked')}
                    error={existingTeacherNoLongerLinked ? t('group.field.teacherCourseMismatch') : resolveErrorMessage(errors.teacher?.message)}
                    value={teacherLabel || t('course.field.currentTeacher')}
                    readOnly
                  />
                </>
              ) : (
                <Select
                  label={t('dashboard.table.teacher')}
                  hint={teacherHint}
                  error={resolveErrorMessage(errors.teacher?.message)}
                  disabled={!hasSelectedCourse || !courseHasTeachers}
                  {...register('teacher')}
                >
                  <option value="">
                    {!hasSelectedCourse
                      ? t('group.selectCourseFirst')
                      : !courseHasTeachers
                        ? t('group.noCourseTeachers')
                        : t('group.selectTeacher')}
                  </option>
                  {courseTeacherOptions.map(teacher => (
                    <option key={teacher.id} value={teacher.id}>
                      {getUserDisplayName(teacher)}
                    </option>
                  ))}
                </Select>
              )}
            </div>
          </FormSection>
          <FormSection
            title={t('group.formSection.rosterTitle')}
            description={t('group.formSection.rosterDescription')}
          >
            <CheckboxGroup
              label={t('course.field.studentsLabel', { count: selectedStudents.length })}
              hint={t('group.field.studentsHint')}
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
              {isDirty ? t('common.changesReadyToSave') : group ? t('group.formHint.edit') : t('group.formHint.create')}
            </span>
            <div className="inline-actions">
              <Button type="submit" disabled={loading || !canSubmit || (!!group && !isDirty)}>
                {loading ? t('common.saving') : group ? t('common.saveChanges') : t('group.createGroup')}
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

function getId(value: string | AppUser | null | undefined) {
  if (!value) {
    return '';
  }

  return typeof value === 'string' ? value : value.id;
}

function uniqueIds(values: Array<string | AppUser | null | undefined>) {
  return [...new Set(values.map(getId).filter(Boolean))];
}

function getCourseTeacherIds(course: Course) {
  return uniqueIds([
    course.teacherId,
    ...(course.teacherIds ?? []),
    ...(course.teachers ?? []),
  ]);
}

function getCourseTeacherOptions(course: Course, allTeachers: AppUser[]) {
  const teacherIds = getCourseTeacherIds(course);
  const teachersById = new Map(allTeachers.map(teacher => [teacher.id, teacher]));

  for (const teacher of course.teachers ?? []) {
    teachersById.set(teacher.id, teacher);
  }

  if (course.teacherId && typeof course.teacherId !== 'string') {
    teachersById.set(course.teacherId.id, course.teacherId);
  }

  for (const teacher of course.teacherIds ?? []) {
    if (typeof teacher !== 'string') {
      teachersById.set(teacher.id, teacher);
    }
  }

  return teacherIds
    .map(id => teachersById.get(id))
    .filter((teacher): teacher is AppUser => !!teacher);
}
