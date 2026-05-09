import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { attendanceApi } from '../../entities/attendance/api';
import { Course, coursesApi } from '../../entities/course/api';
import { gradesApi } from '../../entities/grade/api';
import { Group, groupsApi } from '../../entities/group/api';
import { homeworkApi } from '../../entities/homework/api';
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

function renderLessons(items: ScheduleItem[], emptyTitle: string, emptyDescription: string) {
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
          badge={isToday(item.timeStart) ? 'Today' : formatDate(item.timeStart)}
          tone={isToday(item.timeStart) ? 'info' : 'neutral'}
        />
      ))}
    </ul>
  );
}

function renderPayments(items: Payment[], emptyTitle: string, emptyDescription: string) {
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
          detail={item.paidAt ? formatDateTime(item.paidAt) : 'No payment date'}
          badge={item.status}
          tone={item.status === 'confirmed' ? 'success' : item.status === 'pending' ? 'warning' : 'danger'}
        />
      ))}
    </ul>
  );
}

export function DashboardPage() {
  const user = useAuthStore(state => state.user);
  const { t } = useI18n();
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
      const [homework, grades, attendance, payments] = isStudent
        ? await Promise.all([
            homeworkApi.getMine(),
            gradesApi.getMine(),
            attendanceApi.getMine(),
            paymentsApi.getMine(),
          ])
        : [[], [], [], []];

      return { schedule, teacherGroups, homework, grades, attendance, payments };
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
      ...data.courses.filter(course => !course.teacherId).map(course => `${course.name}: no teacher assigned`),
      ...data.groups.filter(group => group.students.length === 0).map(group => `${group.name}: empty roster`),
      ...pendingPayments.slice(0, 4).map(payment => `${getUserDisplayName(payment.student)}: payment pending`),
      ...data.users.filter(item => !item.isActive).slice(0, 3).map(item => `${getUserDisplayName(item)}: inactive account`),
    ].slice(0, 7);

    return (
      <PageLayout
        eyebrow={t('dashboard.overview')}
        title={t('dashboard.title')}
        description={t('dashboard.description', 'Operational CRM workspace for today lessons, payments, groups, and academic follow-up.')}
        variant="feature"
      >
        <div className="dashboard-grid dashboard-grid--overview">
          <MetricCard tone="hero" label="Needs attention" value={pendingPayments.length + academicAlerts.length} hint="Open payment and academic items" />
          <MetricCard label={t('dashboard.metric.lessons')} value={todayLessons.length} hint="Scheduled for today" />
          <MetricCard label={t('dashboard.metric.groups')} value={activeGroups.length} hint={t('dashboard.metric.activeGroups')} />
          <MetricCard tone="accent" label={t('dashboard.metric.payments')} value={formatMoney(data.payments.reduce((sum, item) => sum + item.amount, 0))} hint={`${pendingPayments.length} pending`} />
        </div>

        <div className="ops-layout">
          <OpsPanel className="ops-panel--primary" eyebrow={t('dashboard.today')} title="Attention queue">
            <div className="attention-strip">
              <div><strong>{todayLessons.length}</strong><span>lessons today</span></div>
              <div><strong>{pendingPayments.length}</strong><span>pending payments</span></div>
              <div><strong>{data.groups.filter(group => group.students.length === 0).length}</strong><span>empty groups</span></div>
              <div><strong>{data.courses.filter(course => !course.teacherId).length}</strong><span>courses without teacher</span></div>
            </div>
          </OpsPanel>

          <OpsPanel title="Quick actions">
            <div className="quick-actions">
              <QuickAction to="/app/schedule" icon="schedule" label="Plan lessons" meta="Open schedule" />
              <QuickAction to="/app/payments" icon="payments" label="Review payments" meta="Confirm pending records" />
              <QuickAction to="/app/groups" icon="groups" label="Check groups" meta="Rosters and teachers" />
              <QuickAction to="/app/academic" icon="courses" label="Academic follow-up" meta="Attendance, homework, grades" />
            </div>
          </OpsPanel>

          <OpsPanel title="Upcoming lessons">
            {renderLessons(upcomingLessons, 'No upcoming lessons', 'Scheduled lessons will appear here.')}
          </OpsPanel>

          <OpsPanel title="Pending payments">
            {renderPayments(pendingPayments.slice(0, 5), 'No pending payments', 'Problem payments will appear here.')}
          </OpsPanel>

          <OpsPanel title="Recent payments">
            {renderPayments(recentPayments, 'No payments yet', 'Recent payment activity will appear here.')}
          </OpsPanel>

          <OpsPanel title="Active groups">
            {activeGroups.length === 0 ? (
              <CompactEmpty title="No active groups" description="Groups with students will appear here." />
            ) : (
              <ul className="ops-list">
                {activeGroups.slice(0, 5).map(group => (
                  <ListItem
                    key={group.id}
                    title={group.name}
                    meta={`${getCourseDisplayName(group.course)} · ${getUserDisplayName(group.teacher)}`}
                    detail={getUserListSummary(group.students, 3)}
                    badge={`${group.students.length} students`}
                    tone="info"
                  />
                ))}
              </ul>
            )}
          </OpsPanel>

          <OpsPanel title="Teacher workload">
            {teacherWorkload.length === 0 ? (
              <CompactEmpty title="No teachers yet" description="Teacher workload appears when teachers are assigned." />
            ) : (
              <ul className="workload-list">
                {teacherWorkload.map(item => (
                  <li key={item.teacher.id}>
                    <div className="cell-stack">
                      <span className="cell-title">{getUserDisplayName(item.teacher)}</span>
                      <span className="cell-meta">{item.groups} groups · {item.lessons} lessons</span>
                    </div>
                    <div className="workload-meter"><span style={{ width: `${Math.min(100, item.lessons * 12)}%` }} /></div>
                  </li>
                ))}
              </ul>
            )}
          </OpsPanel>

          <OpsPanel title="Academic alerts">
            {academicAlerts.length === 0 ? (
              <CompactEmpty title="No alerts" description="Courses, groups, and accounts look complete." />
            ) : (
              <ul className="ops-list">
                {academicAlerts.map(alert => (
                  <ListItem key={alert} title={alert} badge="Check" tone="warning" />
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
          <MetricCard tone="warning" label="Attention" value={inactive.length} hint="Inactive visible accounts" />
        </div>
        <div className="ops-layout ops-layout--two">
          <OpsPanel title={t('dashboard.scopeTitle')}>
            <p className="subtle">{t('dashboard.scopeCopy')}</p>
          </OpsPanel>
          <OpsPanel title="Visible students">
            {students.length === 0 ? (
              <CompactEmpty title="No students" description="Student accounts will appear here." />
            ) : (
              <ul className="ops-list">
                {students.slice(0, 6).map(student => (
                  <ListItem key={student.id} title={getUserDisplayName(student)} meta={student.phoneNumber || student.email || student.username} badge={student.isActive ? 'Active' : 'Inactive'} tone={student.isActive ? 'success' : 'warning'} />
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
    homework: Awaited<ReturnType<typeof homeworkApi.getMine>>;
    grades: Awaited<ReturnType<typeof gradesApi.getMine>>;
    attendance: Awaited<ReturnType<typeof attendanceApi.getMine>>;
    payments: Awaited<ReturnType<typeof paymentsApi.getMine>>;
  };
  const upcomingLessons = data.schedule
    .filter(item => new Date(item.timeStart || item.date).getTime() >= Date.now() - 60 * 60 * 1000)
    .sort(byStartTime);
  const todayLessons = upcomingLessons.filter(item => isToday(item.timeStart || item.date));
  const nextLesson = upcomingLessons[0];
  const openHomework = data.homework.filter(item => !item.completed);
  const latestGrade = [...data.grades].sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime())[0];
  const pendingStudentPayments = data.payments.filter(item => item.status === 'pending');
  const attendanceSummary = data.attendance[0]?.status ?? t('dashboard.noRecordsYet');

  if (isTeacher) {
    return (
      <PageLayout eyebrow="Teacher workspace" title={t('dashboard.title')} description="Today lessons, own groups, and academic shortcuts." variant="feature">
        <div className="dashboard-grid">
          <MetricCard tone="hero" label="Today lessons" value={todayLessons.length} hint="Lessons requiring attendance" />
          <MetricCard label="Own groups" value={data.teacherGroups.length} hint="Teacher-scoped rosters" />
          <MetricCard tone="accent" label="Students" value={data.teacherGroups.reduce((sum, group) => sum + group.students.length, 0)} hint="Across own groups" />
          <MetricCard tone="quiet" label="Upcoming" value={upcomingLessons.length} hint="Visible schedule items" />
        </div>
        <div className="ops-layout ops-layout--teacher">
          <OpsPanel className="ops-panel--primary" eyebrow={t('dashboard.today')} title="Today lessons">
            {renderLessons(todayLessons, 'No lessons today', 'Your scheduled lessons for today will appear here.')}
          </OpsPanel>
          <OpsPanel title="Academic shortcuts">
            <div className="quick-actions">
              <QuickAction to="/app/academic" icon="courses" label="Mark attendance" meta="Open attendance workspace" />
              <QuickAction to="/app/academic" icon="courses" label="Assign homework" meta="Use student scope" />
              <QuickAction to="/app/academic" icon="courses" label="Record grades" meta="Update progress" />
              <QuickAction to="/app/schedule" icon="schedule" label="Open schedule" meta="Review lesson plan" />
            </div>
          </OpsPanel>
          <OpsPanel title="Own groups">
            {data.teacherGroups.length === 0 ? (
              <CompactEmpty title="No groups assigned" description="Assigned groups will appear here." />
            ) : (
              <ul className="ops-list">
                {data.teacherGroups.slice(0, 6).map(group => (
                  <ListItem key={group.id} title={group.name} meta={getCourseDisplayName(group.course)} detail={getUserListSummary(group.students, 3)} badge={`${group.students.length} students`} tone="info" />
                ))}
              </ul>
            )}
          </OpsPanel>
          <OpsPanel title="Upcoming lessons">
            {renderLessons(upcomingLessons.slice(0, 5), 'No upcoming lessons', 'Future lessons will appear here.')}
          </OpsPanel>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout eyebrow={t('dashboard.myWorkspace')} title={t('dashboard.title')} description={t('dashboard.myDescription')} variant="feature">
      <div className="dashboard-grid">
        <MetricCard tone="hero" label="Next lesson" value={nextLesson ? formatDate(nextLesson.timeStart) : '-'} hint={nextLesson ? getCourseDisplayName(nextLesson.course) : 'No scheduled lesson'} />
        <MetricCard label={t('dashboard.metric.homework')} value={openHomework.length} hint="Open assignments" />
        <MetricCard label={t('dashboard.metric.grades')} value={latestGrade ? latestGrade.score : data.grades.length} hint={latestGrade ? latestGrade.subject : t('dashboard.metric.recordedGrades')} />
        <MetricCard tone={pendingStudentPayments.length > 0 ? 'warning' : 'accent'} label={t('dashboard.metric.payments')} value={pendingStudentPayments.length} hint="Pending payment records" />
      </div>
      <div className="ops-layout ops-layout--student">
        <OpsPanel className="ops-panel--primary" title="Next lesson">
          {nextLesson ? (
            <ul className="ops-list">
              <ListItem
                title={getCourseDisplayName(nextLesson.course)}
                meta={`${formatDateTime(nextLesson.timeStart)} - ${getRoomDisplayName(nextLesson.room)}`}
                detail={`${getUserDisplayName(nextLesson.teacher)} · ${getGroupDisplayName(nextLesson.group)}`}
                badge="Upcoming"
                tone="info"
              />
            </ul>
          ) : (
            <CompactEmpty title="No next lesson" description="Your next lesson will appear after it is scheduled." />
          )}
        </OpsPanel>
        <OpsPanel title="Homework">
          {data.homework.length === 0 ? (
            <CompactEmpty title="No homework" description="Assigned homework will appear here." />
          ) : (
            <ul className="ops-list">
              {data.homework.slice(0, 5).map(item => (
                <ListItem key={item.id} title={item.tasks.join(', ')} meta={formatDate(item.date)} badge={item.completed ? 'Done' : 'Open'} tone={item.completed ? 'success' : 'warning'} />
              ))}
            </ul>
          )}
        </OpsPanel>
        <OpsPanel title="Grades">
          {data.grades.length === 0 ? (
            <CompactEmpty title="No grades" description="Recorded grades will appear here." />
          ) : (
            <ul className="ops-list">
              {data.grades.slice(0, 5).map(item => (
                <ListItem key={item.id} title={item.subject} meta={item.date ? formatDate(item.date) : undefined} badge={`${item.score}`} tone="success" />
              ))}
            </ul>
          )}
        </OpsPanel>
        <OpsPanel title="Payment status">
          {renderPayments(data.payments.slice(0, 5), 'No payments', 'Your payment records will appear here.')}
        </OpsPanel>
        <OpsPanel title="Teacher and group">
          <div className="student-context">
            <div><span>Teacher</span><strong>{getUserDisplayName(nextLesson?.teacher)}</strong></div>
            <div><span>Group</span><strong>{getGroupDisplayName(nextLesson?.group)}</strong></div>
            <div><span>Course teacher</span><strong>{getCourseTeacherName(nextLesson?.course)}</strong></div>
            <div><span>Attendance</span><strong>{attendanceSummary}</strong></div>
          </div>
        </OpsPanel>
        <OpsPanel title="Shortcuts">
          <div className="quick-actions">
            <QuickAction to="/app/academic" icon="courses" label="Academic records" meta="Homework and grades" />
            <QuickAction to="/app/payments" icon="payments" label="Payments" meta="Review status" />
            <QuickAction to="/app/profile" icon="profile" label="Profile" meta="Contact details" />
          </div>
        </OpsPanel>
      </div>
    </PageLayout>
  );
}
