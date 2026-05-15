import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { ScheduleFormValues, ScheduleItem, Weekday } from '../../entities/schedule/api';
import { Course } from '../../entities/course/api';
import { Group } from '../../entities/group/api';
import { Room } from '../../entities/room/api';
import { AppUser } from '../../shared/types/auth';
import { ModalShell } from '../../shared/ui/overlay/modal-shell';
import { ConfirmModal } from '../../shared/ui/overlay/confirm-modal';
import { Input } from '../../shared/ui/forms/input';
import { Select } from '../../shared/ui/forms/select';
import { CheckboxGroup } from '../../shared/ui/forms/checkbox-group';
import { FormSection } from '../../shared/ui/forms/form-section';
import { Button } from '../../shared/ui/buttons/button';
import { getCourseDisplayName, getGroupDisplayName, getRoomDisplayName, getUserDisplayName } from '../../shared/lib/entity-display';
import { useUnsavedChangesGuard } from '../../shared/hooks/use-unsaved-changes-guard';

const WEEKDAYS = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
] as const;

const schema = z.object({
  course: z.string().min(1, 'Select a course'),
  room: z.string().min(1, 'Select a room'),
  weekdays: z.array(z.enum(WEEKDAYS)).min(1, 'Select at least one weekday'),
  date: z.string().min(1, 'Choose a reference date'),
  timeStart: z.string().min(1, 'Set the start time'),
  timeEnd: z.string().min(1, 'Set the end time'),
  teacher: z.string().min(1, 'Select a teacher'),
  students: z.array(z.string()),
  group: z.string().optional(),
}).refine(data => data.timeStart < data.timeEnd, {
  path: ['timeEnd'],
  message: 'End time must come after start time',
});

type ScheduleFormInput = z.input<typeof schema>;
type ScheduleFormOutput = z.output<typeof schema>;

function toLocalTime(value?: string) {
  if (!value) {
    return '';
  }

  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(11, 16);
}

function getLocalDate(value?: string) {
  if (!value) {
    return '';
  }

  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
}

function getWeekdayFromDate(value?: string): Weekday {
  if (!value) {
    return WEEKDAYS[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1];
  }

  const date = new Date(value);
  const dayIndex = date.getDay();
  return WEEKDAYS[dayIndex === 0 ? 6 : dayIndex - 1];
}

function getUpcomingDateForWeekday(weekday: Weekday, from = new Date()) {
  const currentDayIndex = from.getDay() === 0 ? 6 : from.getDay() - 1;
  const targetDayIndex = WEEKDAYS.indexOf(weekday);
  const offsetDays = (targetDayIndex - currentDayIndex + 7) % 7;
  const next = new Date(from);
  next.setDate(from.getDate() + offsetDays);
  return next.toISOString().slice(0, 10);
}

function combineLocalDateAndTime(date: string, time: string) {
  const [year, month, day] = date.split('-').map(Number);
  const [hours, minutes] = time.split(':').map(Number);
  const combined = new Date(year, month - 1, day, hours, minutes);
  return combined.toISOString();
}

function getUpcomingLessonWindow() {
  const start = new Date();
  start.setMinutes(0, 0, 0);
  start.setHours(start.getHours() + 1);

  const end = new Date(start.getTime() + 60 * 60 * 1000);

  return {
    weekdays: [getWeekdayFromDate(start.toISOString())],
    date: start.toISOString().slice(0, 10),
    timeStart: start.toISOString().slice(11, 16),
    timeEnd: end.toISOString().slice(11, 16),
  };
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
  teacherLocked = false,
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
  teacherLocked?: boolean;
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
      weekdays: [],
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

  const preferredTeacherId = defaultTeacherId ?? (teachers.length === 1 ? teachers[0]?.id ?? '' : '');
  const preferredCourseId = courses.length === 1 ? courses[0]?.id ?? '' : '';
  const preferredRoomId = rooms.length === 1 ? rooms[0]?.id ?? '' : '';
  const preferredGroupId = groups.length === 1 ? groups[0]?.id ?? '' : '';

  useEffect(() => {
    if (!open) {
      return;
    }

    const newLessonWindow = getUpcomingLessonWindow();
    const itemWeekdays = Array.isArray((item as any)?.weekdays) && (item as any).weekdays.length > 0
      ? (item as any).weekdays as Weekday[]
      : item?.date
        ? [getWeekdayFromDate(item.date)]
        : newLessonWindow.weekdays;

    reset({
      course: typeof item?.course === 'string' ? item.course : item?.course?.id ?? preferredCourseId,
      room: typeof item?.room === 'string' ? item.room : item?.room?.id ?? preferredRoomId,
      weekdays: itemWeekdays,
      date: item?.date ? getLocalDate(item.date) : newLessonWindow.date,
      timeStart: toLocalTime(item?.timeStart) || newLessonWindow.timeStart,
      timeEnd: toLocalTime(item?.timeEnd) || newLessonWindow.timeEnd,
      teacher: typeof item?.teacher === 'string' ? item.teacher : item?.teacher?.id ?? preferredTeacherId,
      students: (item?.students ?? []).map(student => (typeof student === 'string' ? student : student.id)),
      group: typeof item?.group === 'string' ? item.group : item?.group?.id ?? preferredGroupId,
    });

    window.setTimeout(() => setFocus('course'), 0);
  }, [item, open, preferredCourseId, preferredGroupId, preferredRoomId, preferredTeacherId, reset, setFocus]);

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
        title={item ? 'Edit lesson' : 'Create lesson'}
        description="Plan the lesson, attach it to a room and group, and assign the relevant students."
      >
        <form
          className="modal-form"
          onSubmit={handleSubmit(async values => {
            const combinedStart = combineLocalDateAndTime(values.date, values.timeStart);
            const combinedEnd = combineLocalDateAndTime(values.date, values.timeEnd);
            await onSubmit({
              ...values,
              date: combinedStart,
              timeStart: combinedStart,
              timeEnd: combinedEnd,
            });
          })}
        >
          <FormSection
            title="Lesson details"
            description="Choose the learning context first. This defines what the lesson is, where it happens, and who owns it."
          >
            <div className="detail-grid">
              <Select
                label="Course"
                hint="Pre-filled when the lesson is being created from a single course context."
                error={errors.course?.message}
                fieldClassName="ui-field--primary"
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
                    hint="This lesson stays assigned to your account."
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
              <Select
                label="Room"
                hint="If only one room is available, it is selected automatically."
                error={errors.room?.message}
                {...register('room')}
              >
                <option value="">Select room</option>
                {rooms.map(room => (
                  <option key={room.id} value={room.id}>
                    {getRoomDisplayName(room)}
                  </option>
                ))}
              </Select>
              <Select
                label="Group"
                hint="Optional. Link a cohort when this lesson belongs to a group flow."
                error={errors.group?.message}
                fieldClassName="ui-field--quiet"
                {...register('group')}
              >
                <option value="">No group linked</option>
                {groups.map(group => (
                  <option key={group.id} value={group.id}>
                    {getGroupDisplayName(group)}
                  </option>
                ))}
              </Select>
            </div>
          </FormSection>
          <FormSection
            title="Timing"
            description="Pick the lesson time and the weekdays when the group meets."
          >
            <div className="detail-grid">
              <CheckboxGroup
                label="Weekdays"
                hint="Select the days of the week for this lesson. The first chosen day is used to build the schedule payload."
                options={WEEKDAYS.map(day => ({ value: day, label: day }))}
                values={watch('weekdays')}
                onChange={values => {
                  const weekdayValues = values as Weekday[];
                  setValue('weekdays', weekdayValues, { shouldDirty: true, shouldValidate: true });
                  if (weekdayValues.length > 0) {
                    setValue('date', getUpcomingDateForWeekday(weekdayValues[0]), { shouldDirty: true });
                  }
                }}
              />
              {errors.weekdays?.message ? <span className="ui-field__error">{errors.weekdays.message}</span> : null}
              <input type="hidden" {...register('date')} />
              <Input
                label="Starts at"
                hint="Choose the lesson start time in your local timezone."
                type="time"
                error={errors.timeStart?.message}
                {...register('timeStart')}
              />
              <Input
                label="Ends at"
                hint="Choose the lesson end time in your local timezone."
                type="time"
                error={errors.timeEnd?.message}
                {...register('timeEnd')}
              />
            </div>
          </FormSection>
          <FormSection
            title="Attendance"
            description="Select the students who should be attached to this lesson. Leave it empty if attendance will be added later."
          >
            <CheckboxGroup
              label={`Students${selectedStudents.length ? ` (${selectedStudents.length})` : ''}`}
              hint="Only selected students will appear as linked to this session."
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
              {isDirty ? 'Changes are ready to save.' : item ? 'Adjust only the lesson details that changed.' : 'Start with lesson context, then confirm time and attendance.'}
            </span>
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
