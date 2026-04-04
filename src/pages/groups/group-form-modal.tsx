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

  useEffect(() => {
    if (!open) {
      return;
    }

    reset({
      name: group?.name ?? '',
      course: typeof group?.course === 'string' ? group.course : group?.course?.id ?? '',
      teacher: typeof group?.teacher === 'string' ? group.teacher : group?.teacher?.id ?? defaultTeacherId ?? '',
      students: (group?.students ?? []).map(student => (typeof student === 'string' ? student : student.id)),
    });

    window.setTimeout(() => setFocus('name'), 0);
  }, [defaultTeacherId, group, open, reset, setFocus]);

  const selectedStudents = watch('students');

  return (
    <>
      <ModalShell
        open={open}
        onClose={closeGuard.requestClose}
        title={group ? 'Edit group' : 'Create group'}
        description="Configure the cohort, assign the teacher, and manage the student roster in one flow."
      >
        <form className="stack" onSubmit={handleSubmit(async values => onSubmit(values))}>
          <Input label="Group name" placeholder="For example: Evening IELTS A1" error={errors.name?.message} {...register('name')} />
          <div className="detail-grid">
            <Select label="Course" error={errors.course?.message} {...register('course')}>
              <option value="">Select course</option>
              {courses.map(course => (
                <option key={course.id} value={course.id}>
                  {getCourseDisplayName(course)}
                </option>
              ))}
            </Select>
            <Select label="Teacher" error={errors.teacher?.message} {...register('teacher')}>
              <option value="">Select teacher</option>
              {teachers.map(teacher => (
                <option key={teacher.id} value={teacher.id}>
                  {getUserDisplayName(teacher)}
                </option>
              ))}
            </Select>
          </div>
          <CheckboxGroup
            label={`Students${selectedStudents.length ? ` (${selectedStudents.length})` : ''}`}
            options={students.map(student => ({
              value: student.id,
              label: getUserDisplayName(student),
              description: student.phoneNumber || student.email,
            }))}
            values={selectedStudents}
            onChange={values => setValue('students', values, { shouldDirty: true })}
          />
          <div className="form-actions">
            <span className="subtle">{isDirty ? 'Unsaved changes' : group ? 'No changes yet' : 'Choose the course and teacher first'}</span>
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
        description="You have unsaved changes in this group form. Close it without saving?"
        confirmLabel="Discard changes"
        tone="danger"
        onConfirm={closeGuard.confirmDiscard}
        onClose={closeGuard.cancelDiscard}
      />
    </>
  );
}
