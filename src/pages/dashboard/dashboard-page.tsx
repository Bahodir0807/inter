import { useQuery } from '@tanstack/react-query';
import { coursesApi } from '../../entities/course/api';
import { groupsApi } from '../../entities/group/api';
import { paymentsApi } from '../../entities/payment/api';
import { scheduleApi } from '../../entities/schedule/api';
import { usersApi } from '../../entities/user/api';
import { useAuthStore } from '../../features/auth/model/auth-store';
import { LoadingState } from '../../shared/ui/feedback/loading-state';
import { ErrorState } from '../../shared/ui/feedback/error-state';
import { EmptyState } from '../../shared/ui/feedback/empty-state';
import { Card } from '../../shared/ui/surfaces/card';
import { PageLayout } from '../../widgets/page/page-layout';
import { Badge } from '../../shared/ui/badges/badge';
import { formatMoney } from '../../shared/lib/date';
import { useI18n } from '../../shared/i18n/i18n';

export function DashboardPage() {
  const user = useAuthStore(state => state.user);
  const { t } = useI18n();

  const query = useQuery({
    queryKey: ['dashboard', 'summary', user?.role],
    queryFn: async () => {
      const [users, courses, groups, schedule, payments] = await Promise.all([
        usersApi.getAll().catch(() => []),
        coursesApi.getAll().catch(() => []),
        groupsApi.getAll().catch(() => []),
        scheduleApi.getAll().catch(() => []),
        user?.role === 'student' ? paymentsApi.getMine().catch(() => []) : paymentsApi.getAll().catch(() => []),
      ]);
      return { users, courses, groups, schedule, payments };
    },
    enabled: !!user,
  });

  if (query.isLoading) return <LoadingState label={t('common.loading')} />;
  if (query.error) return <ErrorState description={query.error.message} onRetry={() => void query.refetch()} />;
  if (!query.data) return <EmptyState title={t('dashboard.noDataTitle')} description={t('dashboard.noDataDescription')} />;

  const { users, courses, groups, schedule, payments } = query.data;
  const pendingPayments = payments.filter(item => item.status === 'pending' || item.status === 'partial');
  const totalPaid = payments.reduce((sum, item) => sum + item.paidAmount, 0);

  return (
    <PageLayout
      eyebrow={t('dashboard.overview')}
      title={t('dashboard.title')}
      description={t('dashboard.description')}
      variant="feature"
    >
      <div className="dashboard-grid">
        <Card className="metric-card">
          <span className="subtle">{t('dashboard.metric.people')}</span>
          <strong>{users.length}</strong>
          <span className="subtle">{t('dashboard.metric.visibleUsers')}</span>
        </Card>
        <Card className="metric-card">
          <span className="subtle">{t('dashboard.metric.courses')}</span>
          <strong>{courses.length}</strong>
          <span className="subtle">{t('dashboard.metric.activeCourses')}</span>
        </Card>
        <Card className="metric-card">
          <span className="subtle">{t('dashboard.metric.groups')}</span>
          <strong>{groups.length}</strong>
          <span className="subtle">{t('dashboard.metric.activeGroups')}</span>
        </Card>
        <Card className="metric-card">
          <span className="subtle">{t('dashboard.metric.payments')}</span>
          <strong>{formatMoney(totalPaid)}</strong>
          <span className="subtle">{t('dashboard.pendingCount', { count: pendingPayments.length })}</span>
        </Card>
      </div>

      <div className="ops-layout">
        <Card className="ops-panel">
          <h3>{t('dashboard.pendingPaymentsTitle')}</h3>
          {pendingPayments.length === 0 ? (
            <EmptyState compact title={t('dashboard.noPendingPayments')} description={t('dashboard.problemPaymentsAppear')} />
          ) : (
            <ul className="ops-list">
              {pendingPayments.slice(0, 8).map(item => (
                <li className="ops-list__item" key={item.id}>
                  <div className="cell-stack">
                    <span className="cell-title">{item.studentId}</span>
                    <span className="cell-meta">{item.courseId}</span>
                    <span className="cell-meta">{formatMoney(item.paidAmount)} / {formatMoney(item.expectedAmount)}</span>
                  </div>
                  <Badge tone={item.status === 'pending' ? 'warning' : 'danger'}>{item.status}</Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="ops-panel">
          <h3>{t('dashboard.upcomingLessons')}</h3>
          {schedule.length === 0 ? (
            <EmptyState compact title={t('dashboard.noUpcomingLessons')} description={t('dashboard.scheduledLessonsAppear')} />
          ) : (
            <ul className="ops-list">
              {schedule.slice(0, 8).map(item => (
                <li className="ops-list__item" key={item.id}>
                  <div className="cell-stack">
                    <span className="cell-title">{typeof item.course === 'string' ? item.course : item.course?.name || '-'}</span>
                    <span className="cell-meta">{item.timeStart || item.date}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </PageLayout>
  );
}
