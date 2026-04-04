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
import { Button } from '../../shared/ui/buttons/button';
import { getCourseDisplayName, getUserDisplayName } from '../../shared/lib/entity-display';
import { useUnsavedChangesGuard } from '../../shared/hooks/use-unsaved-changes-guard';

const schema = z.object({
  student: z.string().min(1, 'Select a student'),
  courseId: z.string().min(1, 'Select a course'),
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
      paidAt: '',
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
      student: '',
      courseId: '',
      paidAt: toLocalDateTime(new Date().toISOString()),
    });

    window.setTimeout(() => setFocus('student'), 0);
  }, [open, reset, setFocus]);

  return (
    <>
      <ModalShell
        open={open}
        onClose={closeGuard.requestClose}
        title="Create payment"
        description="Link the payment to a student and course so the record is immediately traceable."
      >
        <form
          className="stack"
          onSubmit={handleSubmit(async values =>
            onSubmit({
              ...values,
              paidAt: values.paidAt ? new Date(values.paidAt).toISOString() : undefined,
            }))}
        >
          <Select label="Student" error={errors.student?.message} {...register('student')}>
            <option value="">Select student</option>
            {students.map(student => (
              <option key={student.id} value={student.id}>
                {getUserDisplayName(student)}
              </option>
            ))}
          </Select>
          <Select label="Course" error={errors.courseId?.message} {...register('courseId')}>
            <option value="">Select course</option>
            {courses.map(course => (
              <option key={course.id} value={course.id}>
                {getCourseDisplayName(course)}
              </option>
            ))}
          </Select>
          <Input label="Paid at" type="datetime-local" error={errors.paidAt?.message} {...register('paidAt')} />
          <div className="form-actions">
            <span className="subtle">{isDirty ? 'Unsaved changes' : 'Choose a student and course first'}</span>
            <div className="inline-actions">
              <Button type="submit" disabled={loading || !isValid}>
                {loading ? 'Saving...' : 'Create payment'}
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
        description="You have unsaved changes in this payment form. Close it without saving?"
        confirmLabel="Discard changes"
        tone="danger"
        onConfirm={closeGuard.confirmDiscard}
        onClose={closeGuard.cancelDiscard}
      />
    </>
  );
}
