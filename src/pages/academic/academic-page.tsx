import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { attendanceApi, AttendanceStatus } from '../../entities/attendance/api';
import { gradesApi, GradeEntry } from '../../entities/grade/api';
import { homeworkApi } from '../../entities/homework/api';
import { notificationsApi, NotificationType } from '../../entities/notification/api';
import { usersApi } from '../../entities/user/api';
import { scheduleApi } from '../../entities/schedule/api';
import { useAuthStore } from '../../features/auth/model/auth-store';
import { PageLayout } from '../../widgets/page/page-layout';
import { LoadingState } from '../../shared/ui/feedback/loading-state';
import { ErrorState } from '../../shared/ui/feedback/error-state';
import { Card } from '../../shared/ui/surfaces/card';
import { TableShell } from '../../shared/ui/data-display/table-shell';
import { DataTable } from '../../shared/ui/data-display/data-table';
import { Button } from '../../shared/ui/buttons/button';
import { Input } from '../../shared/ui/forms/input';
import { Select } from '../../shared/ui/forms/select';
import { Textarea } from '../../shared/ui/forms/textarea';
import { Badge } from '../../shared/ui/badges/badge';
import { ConfirmModal } from '../../shared/ui/overlay/confirm-modal';
import { getRoleCapabilities } from '../../shared/lib/capabilities';
import { formatDate, formatDateTime } from '../../shared/lib/date';
import { getCourseDisplayName, getUserDisplayName } from '../../shared/lib/entity-display';
import { toast } from '../../shared/ui/feedback/toaster';
import { useI18n } from '../../shared/i18n/i18n';

function toDateInputValue(value: Date | string) {
  return new Date(value).toISOString().slice(0, 10);
}

export function AcademicPage() {
  const user = useAuthStore(state => state.user);
  const capabilities = getRoleCapabilities(user?.role);
  const queryClient = useQueryClient();
  const [selectedUserId, setSelectedUserId] = useState('');
  const [attendanceStatus, setAttendanceStatus] = useState<AttendanceStatus>('present');
  const [attendanceDate, setAttendanceDate] = useState(() => toDateInputValue(new Date()));
  const [selectedScheduleId, setSelectedScheduleId] = useState('');
  const [gradeSubject, setGradeSubject] = useState('');
  const [gradeScore, setGradeScore] = useState(100);
  const [homeworkTasks, setHomeworkTasks] = useState('');
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationType, setNotificationType] = useState<NotificationType>('general');
  const [deleteGrade, setDeleteGrade] = useState<GradeEntry | null>(null);
  const { t } = useI18n();

  const canSelectUser = capabilities.academic.manageAttendance || capabilities.academic.manageGrades || capabilities.academic.manageHomework;
  const canLookupUserSchedule = user?.role === 'admin' || user?.role === 'owner' || user?.role === 'panda';
  const usersQuery = useQuery({
    queryKey: ['academic-users'],
    queryFn: () => usersApi.getStudents({ limit: 100, sortBy: 'username', sortOrder: 'asc' }),
    enabled: canSelectUser,
  });

  const effectiveUserId = canSelectUser ? selectedUserId : user?.id ?? '';
  const attendanceQuery = useQuery({
    queryKey: ['attendance', effectiveUserId, user?.role],
    queryFn: () => (canSelectUser ? attendanceApi.getByUser(effectiveUserId) : attendanceApi.getMine()),
    enabled: !!effectiveUserId,
  });
  const gradesQuery = useQuery({
    queryKey: ['grades', effectiveUserId, user?.role],
    queryFn: () => (canSelectUser ? gradesApi.getByUser(effectiveUserId) : gradesApi.getMine()),
    enabled: !!effectiveUserId,
  });
  const homeworkQuery = useQuery({
    queryKey: ['homework', effectiveUserId, user?.role],
    queryFn: () => (canSelectUser ? homeworkApi.getByUser(effectiveUserId) : homeworkApi.getMine()),
    enabled: !!effectiveUserId,
  });
  const scheduleQuery = useQuery({
    queryKey: ['schedule-user', effectiveUserId, user?.role],
    queryFn: () => (canLookupUserSchedule ? scheduleApi.getByUser(effectiveUserId) : scheduleApi.getMine()),
    enabled: !!effectiveUserId && (canLookupUserSchedule || user?.role === 'teacher'),
  });

  const selectedUser = useMemo(
    () => usersQuery.data?.find(item => item.id === effectiveUserId),
    [effectiveUserId, usersQuery.data],
  );

  const invalidate = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['attendance'] }),
      queryClient.invalidateQueries({ queryKey: ['grades'] }),
      queryClient.invalidateQueries({ queryKey: ['homework'] }),
    ]);
  };

  const markAttendance = useMutation({
    mutationFn: () => {
      const selectedSchedule = scheduleQuery.data?.find(item => item.id === selectedScheduleId);

      return attendanceApi.mark({
        userId: effectiveUserId,
        scheduleId: selectedScheduleId || undefined,
        date: selectedSchedule?.date ?? `${attendanceDate}T00:00:00.000Z`,
        status: attendanceStatus,
      });
    },
    onSuccess: async () => {
      await invalidate();
      toast.success(t('common.saved'));
    },
    onError: error => toast.error(error.message),
  });

  const createGrade = useMutation({
    mutationFn: () => gradesApi.create({ userId: effectiveUserId, subject: gradeSubject, score: gradeScore }),
    onSuccess: async () => {
      await invalidate();
      setGradeSubject('');
      toast.success(t('common.saved'));
    },
    onError: error => toast.error(error.message),
  });

  const removeGrade = useMutation({
    mutationFn: (id: string) => gradesApi.remove(id),
    onSuccess: async () => {
      await invalidate();
      setDeleteGrade(null);
      toast.success(t('common.deleted'));
    },
    onError: error => toast.error(error.message),
  });

  const createHomework = useMutation({
    mutationFn: () => homeworkApi.create({
      userId: effectiveUserId,
      date: new Date().toISOString(),
      tasks: homeworkTasks.split('\n').map(item => item.trim()).filter(Boolean),
    }),
    onSuccess: async () => {
      await invalidate();
      setHomeworkTasks('');
      toast.success(t('common.saved'));
    },
    onError: error => toast.error(error.message),
  });

  const completeHomework = useMutation({
    mutationFn: (id: string) => homeworkApi.complete(id),
    onSuccess: async () => {
      await invalidate();
      toast.success(t('common.updated'));
    },
    onError: error => toast.error(error.message),
  });

  const sendNotification = useMutation({
    mutationFn: () => notificationsApi.send({ userId: effectiveUserId, type: notificationType, message: notificationMessage }),
    onSuccess: () => {
      setNotificationMessage('');
      toast.success(t('common.saved'));
    },
    onError: error => toast.error(error.message),
  });

  if (usersQuery.isLoading && canSelectUser) {
    return <LoadingState label={t('common.loading')} />;
  }

  if (usersQuery.error) {
    return <ErrorState description={usersQuery.error.message} onRetry={() => void usersQuery.refetch()} />;
  }

  const attendance = attendanceQuery.data ?? [];
  const grades = gradesQuery.data ?? [];
  const homework = homeworkQuery.data ?? [];
  const schedules = (scheduleQuery.data ?? []).filter(item => {
    if (!effectiveUserId || canLookupUserSchedule) {
      return true;
    }

    return (item.students ?? []).some(student => (typeof student === 'string' ? student : student.id) === effectiveUserId);
  });

  return (
    <PageLayout
      eyebrow={t('academic.eyebrow')}
      title={t('academic.title')}
      description={t('academic.description')}
    >
      <Card>
        <div className="stack">
          <span className="eyebrow">{t('academic.scopeLabel')}</span>
          {canSelectUser ? (
            <Select
              value={effectiveUserId}
              onChange={event => {
                setSelectedUserId(event.target.value);
                setSelectedScheduleId('');
              }}
              label={t('academic.student')}
            >
              <option value="">{t('academic.selectStudent')}</option>
              {(usersQuery.data ?? []).map(item => (
                <option key={item.id} value={item.id}>{getUserDisplayName(item)}</option>
              ))}
            </Select>
          ) : (
            <strong>{getUserDisplayName(user)}</strong>
          )}
          <span className="subtle">{selectedUser ? selectedUser.username : user?.username}</span>
        </div>
      </Card>

      {capabilities.academic.manageAttendance ? (
        <Card>
          <div className="detail-grid">
            <Input
              label={t('academic.attendanceDate')}
              type="date"
              value={attendanceDate}
              onChange={event => {
                setAttendanceDate(event.target.value);
                setSelectedScheduleId('');
              }}
            />
            <Select
              label={t('academic.schedule')}
              value={selectedScheduleId}
              onChange={event => {
                const scheduleId = event.target.value;
                setSelectedScheduleId(scheduleId);
                const selectedSchedule = schedules.find(item => item.id === scheduleId);
                if (selectedSchedule?.date) {
                  setAttendanceDate(toDateInputValue(selectedSchedule.date));
                }
              }}
              hint={schedules.length > 0 ? t('academic.scheduleHint') : t('academic.scheduleLookupDescription')}
            >
              <option value="">Auto-detect by date</option>
              {schedules.map(item => (
                <option key={item.id} value={item.id}>
                  {formatDateTime(item.timeStart)} - {getCourseDisplayName(item.course)}
                </option>
              ))}
            </Select>
            <Select label={t('academic.attendanceStatus')} value={attendanceStatus} onChange={event => setAttendanceStatus(event.target.value as AttendanceStatus)}>
              <option value="present">{t('attendance.status.present')}</option>
              <option value="absent">{t('attendance.status.absent')}</option>
              <option value="late">{t('attendance.status.late')}</option>
              <option value="excused">{t('attendance.status.excused')}</option>
            </Select>
            <Button disabled={!effectiveUserId || !attendanceDate || markAttendance.isPending} onClick={() => markAttendance.mutate()}>
              {t('academic.markAttendance')}
            </Button>
          </div>
        </Card>
      ) : null}

      <TableShell title={t('academic.attendanceTitle')} description={t('academic.attendanceDescription')}>
        <DataTable
          rows={attendance}
          getRowKey={item => item.id}
          columns={[
            { key: 'date', header: t('common.date'), cell: item => formatDate(item.date) },
            { key: 'status', header: t('common.status'), cell: item => <Badge tone={item.status === 'present' ? 'success' : 'warning'}>{t(`attendance.status.${item.status}`)}</Badge> },
          ]}
        />
      </TableShell>

      {capabilities.academic.manageGrades ? (
        <Card>
          <div className="detail-grid">
            <Input label={t('academic.gradeSubject')} value={gradeSubject} onChange={event => setGradeSubject(event.target.value)} />
            <Input label={t('academic.gradeScore')} type="number" min={0} max={100} value={gradeScore} onChange={event => setGradeScore(Number(event.target.value))} />
            <Button disabled={!effectiveUserId || !gradeSubject || createGrade.isPending} onClick={() => createGrade.mutate()}>
              {t('academic.addGrade')}
            </Button>
          </div>
        </Card>
      ) : null}

      <TableShell title={t('academic.gradesTitle')} description={t('academic.gradesDescription')}>
        <DataTable
          rows={grades}
          getRowKey={item => item.id}
          columns={[
            { key: 'subject', header: t('common.subject'), cell: item => item.subject },
            { key: 'score', header: t('common.score'), cell: item => item.score },
            ...(capabilities.academic.manageGrades ? [{
              key: 'actions',
              header: t('common.actions'),
              cell: (item: GradeEntry) => (
                <div className="inline-actions">
                  <Button size="sm" variant="secondary" onClick={() => gradesApi.update(item.id, item.score).then(() => invalidate())}>Save</Button>
                  {capabilities.academic.deleteGrades ? (
                    <Button size="sm" variant="danger" onClick={() => setDeleteGrade(item)}>Delete</Button>
                  ) : null}
                </div>
              ),
            }] : []),
          ]}
        />
      </TableShell>

      {capabilities.academic.manageHomework ? (
        <Card>
          <Textarea label={t('academic.homeworkTasks')} value={homeworkTasks} onChange={event => setHomeworkTasks(event.target.value)} placeholder={t('academic.homeworkPlaceholder')} />
          <Button disabled={!effectiveUserId || !homeworkTasks.trim() || createHomework.isPending} onClick={() => createHomework.mutate()}>
            {t('academic.assignHomework')}
          </Button>
        </Card>
      ) : null}

      <TableShell title={t('academic.homeworkTitle')} description={t('academic.homeworkDescription')}>
        <DataTable
          rows={homework}
          getRowKey={item => item.id}
          columns={[
            { key: 'date', header: t('common.date'), cell: item => formatDate(item.date) },
            { key: 'tasks', header: t('common.tasks'), cell: item => item.tasks.join(', ') },
            { key: 'completed', header: t('common.status'), cell: item => <Badge tone={item.completed ? 'success' : 'warning'}>{item.completed ? t('common.complete') : t('common.open')}</Badge> },
            {
              key: 'actions',
              header: 'Actions',
              cell: item => item.completed || user?.role === 'student' ? null : <Button size="sm" variant="secondary" onClick={() => completeHomework.mutate(item.id)}>Complete</Button>,
            },
          ]}
        />
      </TableShell>

      {capabilities.academic.sendNotifications ? (
        <Card>
          <div className="detail-grid">
            <Select label={t('academic.notificationType')} value={notificationType} onChange={event => setNotificationType(event.target.value as NotificationType)}>
              <option value="general">{t('common.general')}</option>
              <option value="payment">{t('common.payment')}</option>
              <option value="homework">{t('common.homework')}</option>
              <option value="grades">{t('common.grades')}</option>
              <option value="attendance">{t('common.attendance')}</option>
            </Select>
            <Textarea label={t('academic.message')} value={notificationMessage} onChange={event => setNotificationMessage(event.target.value)} />
            <Button disabled={!effectiveUserId || !notificationMessage.trim() || sendNotification.isPending} onClick={() => sendNotification.mutate()}>
              Send notification
            </Button>
          </div>
        </Card>
      ) : null}

      {canLookupUserSchedule ? (
        <TableShell title={t('academic.scheduleLookupTitle')} description={t('academic.scheduleLookupDescription')}>
          <DataTable
            rows={schedules}
            getRowKey={item => item.id}
            columns={[
              { key: 'date', header: 'Date', cell: item => formatDate(item.date) },
              { key: 'time', header: 'Time', cell: item => `${formatDate(item.timeStart)} - ${formatDate(item.timeEnd)}` },
            ]}
          />
        </TableShell>
      ) : null}

      <ConfirmModal
        open={!!deleteGrade}
        title={t('academic.deleteGradeTitle')}
        description={deleteGrade ? `${deleteGrade.subject}: ${deleteGrade.score}` : ''}
        confirmLabel={t('academic.deleteGradeConfirm')}
        cancelLabel={t('common.cancel')}
        tone="danger"
        loading={removeGrade.isPending}
        onClose={() => setDeleteGrade(null)}
        onConfirm={async () => {
          if (deleteGrade) {
            await removeGrade.mutateAsync(deleteGrade.id);
          }
        }}
      />
    </PageLayout>
  );
}
