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
import { FormSection } from '../../shared/ui/forms/form-section';
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
        title={course ? 'Edit course' : 'Create course'}
        description="Set the offer details, assign the teacher, and manage enrolled students in one place."
      >
        <form className="modal-form" onSubmit={handleSubmit(async values => onSubmit(values))}>
          <FormSection
            title="Core details"
            description="Define the course offer first. This is the name and context people will see across tables, schedules, and payments."
          >
            <Input
              label="Course name"
              hint="Keep it clear enough to recognize in tables and dropdowns."
              placeholder="For example: IELTS Intensive"
              error={errors.name?.message}
              fieldClassName="ui-field--primary"
              {...register('name')}
            />
            <Textarea
              label="Description"
              hint="Useful for level, format, or a short teaching note."
              placeholder="For example: Evening group, upper-intermediate, 3 sessions per week"
              error={errors.description?.message}
              {...register('description')}
            />
          </FormSection>
          <FormSection
            title="Delivery"
            description="Set the commercial and ownership details so the course is ready to assign in operations."
          >
            <div className="detail-grid">
              <Input
                label="Price"
                hint="Enter the full amount as a number."
                type="number"
                placeholder="1200000"
                error={errors.price?.message}
                {...register('price')}
              />
              {teacherLocked ? (
                <>
                  <input type="hidden" {...register('teacherId')} />
                  <Input
                    label="Teacher"
                    hint="This course stays assigned to your account."
                    value={teacherLabel || 'Current teacher'}
                    readOnly
                  />
                </>
              ) : (
                <Select
                  label="Teacher"
                  hint="Pre-filled when only one teacher is available or a default owner is known."
                  error={errors.teacherId?.message}
                  {...register('teacherId')}
                >
                  <option value="">No teacher assigned</option>
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
            title="Enrollment"
            description="Add students now if the roster is already known, or leave this empty and return later."
          >
            <CheckboxGroup
              label={`Students${selectedStudents.length ? ` (${selectedStudents.length})` : ''}`}
              hint="Selected students will immediately appear as enrolled in the course."
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
              {isDirty ? 'Changes are ready to save.' : course ? 'Update pricing, ownership, or roster when needed.' : 'Start with the course identity, then add delivery details.'}
            </span>
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
