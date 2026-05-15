import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { attendanceApi } from '../../entities/attendance/api';
import { Course, coursesApi } from '../../entities/course/api';
import { gradesApi } from '../../entities/grade/api';
import { Group, groupsApi } from '../../entities/group/api';
import { Payment, paymentsApi } from '../../entities/payment/api';
import { roomsApi } from '../../entities/room/api';
import { ScheduleItem, scheduleApi } from '../../entities/schedule/api';
import { usersApi } from '../../entities/user/api';
import { paymentsManagerRoles } from '../../app/router/navigation';
import { useAuthStore } from '../../features/auth/model/auth-store';
import { EmptyState } from '../../shared/ui/feedback/empty-state';
import { ErrorState } from '../../shared/ui/feedback/error-state';
import { LoadingState } from '../../shared/ui/feedback/loading-state';
import { Card } from '../../shared/ui/surfaces/card';
import { PageLayout } from '../../widgets/page/page-layout';
import { Badge } from '../../shared/ui/badges/badge';
import { formatDate, formatDateTime, formatMoney } from '../../shared/lib/date';
import {
  getCourseDisplayName,
  getGroupDisplayName,
  getRoomDisplayName,
  getUserDisplayName,
  getUserListSummary,
} from '../../shared/lib/entity-display';
import { cn } from '../../shared/lib/cn';
import { useI18n } from '../../shared/i18n/i18n';
import { AppIcon, AppIconName } from '../../shared/ui/icons/app-icon';

function MetricCard({
  label,
  value,
  hint,
  tone = 'default',
  className,
}: {
  label: string;
  value: string | number;
  hint: string;
  tone?: 'default' | 'hero' | 'accent' | 'warning' | 'quiet';
  className?: string;
}) {
  return (
    <Card className={cn('metric-card', `metric-card--${tone}`, className)}>
      <span className="subtle">{label}</span>
      <strong>{value}</strong>
      <span className="subtle">{hint}</span>
    </Card>
  );
}

function PanelHeader({ eyebrow, title, action }: { eyebrow?: string; title: string; action?: ReactNode }) {
  return (
    <div className="ops-panel__header">
      <div className="stack">
        {eyebrow ? <span className="eyebrow">{eyebrow}</span> : null}
        <h3>{title}</h3>
      </div>
      {action}
    </div>
  );
}

function OpsPanel({
  eyebrow,
  title,
  children,
  className,
  action,
}: {
  eyebrow?: string;
  title: string;
  children: ReactNode;
  className?: string;
  action?: ReactNode;
}) {
  return (
    <Card className={cn('ops-panel', className)}>
      <PanelHeader eyebrow={eyebrow} title={title} action={action} />
      {children}
    </Card>
  );
}

function CompactEmpty({ title, description }: { title: string; description: string }) {
  return (
    <div className="compact-empty">
      <strong>{title}</strong>
      <span>{description}</span>
    </div>
  );
}

function ListItem({
  title,
  meta,
  detail,
  badge,
  tone,
}: {
  title: string;
  meta?: string;
  detail?: string;
  badge?: string;
  tone?: 'success' | 'warning' | 'danger' | 'info' | 'neutral';
}) {
  return (
    <li className="ops-list__item">
      <div className="cell-stack">
        <span className="cell-title">{title}</span>
        {meta ? <span className="cell-meta">{meta}</span> : null}
        {detail ? <span className="cell-meta">{detail}</span> : null}
      </div>
      {badge ? <Badge tone={tone ?? 'neutral'}>{badge}</Badge> : null}
    </li>
  );
}

function QuickAction({ to, icon, label, meta }: { to: string; icon: AppIconName; label: string; meta: string }) {
  return (
    <Link className="quick-action" to={to}>
      <span className="quick-action__icon">
        <AppIcon name={icon} />
      </span>
      <span>
        <strong>{label}</strong>
        <small>{meta}</small>
      </span>
      <AppIcon name="chevron-right" />
    </Link>
  );
}

const byStartTime = (a: ScheduleItem, b: ScheduleItem) =>
  new Date(a.timeStart || a.date).getTime() - new Date(b.timeStart || b.date).getTime();

const byPaymentTime = (a: Payment, b: Payment) =>
  new Date(b.paidAt || b.updatedAt || b.createdAt || 0).getTime() - new Date(a.paidAt || a.updatedAt || a.createdAt || 0).getTime();

function isToday(value?: string | null) {
  if (!value) {
    return false;
  }

  const date = new Date(value);
  const today = new Date();
  return date.toDateString() === today.toDateString();
}

function getCourseTeacherName(course?: Course | string | null) {
  if (!course || typeof course === 'string') {
    return '-';
  }

  return getUserDisplayName(course.teacherId);
}

function renderLessons(items: ScheduleItem[], emptyTitle: string, emptyDescription: string, todayLabel: string) {
  if (items.length === 0) {
    return <CompactEmpty title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <ul className="ops-list">
      {items.map(item => (
        <ListItem
          key={item.id}
          title={getCourseDisplayName(item.course)}
          meta={`${formatDateTime(item.timeStart)} - ${getRoomDisplayName(item.room)}`}
          detail={`${getUserDisplayName(item.teacher)} · ${getGroupDisplayName(item.group)}`}
          badge={isToday(item.timeStart) ? todayLabel : formatDate(item.timeStart)}
          tone={isToday(item.timeStart) ? 'info' : 'neutral'}
        />
      ))}
    </ul>
  );
}

function renderPayments(
  items: Payment[],
  emptyTitle: string,
  emptyDescription: string,
  labels: { noPaymentDate: string; pending: string; confirmed: string; cancelled: string },
) {
  if (items.length === 0) {
    return <CompactEmpty title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <ul className="ops-list">
      {items.map(item => (
        <ListItem
          key={item.id}
          title={getUserDisplayName(item.student)}
          meta={`${getCourseDisplayName(item.course ?? item.courseId)} · ${formatMoney(item.amount)}`}
          detail={item.paidAt ? formatDateTime(item.paidAt) : labels.noPaymentDate}
          badge={labels[item.status]}
          tone={item.status === 'confirmed' ? 'success' : item.status === 'pending' ? 'warning' : 'danger'}
        />
      ))}
    </ul>
  );
}

export function DashboardPage() {
  const user = useAuthStore(state => state.user);
  const { t } = useI18n();
  const paymentLabels = {
    noPaymentDate: t('dashboard.noPaymentDate'),
    pending: t('paymentStatus.pending'),
    confirmed: t('paymentStatus.confirmed'),
    cancelled: t('paymentStatus.cancelled'),
  };
  const isOwnerAdmin = !!user && paymentsManagerRoles.includes(user.role);
  const isPanda = user?.role === 'panda';
  const isStudent = user?.role === 'student';
  const isTeacher = user?.role === 'teacher';

  const ownerAdminQuery = useQuery({
    queryKey: ['dashboard', 'owner-admin'],
    queryFn: async () => {
      const [users, courses, groups, schedule, rooms, payments] = await Promise.all([
        usersApi.getAll(),
        coursesApi.getAll(),
        groupsApi.getAll(),
        scheduleApi.getAll(),
        roomsApi.getAll(),
        paymentsApi.getAll(),
      ]);

      return { users, courses, groups, schedule, rooms, payments };
    },
    enabled: isOwnerAdmin,
  });

  const pandaQuery = useQuery({
    queryKey: ['dashboard', 'panda'],
    queryFn: async () => {
      const users = await usersApi.getAll();
      return { users };
    },
    enabled: isPanda,
  });

  const learnerQuery = useQuery({
    queryKey: ['dashboard', 'learner', user?.role, user?.id],
    queryFn: async () => {
      const schedule = await scheduleApi.getMine();
      const teacherGroups = isTeacher && user ? await groupsApi.getAll({ teacherId: user.id }) : [];
      const [grades, attendance, payments] = isStudent
        ? await Promise.all([
            gradesApi.getMine(),
            attendanceApi.getMine(),
            paymentsApi.getMine(),
          ])
        : [[], [], []];

      return { schedule, teacherGroups, grades, attendance, payments };
    },
    enabled: !!user && !isOwnerAdmin && !isPanda,
  });

  const activeQuery = isOwnerAdmin ? ownerAdminQuery : isPanda ? pandaQuery : learnerQuery;

  if (activeQuery.isLoading) {
    return <LoadingState label={t('common.loading')} />;
  }

  if (activeQuery.error) {
    return <ErrorState description={activeQuery.error.message} onRetry={() => void activeQuery.refetch()} />;
  }

  if (!activeQuery.data) {
    return <EmptyState title={t('dashboard.noDataTitle')} description={t('dashboard.noDataDescription')} />;
  }

  if (isOwnerAdmin) {
    const data = activeQuery.data as {
      users: Awaited<ReturnType<typeof usersApi.getAll>>;
      courses: Awaited<ReturnType<typeof coursesApi.getAll>>;
      groups: Awaited<ReturnType<typeof groupsApi.getAll>>;
      schedule: Awaited<ReturnType<typeof scheduleApi.getAll>>;
      rooms: Awaited<ReturnType<typeof roomsApi.getAll>>;
      payments: Awaited<ReturnType<typeof paymentsApi.getAll>>;
    };
    const todayLessons = data.schedule.filter(item => isToday(item.timeStart || item.date)).sort(byStartTime);
    const upcomingLessons = data.schedule
      .filter(item => new Date(item.timeStart || item.date).getTime() >= Date.now() - 60 * 60 * 1000)
      .sort(byStartTime)
      .slice(0, 6);
    const pendingPayments = data.payments.filter(item => item.status === 'pending').sort(byPaymentTime);
    const recentPayments = [...data.payments].sort(byPaymentTime).slice(0, 5);
    const activeGroups = data.groups.filter(item => item.students.length > 0);
    const teachers = data.users.filter(item => item.role === 'teacher');
    const teacherWorkload = teachers
      .map(teacher => ({
        teacher,
        groups: data.groups.filter(group => typeof group.teacher !== 'string' && group.teacher.id === teacher.id).length,
        lessons: data.schedule.filter(lesson => typeof lesson.teacher !== 'string' && lesson.teacher.id === teacher.id).length,
      }))
      .sort((a, b) => b.lessons - a.lessons)
      .slice(0, 5);
    const academicAlerts = [
      ...data.courses.filter(course => !course.teacherId).map(course => t('dashboard.alert.noTeacher', { name: course.name })),
      ...data.groups.filter(group => group.students.length === 0).map(group => t('dashboard.alert.emptyRoster', { name: group.name })),
      ...pendingPayments.slice(0, 4).map(payment => t('dashboard.alert.paymentPending', { name: getUserDisplayName(payment.student) })),
      ...data.users.filter(item => !item.isActive).slice(0, 3).map(item => t('dashboard.alert.inactiveAccount', { name: getUserDisplayName(item) })),
    ].slice(0, 7);

    return (
      <PageLayout
        eyebrow={t('dashboard.overview')}
        title={t('dashboard.title')}
        description={t('dashboard.description')}
        variant="feature"
      >
        <div className="dashboard-grid dashboard-grid--overview">
          <MetricCard tone="hero" label={t('dashboard.needsAttention')} value={pendingPayments.length + academicAlerts.length} hint={t('dashboard.openPaymentAcademicItems')} />
          <MetricCard label={t('dashboard.metric.lessons')} value={todayLessons.length} hint={t('dashboard.scheduledForToday')} />
          <MetricCard label={t('dashboard.metric.groups')} value={activeGroups.length} hint={t('dashboard.metric.activeGroups')} />
          <MetricCard tone="accent" label={t('dashboard.metric.payments')} value={formatMoney(data.payments.reduce((sum, item) => sum + item.amount, 0))} hint={t('dashboard.pendingCount', { count: pendingPayments.length })} />
        </div>

        <div className="ops-layout">
          <OpsPanel className="ops-panel--primary" eyebrow={t('dashboard.today')} title={t('dashboard.attentionQueue')}>
            <div className="attention-strip">
              <div><strong>{todayLessons.length}</strong><span>{t('dashboard.lessonsToday')}</span></div>
              <div><strong>{pendingPayments.length}</strong><span>{t('dashboard.pendingPayments')}</span></div>
              <div><strong>{data.groups.filter(group => group.students.length === 0).length}</strong><span>{t('dashboard.emptyGroups')}</span></div>
              <div><strong>{data.courses.filter(course => !course.teacherId).length}</strong><span>{t('dashboard.coursesWithoutTeacher')}</span></div>
            </div>
          </OpsPanel>

          <OpsPanel title={t('dashboard.quickActions')}>
            <div className="quick-actions">
              <QuickAction to="/app/schedule" icon="schedule" label={t('dashboard.action.planLessons')} meta={t('dashboard.action.openSchedule')} />
              <QuickAction to="/app/payments" icon="payments" label={t('dashboard.action.reviewPayments')} meta={t('dashboard.action.confirmPendingRecords')} />
              <QuickAction to="/app/groups" icon="groups" label={t('dashboard.action.checkGroups')} meta={t('dashboard.action.rostersAndTeachers')} />
              <QuickAction to="/app/academic" icon="courses" label={t('dashboard.action.academicFollowUp')} meta={t('dashboard.academicMetaNoHomework', 'Attendance and grades')} />
            </div>
          </OpsPanel>

          <OpsPanel title={t('dashboard.upcomingLessons')}>
            {renderLessons(upcomingLessons, t('dashboard.noUpcomingLessons'), t('dashboard.scheduledLessonsAppear'), t('dashboard.today'))}
          </OpsPanel>

          <OpsPanel title={t('dashboard.pendingPaymentsTitle')}>
            {renderPayments(pendingPayments.slice(0, 5), t('dashboard.noPendingPayments'), t('dashboard.problemPaymentsAppear'), paymentLabels)}
          </OpsPanel>

          <OpsPanel title={t('dashboard.recentPayments')}>
            {renderPayments(recentPayments, t('dashboard.noPaymentsYet'), t('dashboard.recentPaymentActivity'), paymentLabels)}
          </OpsPanel>

          <OpsPanel title={t('dashboard.activeGroups')}>
            {activeGroups.length === 0 ? (
              <CompactEmpty title={t('dashboard.noActiveGroups')} description={t('dashboard.groupsWithStudentsAppear')} />
            ) : (
              <ul className="ops-list">
                {activeGroups.slice(0, 5).map(group => (
                  <ListItem
                    key={group.id}
                    title={group.name}
                    meta={`${getCourseDisplayName(group.course)} · ${getUserDisplayName(group.teacher)}`}
                    detail={getUserListSummary(group.students, 3)}
                    badge={t('dashboard.studentsCount', { count: group.students.length })}
                    tone="info"
                  />
                ))}
              </ul>
            )}
          </OpsPanel>

          <OpsPanel title={t('dashboard.teacherWorkload')}>
            {teacherWorkload.length === 0 ? (
              <CompactEmpty title={t('dashboard.noTeachersYet')} description={t('dashboard.teacherWorkloadAppears')} />
            ) : (
              <ul className="workload-list">
                {teacherWorkload.map(item => (
                  <li key={item.teacher.id}>
                    <div className="cell-stack">
                      <span className="cell-title">{getUserDisplayName(item.teacher)}</span>
                      <span className="cell-meta">{t('dashboard.workloadSummary', { groups: item.groups, lessons: item.lessons })}</span>
                    </div>
                    <div className="workload-meter"><span style={{ width: `${Math.min(100, item.lessons * 12)}%` }} /></div>
                  </li>
                ))}
              </ul>
            )}
          </OpsPanel>

          <OpsPanel title={t('dashboard.academicAlerts')}>
            {academicAlerts.length === 0 ? (
              <CompactEmpty title={t('dashboard.noAlerts')} description={t('dashboard.noAlertsDescription')} />
            ) : (
              <ul className="ops-list">
                {academicAlerts.map(alert => (
                  <ListItem key={alert} title={alert} badge={t('dashboard.check')} tone="warning" />
                ))}
              </ul>
            )}
          </OpsPanel>
        </div>
      </PageLayout>
    );
  }

  if (isPanda) {
    const data = activeQuery.data as { users: Awaited<ReturnType<typeof usersApi.getAll>> };
    const students = data.users.filter(item => item.role === 'student');
    const inactive = data.users.filter(item => !item.isActive);

    return (
      <PageLayout eyebrow={t('dashboard.pandaHeadline')} title={t('dashboard.title')} description={t('dashboard.pandaDescription')} variant="feature">
        <div className="dashboard-grid">
          <MetricCard tone="hero" label={t('dashboard.metric.people')} value={data.users.length} hint={t('dashboard.metric.visibleUsers')} />
          <MetricCard tone="accent" label={t('dashboard.metric.students')} value={students.length} hint={t('dashboard.metric.studentAccounts')} />
          <MetricCard tone="warning" label={t('dashboard.attention')} value={inactive.length} hint={t('dashboard.inactiveVisibleAccounts')} />
        </div>
        <div className="ops-layout ops-layout--two">
          <OpsPanel title={t('dashboard.scopeTitle')}>
            <p className="subtle">{t('dashboard.scopeCopy')}</p>
          </OpsPanel>
          <OpsPanel title={t('dashboard.visibleStudents')}>
            {students.length === 0 ? (
              <CompactEmpty title={t('dashboard.noStudents')} description={t('dashboard.studentAccountsAppear')} />
            ) : (
              <ul className="ops-list">
                {students.slice(0, 6).map(student => (
                  <ListItem key={student.id} title={getUserDisplayName(student)} meta={student.phoneNumber || student.email || student.username} badge={student.isActive ? t('common.active') : t('common.inactive')} tone={student.isActive ? 'success' : 'warning'} />
                ))}
              </ul>
            )}
          </OpsPanel>
        </div>
      </PageLayout>
    );
  }

  const data = activeQuery.data as {
    schedule: Awaited<ReturnType<typeof scheduleApi.getMine>>;
    teacherGroups: Group[];
    grades: Awaited<ReturnType<typeof gradesApi.getMine>>;
    attendance: Awaited<ReturnType<typeof attendanceApi.getMine>>;
    payments: Awaited<ReturnType<typeof paymentsApi.getMine>>;
  };
  const upcomingLessons = data.schedule
    .filter(item => new Date(item.timeStart || item.date).getTime() >= Date.now() - 60 * 60 * 1000)
    .sort(byStartTime);
  const todayLessons = upcomingLessons.filter(item => isToday(item.timeStart || item.date));
  const nextLesson = upcomingLessons[0];
  const latestGrade = [...data.grades].sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime())[0];
  const pendingStudentPayments = data.payments.filter(item => item.status === 'pending');
  const attendanceSummary = data.attendance[0]?.status ?? t('dashboard.noRecordsYet');

  if (isTeacher) {
    return (
      <PageLayout eyebrow={t('dashboard.teacherWorkspace')} title={t('dashboard.title')} description={t('dashboard.teacherDescription')} variant="feature">
        <div className="dashboard-grid">
          <MetricCard tone="hero" label={t('dashboard.todayLessons')} value={todayLessons.length} hint={t('dashboard.lessonsRequiringAttendance')} />
          <MetricCard label={t('dashboard.ownGroups')} value={data.teacherGroups.length} hint={t('dashboard.teacherScopedRosters')} />
          <MetricCard tone="accent" label={t('dashboard.students')} value={data.teacherGroups.reduce((sum, group) => sum + group.students.length, 0)} hint={t('dashboard.acrossOwnGroups')} />
          <MetricCard tone="quiet" label={t('dashboard.upcoming')} value={upcomingLessons.length} hint={t('dashboard.visibleScheduleItems')} />
        </div>
        <div className="ops-layout ops-layout--teacher">
          <OpsPanel className="ops-panel--primary" eyebrow={t('dashboard.today')} title={t('dashboard.todayLessons')}>
            {renderLessons(todayLessons, t('dashboard.noLessonsToday'), t('dashboard.teacherTodayLessonsAppear'), t('dashboard.today'))}
          </OpsPanel>
          <OpsPanel title={t('dashboard.academicShortcuts')}>
            <div className="quick-actions">
              <QuickAction to="/app/academic" icon="courses" label={t('dashboard.action.markAttendance')} meta={t('dashboard.action.openAttendanceWorkspace')} />
              <QuickAction to="/app/academic" icon="courses" label={t('dashboard.action.recordGrades')} meta={t('dashboard.action.updateProgress')} />
              <QuickAction to="/app/schedule" icon="schedule" label={t('dashboard.action.openSchedule')} meta={t('dashboard.action.reviewLessonPlan')} />
            </div>
          </OpsPanel>
          <OpsPanel title={t('dashboard.ownGroups')}>
            {data.teacherGroups.length === 0 ? (
              <CompactEmpty title={t('dashboard.noGroupsAssigned')} description={t('dashboard.assignedGroupsAppear')} />
            ) : (
              <ul className="ops-list">
                {data.teacherGroups.slice(0, 6).map(group => (
                  <ListItem key={group.id} title={group.name} meta={getCourseDisplayName(group.course)} detail={getUserListSummary(group.students, 3)} badge={t('dashboard.studentsCount', { count: group.students.length })} tone="info" />
                ))}
              </ul>
            )}
          </OpsPanel>
          <OpsPanel title={t('dashboard.upcomingLessons')}>
            {renderLessons(upcomingLessons.slice(0, 5), t('dashboard.noUpcomingLessons'), t('dashboard.futureLessonsAppear'), t('dashboard.today'))}
          </OpsPanel>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout eyebrow={t('dashboard.myWorkspace')} title={t('dashboard.title')} description={t('dashboard.myDescription')} variant="feature">
      <div className="dashboard-grid">
        <MetricCard tone="hero" label={t('dashboard.nextLesson')} value={nextLesson ? formatDate(nextLesson.timeStart) : '-'} hint={nextLesson ? getCourseDisplayName(nextLesson.course) : t('dashboard.noScheduledLesson')} />
        <MetricCard label={t('dashboard.metric.grades')} value={latestGrade ? latestGrade.score : data.grades.length} hint={latestGrade ? latestGrade.subject : t('dashboard.metric.recordedGrades')} />
        <MetricCard tone={pendingStudentPayments.length > 0 ? 'warning' : 'accent'} label={t('dashboard.metric.payments')} value={pendingStudentPayments.length} hint={t('dashboard.pendingPaymentRecords')} />
      </div>
      <div className="ops-layout ops-layout--student">
        <OpsPanel className="ops-panel--primary" title={t('dashboard.nextLesson')}>
          {nextLesson ? (
            <ul className="ops-list">
              <ListItem
                title={getCourseDisplayName(nextLesson.course)}
                meta={`${formatDateTime(nextLesson.timeStart)} - ${getRoomDisplayName(nextLesson.room)}`}
                detail={`${getUserDisplayName(nextLesson.teacher)} · ${getGroupDisplayName(nextLesson.group)}`}
                badge={t('dashboard.upcoming')}
                tone="info"
              />
            </ul>
          ) : (
            <CompactEmpty title={t('dashboard.noNextLesson')} description={t('dashboard.nextLessonAppear')} />
          )}
        </OpsPanel>
        <OpsPanel title={t('dashboard.metric.grades')}>
          {data.grades.length === 0 ? (
            <CompactEmpty title={t('dashboard.noGrades')} description={t('dashboard.recordedGradesAppear')} />
          ) : (
            <ul className="ops-list">
              {data.grades.slice(0, 5).map(item => (
                <ListItem key={item.id} title={item.subject} meta={item.date ? formatDate(item.date) : undefined} badge={`${item.score}`} tone="success" />
              ))}
            </ul>
          )}
        </OpsPanel>
        <OpsPanel title={t('dashboard.paymentStatus')}>
          {renderPayments(data.payments.slice(0, 5), t('dashboard.noPayments'), t('dashboard.paymentRecordsAppear'), paymentLabels)}
        </OpsPanel>
        <OpsPanel title={t('dashboard.teacherAndGroup')}>
          <div className="student-context">
            <div><span>{t('dashboard.teacher')}</span><strong>{getUserDisplayName(nextLesson?.teacher)}</strong></div>
            <div><span>{t('dashboard.group')}</span><strong>{getGroupDisplayName(nextLesson?.group)}</strong></div>
            <div><span>{t('dashboard.courseTeacher')}</span><strong>{getCourseTeacherName(nextLesson?.course)}</strong></div>
            <div><span>{t('dashboard.metric.attendance')}</span><strong>{attendanceSummary}</strong></div>
          </div>
        </OpsPanel>
        <OpsPanel title={t('dashboard.shortcuts')}>
          <div className="quick-actions">
            <QuickAction to="/app/academic" icon="courses" label={t('dashboard.academicRecords')} meta={t('dashboard.metric.grades')} />
            <QuickAction to="/app/payments" icon="payments" label={t('dashboard.metric.payments')} meta={t('dashboard.reviewStatus')} />
            <QuickAction to="/app/profile" icon="profile" label={t('nav.profile')} meta={t('dashboard.contactDetails')} />
          </div>
        </OpsPanel>
      </div>
    </PageLayout>
  );
}
