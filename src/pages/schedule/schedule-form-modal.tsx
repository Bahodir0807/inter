import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { ScheduleFormValues, ScheduleItem } from '../../entities/schedule/api';
import { Course } from '../../entities/course/api';
import { Group } from '../../entities/group/api';
import { Room } from '../../entities/room/api';
import { AppUser } from '../../shared/types/auth';
import { ModalShell } from '../../shared/ui/overlay/modal-shell';
import { ConfirmModal } from '../../shared/ui/overlay/confirm-modal';
import { Input } from '../../shared/ui/forms/input';
import { Select } from '../../shared/ui/forms/select';
import { CheckboxGroup } from '../../shared/ui/forms/checkbox-group';
import { Button } from '../../shared/ui/buttons/button';
import { getCourseDisplayName, getGroupDisplayName, getRoomDisplayName, getUserDisplayName } from '../../shared/lib/entity-display';
import { useUnsavedChangesGuard } from '../../shared/hooks/use-unsaved-changes-guard';

const schema = z.object({
  course: z.string().min(1, 'Select a course'),
  room: z.string().min(1, 'Select a room'),
  date: z.string().min(1, 'Choose the session date'),
  timeStart: z.string().min(1, 'Set the start time'),
  timeEnd: z.string().min(1, 'Set the end time'),
  teacher: z.string().min(1, 'Select a teacher'),
  students: z.array(z.string()),
  group: z.string().optional(),
});

type ScheduleFormInput = z.input<typeof schema>;
type ScheduleFormOutput = z.output<typeof schema>;

function toLocalDateTime(value?: string) {
  if (!value) {
    return '';
  }

  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function toIso(value: string) {
  return value ? new Date(value).toISOString() : value;
}

export function ScheduleFormModal({
  open,
  item,
  courses,
  rooms,
  groups,
  teachers,
  students,
  defaultTeacherId,
  loading,
  onClose,
  onSubmit,
}: {
  open: boolean;
  item?: ScheduleItem | null;
  courses: Course[];
  rooms: Room[];
  groups: Group[];
  teachers: AppUser[];
  students: AppUser[];
  defaultTeacherId?: string;
  loading: boolean;
  onClose: () => void;
  onSubmit: (values: ScheduleFormValues) => Promise<void>;
}) {
  const {
    register,
    watch,
    setValue,
    reset,
    handleSubmit,
    setFocus,
    formState: { errors, isDirty, isValid },
  } = useForm<ScheduleFormInput, unknown, ScheduleFormOutput>({
    resolver: zodResolver(schema),
    mode: 'onChange',
    defaultValues: {
      course: '',
      room: '',
      date: '',
      timeStart: '',
      timeEnd: '',
      teacher: '',
      students: [],
      group: '',
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
      course: typeof item?.course === 'string' ? item.course : item?.course?.id ?? '',
      room: typeof item?.room === 'string' ? item.room : item?.room?.id ?? '',
      date: toLocalDateTime(item?.date),
      timeStart: toLocalDateTime(item?.timeStart),
      timeEnd: toLocalDateTime(item?.timeEnd),
      teacher: typeof item?.teacher === 'string' ? item.teacher : item?.teacher?.id ?? defaultTeacherId ?? '',
      students: (item?.students ?? []).map(student => (typeof student === 'string' ? student : student.id)),
      group: typeof item?.group === 'string' ? item.group : item?.group?.id ?? '',
    });

    window.setTimeout(() => setFocus('course'), 0);
  }, [defaultTeacherId, item, open, reset, setFocus]);

  const selectedStudents = watch('students');

  return (
    <>
      <ModalShell
        open={open}
        onClose={closeGuard.requestClose}
        closeOnBackdrop={!loading}
        closeOnEscape={!loading}
        closeDisabled={loading}
        title={item ? 'Edit lesson' : 'Create lesson'}
        description="Plan the lesson, attach it to a room and group, and assign the relevant students."
      >
        <form
          className="stack"
          onSubmit={handleSubmit(async values =>
            onSubmit({
              ...values,
              date: toIso(values.date),
              timeStart: toIso(values.timeStart),
              timeEnd: toIso(values.timeEnd),
            }))}
        >
          <div className="detail-grid">
            <Select label="Course" error={errors.course?.message} {...register('course')}>
              <option value="">Select course</option>
              {courses.map(course => (
                <option key={course.id} value={course.id}>
                  {getCourseDisplayName(course)}
                </option>
              ))}
            </Select>
            <Select label="Room" error={errors.room?.message} {...register('room')}>
              <option value="">Select room</option>
              {rooms.map(room => (
                <option key={room.id} value={room.id}>
                  {getRoomDisplayName(room)}
                </option>
              ))}
            </Select>
            <Input label="Session date" type="datetime-local" error={errors.date?.message} {...register('date')} />
            <Input label="Start time" type="datetime-local" error={errors.timeStart?.message} {...register('timeStart')} />
            <Input label="End time" type="datetime-local" error={errors.timeEnd?.message} {...register('timeEnd')} />
            <Select label="Teacher" error={errors.teacher?.message} {...register('teacher')}>
              <option value="">Select teacher</option>
              {teachers.map(teacher => (
                <option key={teacher.id} value={teacher.id}>
                  {getUserDisplayName(teacher)}
                </option>
              ))}
            </Select>
            <Select label="Group" error={errors.group?.message} {...register('group')}>
              <option value="">No group linked</option>
              {groups.map(group => (
                <option key={group.id} value={group.id}>
                  {getGroupDisplayName(group)}
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
            <span className="subtle">{isDirty ? 'Unsaved changes' : item ? 'No changes yet' : 'Plan the core lesson details first'}</span>
            <div className="inline-actions">
              <Button type="submit" disabled={loading || !isValid || (!!item && !isDirty)}>
                {loading ? 'Saving...' : item ? 'Save changes' : 'Create lesson'}
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
