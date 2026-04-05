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

const schema = z.object({
  name: z.string().min(1, 'Enter a group name'),
  course: z.string().min(1, 'Select a course'),
  teacher: z.string().min(1, 'Select a teacher'),
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
  const {
    register,
    watch,
    setValue,
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
  const selectedTeacherId = watch('teacher');
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
        title={group ? 'Edit group' : 'Create group'}
        description="Configure the cohort, assign the teacher, and manage the student roster in one flow."
      >
        <form className="modal-form" onSubmit={handleSubmit(async values => onSubmit(values))}>
          <FormSection
            title="Core setup"
            description="Define the group identity first so operators immediately understand which cohort they are editing."
          >
            <Input
              label="Group name"
              hint="Use the phrasing your team already recognizes in schedules and attendance."
              placeholder="For example: Evening IELTS A1"
              error={errors.name?.message}
              fieldClassName="ui-field--primary"
              {...register('name')}
            />
            <div className="detail-grid">
              <Select
                label="Course"
                hint="Pre-filled when only one course is available."
                error={errors.course?.message}
                {...register('course')}
              >
                <option value="">Select course</option>
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
                    label="Teacher"
                    hint="This group stays assigned to your account."
                    value={teacherLabel || 'Current teacher'}
                    readOnly
                  />
                </>
              ) : (
                <Select
                  label="Teacher"
                  hint="Defaults to the current teacher context when available."
                  error={errors.teacher?.message}
                  {...register('teacher')}
                >
                  <option value="">Select teacher</option>
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
            title="Roster"
            description="Add students if the cohort is already formed. You can keep this empty and update it later."
          >
            <CheckboxGroup
              label={`Students${selectedStudents.length ? ` (${selectedStudents.length})` : ''}`}
              hint="Selected students become part of the group roster right away."
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
              {isDirty ? 'Changes are ready to save.' : group ? 'Adjust the cohort setup only where needed.' : 'Name the cohort first, then connect course and teacher.'}
            </span>
            <div className="inline-actions">
              <Button type="submit" disabled={loading || !isValid || (!!group && !isDirty)}>
                {loading ? 'Saving...' : group ? 'Save changes' : 'Create group'}
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
