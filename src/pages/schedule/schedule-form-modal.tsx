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
import { useI18n } from '../../shared/i18n/i18n';

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
  course: z.string().min(1, 'schedule.validation.selectCourse'),
  room: z.string().min(1, 'schedule.validation.selectRoom'),
  weekdays: z.array(z.enum(WEEKDAYS)).min(1, 'schedule.validation.selectWeekday'),
  date: z.string().min(1, 'schedule.validation.chooseDate'),
  timeStart: z.string().min(1, 'schedule.validation.setStartTime'),
  timeEnd: z.string().min(1, 'schedule.validation.setEndTime'),
  teacher: z.string().min(1, 'schedule.validation.selectTeacher'),
  students: z.array(z.string()),
  group: z.string().optional(),
}).refine(data => data.timeStart < data.timeEnd, {
  path: ['timeEnd'],
  message: 'schedule.validation.endsAtError',
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

const weekdayI18nKey: Record<string, string> = {
  Monday: 'weekday.monday',
  Tuesday: 'weekday.tuesday',
  Wednesday: 'weekday.wednesday',
  Thursday: 'weekday.thursday',
  Friday: 'weekday.friday',
  Saturday: 'weekday.saturday',
  Sunday: 'weekday.sunday',
};

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
  const { t } = useI18n();
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

  function resolveErrorMessage(key: string | undefined): string | undefined {
    if (!key) return undefined;
    return t(key);
  }

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
        title={item ? t('schedule.lessonEdit') : t('schedule.lessonCreate')}
        description={t('schedule.lessonDetailsDescription')}
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
            title={t('schedule.lessonDetails')}
            description={t('schedule.lessonDetailsDescription')}
          >
            <div className="detail-grid">
              <Select
                label={t('dashboard.table.course')}
                hint={t('schedule.courseHint')}
                error={resolveErrorMessage(errors.course?.message)}
                fieldClassName="ui-field--primary"
                {...register('course')}
              >
                <option value="">{t('schedule.selectCourse')}</option>
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
                    label={t('schedule.teacherLabel')}
                    hint={t('schedule.teacherHintLocked')}
                    value={teacherLabel || t('schedule.currentTeacher')}
                    readOnly
                  />
                </>
              ) : (
                <Select
                  label={t('schedule.teacherLabel')}
                  hint={t('schedule.teacherHint')}
                  error={resolveErrorMessage(errors.teacher?.message)}
                  {...register('teacher')}
                >
                  <option value="">{t('schedule.selectTeacher')}</option>
                  {teachers.map(teacher => (
                    <option key={teacher.id} value={teacher.id}>
                      {getUserDisplayName(teacher)}
                    </option>
                  ))}
                </Select>
              )}
              <Select
                label={t('rooms.room')}
                hint={t('schedule.roomHint')}
                error={resolveErrorMessage(errors.room?.message)}
                {...register('room')}
              >
                <option value="">{t('schedule.selectRoom')}</option>
                {rooms.map(room => (
                  <option key={room.id} value={room.id}>
                    {getRoomDisplayName(room)}
                  </option>
                ))}
              </Select>
              <Select
                label={t('dashboard.group')}
                hint={t('schedule.groupHint')}
                error={resolveErrorMessage(errors.group?.message)}
                fieldClassName="ui-field--quiet"
                {...register('group')}
              >
                <option value="">{t('schedule.noGroupLinkedOption')}</option>
                {groups.map(group => (
                  <option key={group.id} value={group.id}>
                    {getGroupDisplayName(group)}
                  </option>
                ))}
              </Select>
            </div>
          </FormSection>
          <FormSection
            title={t('schedule.timing')}
            description={t('schedule.timingDescription')}
          >
            <div className="detail-grid">
              <CheckboxGroup
                label={t('schedule.weekdays')}
                hint={t('schedule.weekdaysHint')}
                options={WEEKDAYS.map(day => ({ value: day, label: t(weekdayI18nKey[day]) }))}
                values={watch('weekdays')}
                onChange={values => {
                  const weekdayValues = values as Weekday[];
                  setValue('weekdays', weekdayValues, { shouldDirty: true, shouldValidate: true });
                  if (weekdayValues.length > 0) {
                    setValue('date', getUpcomingDateForWeekday(weekdayValues[0]), { shouldDirty: true });
                  }
                }}
              />
              {errors.weekdays?.message ? <span className="ui-field__error">{resolveErrorMessage(errors.weekdays.message)}</span> : null}
              <input type="hidden" {...register('date')} />
              <Input
                label={t('schedule.startsAt')}
                hint={t('schedule.startsAtHint')}
                type="time"
                error={resolveErrorMessage(errors.timeStart?.message)}
                {...register('timeStart')}
              />
              <Input
                label={t('schedule.endsAtLabel')}
                hint={t('schedule.endsAtHint')}
                type="time"
                error={resolveErrorMessage(errors.timeEnd?.message)}
                {...register('timeEnd')}
              />
            </div>
          </FormSection>
          <FormSection
            title={t('schedule.attendance')}
            description={t('schedule.attendanceDescription')}
          >
            <CheckboxGroup
              label={t('schedule.studentsLabel', { count: selectedStudents.length })}
              hint={t('schedule.studentsHint')}
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
              {isDirty ? t('schedule.formHint.dirty') : item ? t('schedule.formHint.edit') : t('schedule.formHint.create')}
            </span>
            <div className="inline-actions">
              <Button type="submit" disabled={loading || !isValid || (!!item && !isDirty)}>
                {loading ? t('common.saving') : item ? t('common.saveChanges') : t('schedule.lessonCreate')}
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
