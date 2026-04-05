import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Course, CourseFormValues } from '../../entities/course/api';
import { AppUser } from '../../shared/types/auth';
import { ModalShell } from '../../shared/ui/overlay/modal-shell';
import { ConfirmModal } from '../../shared/ui/overlay/confirm-modal';
import { Input } from '../../shared/ui/forms/input';
import { Textarea } from '../../shared/ui/forms/textarea';
import { Select } from '../../shared/ui/forms/select';
import { CheckboxGroup } from '../../shared/ui/forms/checkbox-group';
import { Button } from '../../shared/ui/buttons/button';
import { getUserDisplayName } from '../../shared/lib/entity-display';
import { useUnsavedChangesGuard } from '../../shared/hooks/use-unsaved-changes-guard';

const schema = z.object({
  name: z.string().min(1, 'Enter a course name'),
  description: z.string().optional(),
  price: z.coerce.number().min(0, 'Price cannot be negative'),
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

  const closeGuard = useUnsavedChangesGuard({
    open,
    isDirty,
    onDiscard: onClose,
  });

  useEffect(() => {
    if (!open) {
      return;
    }

    const teacherId =
      typeof course?.teacherId === 'string'
        ? course.teacherId
        : course?.teacherId?.id ?? defaultTeacherId ?? '';
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
  }, [course, defaultTeacherId, open, reset, setFocus]);

  const selectedStudents = watch('students');

  return (
    <>
      <ModalShell
        open={open}
        onClose={closeGuard.requestClose}
        closeOnBackdrop={!loading}
        closeOnEscape={!loading}
        closeDisabled={loading}
        title={course ? 'Edit course' : 'Create course'}
        description="Set the offer details, assign the teacher, and manage enrolled students in one place."
      >
        <form className="stack" onSubmit={handleSubmit(async values => onSubmit(values))}>
          <Input label="Course name" placeholder="For example: IELTS Intensive" error={errors.name?.message} {...register('name')} />
          <Textarea
            label="Description"
            placeholder="Short description, level, or study format"
            error={errors.description?.message}
            {...register('description')}
          />
          <div className="detail-grid">
            <Input label="Price" type="number" placeholder="1200000" error={errors.price?.message} {...register('price')} />
            <Select label="Teacher" error={errors.teacherId?.message} {...register('teacherId')}>
              <option value="">No teacher assigned</option>
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
            <span className="subtle">{isDirty ? 'Unsaved changes' : course ? 'No changes yet' : 'Start with the core course details'}</span>
            <div className="inline-actions">
              <Button type="submit" disabled={loading || !isValid || (!!course && !isDirty)}>
                {loading ? 'Saving...' : course ? 'Save changes' : 'Create course'}
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
