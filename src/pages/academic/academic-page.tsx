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
      toast.success('Attendance marked');
    },
    onError: error => toast.error(error.message),
  });

  const createGrade = useMutation({
    mutationFn: () => gradesApi.create({ userId: effectiveUserId, subject: gradeSubject, score: gradeScore }),
    onSuccess: async () => {
      await invalidate();
      setGradeSubject('');
      toast.success('Grade saved');
    },
    onError: error => toast.error(error.message),
  });

  const removeGrade = useMutation({
    mutationFn: (id: string) => gradesApi.remove(id),
    onSuccess: async () => {
      await invalidate();
      setDeleteGrade(null);
      toast.success('Grade deleted');
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
      toast.success('Homework assigned');
    },
    onError: error => toast.error(error.message),
  });

  const completeHomework = useMutation({
    mutationFn: (id: string) => homeworkApi.complete(id),
    onSuccess: async () => {
      await invalidate();
      toast.success('Homework completed');
    },
    onError: error => toast.error(error.message),
  });

  const sendNotification = useMutation({
    mutationFn: () => notificationsApi.send({ userId: effectiveUserId, type: notificationType, message: notificationMessage }),
    onSuccess: () => {
      setNotificationMessage('');
      toast.success('Notification sent');
    },
    onError: error => toast.error(error.message),
  });

  if (usersQuery.isLoading && canSelectUser) {
    return <LoadingState label="Loading academic workspace..." />;
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
      eyebrow="Academic"
      title="Academic workspace"
      description="Attendance, grades, homework, and manual notifications connected to backend academic endpoints."
    >
      <Card>
        <div className="stack">
          <span className="eyebrow">Scope</span>
          {canSelectUser ? (
            <Select
              value={effectiveUserId}
              onChange={event => {
                setSelectedUserId(event.target.value);
                setSelectedScheduleId('');
              }}
              label="Student"
            >
              <option value="">Select student</option>
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
              label="Attendance date"
              type="date"
              value={attendanceDate}
              onChange={event => {
                setAttendanceDate(event.target.value);
                setSelectedScheduleId('');
              }}
            />
            <Select
              label="Schedule"
              value={selectedScheduleId}
              onChange={event => {
                const scheduleId = event.target.value;
                setSelectedScheduleId(scheduleId);
                const selectedSchedule = schedules.find(item => item.id === scheduleId);
                if (selectedSchedule?.date) {
                  setAttendanceDate(toDateInputValue(selectedSchedule.date));
                }
              }}
              hint={schedules.length > 0 ? 'Select a lesson to avoid ambiguous attendance records.' : 'No linked lessons found for this student/date scope.'}
            >
              <option value="">Auto-detect by date</option>
              {schedules.map(item => (
                <option key={item.id} value={item.id}>
                  {formatDateTime(item.timeStart)} - {getCourseDisplayName(item.course)}
                </option>
              ))}
            </Select>
            <Select label="Attendance status" value={attendanceStatus} onChange={event => setAttendanceStatus(event.target.value as AttendanceStatus)}>
              <option value="present">Present</option>
              <option value="absent">Absent</option>
              <option value="late">Late</option>
              <option value="excused">Excused</option>
            </Select>
            <Button disabled={!effectiveUserId || !attendanceDate || markAttendance.isPending} onClick={() => markAttendance.mutate()}>
              Mark attendance
            </Button>
          </div>
        </Card>
      ) : null}

      <TableShell title="Attendance" description="Student-only `/attendance/me` is used only for students; staff views use `/attendance/user/:userId`.">
        <DataTable
          rows={attendance}
          getRowKey={item => item.id}
          columns={[
            { key: 'date', header: 'Date', cell: item => formatDate(item.date) },
            { key: 'status', header: 'Status', cell: item => <Badge tone={item.status === 'present' ? 'success' : 'warning'}>{item.status}</Badge> },
          ]}
        />
      </TableShell>

      {capabilities.academic.manageGrades ? (
        <Card>
          <div className="detail-grid">
            <Input label="Subject" value={gradeSubject} onChange={event => setGradeSubject(event.target.value)} />
            <Input label="Score" type="number" min={0} max={100} value={gradeScore} onChange={event => setGradeScore(Number(event.target.value))} />
            <Button disabled={!effectiveUserId || !gradeSubject || createGrade.isPending} onClick={() => createGrade.mutate()}>
              Add grade
            </Button>
          </div>
        </Card>
      ) : null}

      <TableShell title="Grades" description="Create/update/delete actions are shown only to roles allowed by backend.">
        <DataTable
          rows={grades}
          getRowKey={item => item.id}
          columns={[
            { key: 'subject', header: 'Subject', cell: item => item.subject },
            { key: 'score', header: 'Score', cell: item => item.score },
            ...(capabilities.academic.manageGrades ? [{
              key: 'actions',
              header: 'Actions',
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
          <Textarea label="Homework tasks" value={homeworkTasks} onChange={event => setHomeworkTasks(event.target.value)} placeholder="One task per line" />
          <Button disabled={!effectiveUserId || !homeworkTasks.trim() || createHomework.isPending} onClick={() => createHomework.mutate()}>
            Assign homework
          </Button>
        </Card>
      ) : null}

      <TableShell title="Homework" description="Students can complete their own homework; staff can assign and complete records.">
        <DataTable
          rows={homework}
          getRowKey={item => item.id}
          columns={[
            { key: 'date', header: 'Date', cell: item => formatDate(item.date) },
            { key: 'tasks', header: 'Tasks', cell: item => item.tasks.join(', ') },
            { key: 'completed', header: 'Status', cell: item => <Badge tone={item.completed ? 'success' : 'warning'}>{item.completed ? 'Complete' : 'Open'}</Badge> },
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
            <Select label="Notification type" value={notificationType} onChange={event => setNotificationType(event.target.value as NotificationType)}>
              <option value="general">General</option>
              <option value="payment">Payment</option>
              <option value="homework">Homework</option>
              <option value="grades">Grades</option>
              <option value="attendance">Attendance</option>
            </Select>
            <Textarea label="Message" value={notificationMessage} onChange={event => setNotificationMessage(event.target.value)} />
            <Button disabled={!effectiveUserId || !notificationMessage.trim() || sendNotification.isPending} onClick={() => sendNotification.mutate()}>
              Send notification
            </Button>
          </div>
        </Card>
      ) : null}

      {canLookupUserSchedule ? (
        <TableShell title="User schedule lookup" description="Uses `/schedule/user/:id`, separate from student `/schedule/me`.">
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
        title="Delete grade?"
        description={deleteGrade ? `${deleteGrade.subject}: ${deleteGrade.score}` : ''}
        confirmLabel="Delete grade"
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
