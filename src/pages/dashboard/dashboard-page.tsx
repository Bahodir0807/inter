import { useQuery } from '@tanstack/react-query';
import { attendanceApi } from '../../entities/attendance/api';
import { coursesApi } from '../../entities/course/api';
import { gradesApi } from '../../entities/grade/api';
import { groupsApi } from '../../entities/group/api';
import { homeworkApi } from '../../entities/homework/api';
import { paymentsApi } from '../../entities/payment/api';
import { roomsApi } from '../../entities/room/api';
import { scheduleApi } from '../../entities/schedule/api';
import { usersApi } from '../../entities/user/api';
import { paymentsManagerRoles } from '../../app/router/navigation';
import { useAuthStore } from '../../features/auth/model/auth-store';
import { DataTable } from '../../shared/ui/data-display/data-table';
import { EmptyState } from '../../shared/ui/feedback/empty-state';
import { ErrorState } from '../../shared/ui/feedback/error-state';
import { LoadingState } from '../../shared/ui/feedback/loading-state';
import { Card } from '../../shared/ui/surfaces/card';
import { PageLayout } from '../../widgets/page/page-layout';
import { TableShell } from '../../shared/ui/data-display/table-shell';
import { Badge } from '../../shared/ui/badges/badge';
import { formatDateTime, formatMoney } from '../../shared/lib/date';
import { getCourseDisplayName, getUserDisplayName } from '../../shared/lib/entity-display';
import { cn } from '../../shared/lib/cn';

function MetricCard({
  label,
  value,
  hint,
  className,
}: {
  label: string;
  value: string | number;
  hint: string;
  className?: string;
}) {
  return (
    <Card className={cn('metric-card', className)}>
      <span className="subtle">{label}</span>
      <strong>{value}</strong>
      <span className="subtle">{hint}</span>
    </Card>
  );
}

export function DashboardPage() {
  const user = useAuthStore(state => state.user);
  const isOwnerAdmin = !!user && paymentsManagerRoles.includes(user.role);
  const isPanda = user?.role === 'panda';
  const isStudent = user?.role === 'student';

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
    queryKey: ['dashboard', 'learner', user?.role],
    queryFn: async () => {
      const [schedule, homework, grades, attendance] = await Promise.all([
        scheduleApi.getMine(),
        homeworkApi.getMine(),
        gradesApi.getMine(),
        attendanceApi.getMine(),
      ]);

      const payments = isStudent ? await paymentsApi.getMine() : [];

      return { schedule, homework, grades, attendance, payments };
    },
    enabled: !!user && !isOwnerAdmin && !isPanda,
  });

  const activeQuery = isOwnerAdmin ? ownerAdminQuery : isPanda ? pandaQuery : learnerQuery;

  if (activeQuery.isLoading) {
    return <LoadingState label="Loading dashboard data..." />;
  }

  if (activeQuery.error) {
    return <ErrorState description={activeQuery.error.message} onRetry={() => void activeQuery.refetch()} />;
  }

  if (!activeQuery.data) {
    return <EmptyState title="No dashboard data yet" description="The dashboard is connected, but there is nothing usable to show in this workspace yet." />;
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

    return (
      <PageLayout
        eyebrow="Overview"
        title="Dashboard"
        description="Operational overview for owners and admins with access to the core CRM data footprint."
      >
        <div className="dashboard-grid dashboard-grid--overview">
          <MetricCard className="metric-card--hero" label="Users" value={data.users.length} hint="People in the system" />
          <MetricCard label="Courses" value={data.courses.length} hint="Active programs" />
          <MetricCard label="Groups" value={data.groups.length} hint="Learning cohorts" />
          <MetricCard className="metric-card--accent" label="Payments" value={data.payments.length} hint="Tracked transactions" />
        </div>
        <div className="content-grid">
          <Card className="content-grid__wide dashboard-panel">
            <div className="dashboard-panel__intro">
              <div className="stack">
                <h3>Operational pulse</h3>
                <p className="subtle">A compact read on what is moving through the center today.</p>
              </div>
            </div>
            <div className="stats-grid stats-grid--dashboard">
              <MetricCard label="Schedule" value={data.schedule.length} hint="Planned sessions" />
              <MetricCard label="Rooms" value={data.rooms.length} hint="Available spaces" />
              <MetricCard label="Confirmed" value={data.payments.filter(item => item.isConfirmed).length} hint="Verified payments" />
              <MetricCard
                className="metric-card--quiet"
                label="Tracked amount"
                value={formatMoney(data.payments.reduce((sum, item) => sum + item.amount, 0))}
                hint="Total payment amount"
              />
            </div>
          </Card>
          <Card className="content-grid__side dashboard-note">
            <span className="eyebrow">Working note</span>
            <h3>List-first reporting for now</h3>
            <p className="subtle">This dashboard still relies on list endpoints without server-side aggregates or pagination.</p>
          </Card>
        </div>
      </PageLayout>
    );
  }

  if (isPanda) {
    const data = activeQuery.data as { users: Awaited<ReturnType<typeof usersApi.getAll>> };

    return (
      <PageLayout
        eyebrow="Restricted access"
        title="Dashboard"
        description="A safe overview for the panda role using only the backend endpoints that are explicitly available."
      >
        <div className="dashboard-grid">
          <MetricCard className="metric-card--hero" label="Users" value={data.users.length} hint="Accessible through `/users`" />
          <MetricCard className="metric-card--accent" label="Students" value={data.users.filter(item => item.role === 'student').length} hint="Student accounts" />
        </div>
        <Card className="dashboard-note">
          <span className="eyebrow">Scope</span>
          <h3>Intentionally narrow access</h3>
          <p className="subtle">
            The backend still gives `panda` a narrower scope than `owner` or `admin`, so this view stays intentionally limited.
          </p>
        </Card>
      </PageLayout>
    );
  }

  const data = activeQuery.data as {
    schedule: Awaited<ReturnType<typeof scheduleApi.getMine>>;
    homework: Awaited<ReturnType<typeof homeworkApi.getMine>>;
    grades: Awaited<ReturnType<typeof gradesApi.getMine>>;
    attendance: Awaited<ReturnType<typeof attendanceApi.getMine>>;
    payments: Awaited<ReturnType<typeof paymentsApi.getMine>>;
  };

  return (
    <PageLayout
      eyebrow="My workspace"
      title="Dashboard"
      description="A daily overview for students and teachers using personal `me` endpoints."
    >
      <div className="dashboard-grid">
        <MetricCard className="metric-card--hero" label="Schedule" value={data.schedule.length} hint="Planned sessions" />
        <MetricCard label="Homework" value={data.homework.length} hint="Assigned tasks" />
        <MetricCard label="Grades" value={data.grades.length} hint="Recorded grades" />
        <MetricCard
          className="metric-card--accent"
          label="Payments"
          value={formatMoney(data.payments.reduce((sum, item) => sum + item.amount, 0))}
          hint={isStudent ? 'My payment history' : 'Teachers do not have payment endpoints'}
        />
      </div>
      <div className="content-grid">
        <Card className="content-grid__side dashboard-note">
          <span className="eyebrow">Today</span>
          <h3>Attendance</h3>
          <p className="subtle">Latest status: {data.attendance[0]?.status ?? 'no records yet'}</p>
        </Card>
        <TableShell title="Upcoming sessions" description="The next sessions from your personal schedule, kept in order.">
          <DataTable
            getRowKey={item => item.id}
            columns={[
              {
                key: 'course',
                header: 'Course',
                className: 'data-table__cell--primary',
                cell: item => (
                  <div className="cell-stack cell-stack--primary cell-stack--relation">
                    <span className="cell-title">{getCourseDisplayName(item.course)}</span>
                    <span className="cell-meta cell-meta--strong">{formatDateTime(item.timeStart)}</span>
                  </div>
                ),
              },
              {
                key: 'teacher',
                header: 'Teacher',
                className: 'data-table__cell--relation',
                cell: item => (
                  <div className="cell-stack cell-stack--relation">
                    <span className="cell-title">{getUserDisplayName(item.teacher)}</span>
                    <span className="cell-meta">Assigned teacher</span>
                  </div>
                ),
              },
              {
                key: 'source',
                header: 'Source',
                cell: () => <Badge tone="info">me endpoint</Badge>,
              },
            ]}
            rows={data.schedule.slice(0, 5)}
            emptyTitle="No upcoming sessions"
            emptyDescription="New sessions will appear here as soon as they are assigned."
          />
        </TableShell>
      </div>
    </PageLayout>
  );
}
