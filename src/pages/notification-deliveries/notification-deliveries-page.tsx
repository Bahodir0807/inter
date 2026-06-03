import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  NotificationDeliveryStatus,
  notificationsApi,
} from '../../entities/notification/api';
import { branchesApi } from '../../entities/branch/api';
import { coursesApi } from '../../entities/course/api';
import { useAuthStore } from '../../features/auth/model/auth-store';
import { useDebouncedValue } from '../../shared/hooks/use-debounced-value';
import { useUrlState } from '../../shared/hooks/use-url-state';
import { useI18n } from '../../shared/i18n/i18n';
import { formatDateTime } from '../../shared/lib/date';
import { getRoleCapabilities } from '../../shared/lib/capabilities';
import { Badge } from '../../shared/ui/badges/badge';
import { DataTable } from '../../shared/ui/data-display/data-table';
import { Pagination } from '../../shared/ui/data-display/pagination';
import { TableShell } from '../../shared/ui/data-display/table-shell';
import { TableToolbar } from '../../shared/ui/data-display/table-toolbar';
import { EmptyState } from '../../shared/ui/feedback/empty-state';
import { ErrorState } from '../../shared/ui/feedback/error-state';
import { LoadingState } from '../../shared/ui/feedback/loading-state';
import { Input } from '../../shared/ui/forms/input';
import { Select } from '../../shared/ui/forms/select';
import { Card } from '../../shared/ui/surfaces/card';
import { PageLayout } from '../../widgets/page/page-layout';

const pageSize = 20;
const statusOptions: Array<NotificationDeliveryStatus | ''> = [
  '',
  'dry_run',
  'skipped',
  'sent',
  'failed',
  'pending',
];

function statusTone(status: NotificationDeliveryStatus) {
  if (status === 'sent') return 'success';
  if (status === 'failed') return 'danger';
  if (status === 'skipped') return 'warning';
  if (status === 'dry_run') return 'info';
  return 'neutral';
}

function messagePreview(value: string) {
  return value.length > 90 ? `${value.slice(0, 90).trimEnd()}...` : value;
}

export function NotificationDeliveriesPage() {
  const user = useAuthStore(state => state.user);
  const capabilities = getRoleCapabilities(user?.role);
  const { t } = useI18n();
  const urlState = useUrlState();
  const [page, setPageState] = useState(urlState.getNumber('page', 1));
  const [search, setSearchState] = useState(urlState.getString('search'));
  const [status, setStatusState] = useState(urlState.getString('status'));
  const [branchId, setBranchIdState] = useState(urlState.getString('branchId'));
  const [courseId, setCourseIdState] = useState(urlState.getString('courseId'));
  const [dateFrom, setDateFromState] = useState(urlState.getString('dateFrom'));
  const [dateTo, setDateToState] = useState(urlState.getString('dateTo'));
  const debouncedSearch = useDebouncedValue(search);

  const setPage = (value: number) => {
    setPageState(value);
    urlState.setValue('page', value > 1 ? value : undefined);
  };
  const updateFilter = (key: string, value: string, setter: (value: string) => void) => {
    setter(value);
    setPageState(1);
    urlState.setValues({ [key]: value || undefined, page: undefined });
  };

  const params = useMemo(() => ({
    page,
    limit: pageSize,
    search: debouncedSearch || undefined,
    status: (status || undefined) as NotificationDeliveryStatus | undefined,
    branchId: branchId || undefined,
    courseId: courseId || undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
    type: 'debt_sms' as const,
    channel: 'sms' as const,
  }), [branchId, courseId, dateFrom, dateTo, debouncedSearch, page, status]);

  const deliveriesQuery = useQuery({
    queryKey: ['notification-deliveries', params],
    queryFn: () => notificationsApi.getDeliveries(params),
    enabled: capabilities.notifications.viewDeliveries,
  });
  const branchesQuery = useQuery({
    queryKey: ['notification-deliveries', 'branches'],
    queryFn: () => branchesApi.getAll({ limit: 100 }),
    enabled: capabilities.notifications.viewDeliveries,
  });
  const coursesQuery = useQuery({
    queryKey: ['notification-deliveries', 'courses'],
    queryFn: () => coursesApi.getAll({ limit: 100 }),
    enabled: capabilities.notifications.viewDeliveries,
  });

  if (!capabilities.notifications.viewDeliveries) {
    return <ErrorState title={t('common.forbidden')} description={t('notifications.deliveriesAccessDenied')} />;
  }

  if (deliveriesQuery.isLoading) {
    return <LoadingState label={t('notifications.deliveriesLoading')} />;
  }

  if (deliveriesQuery.error) {
    return <ErrorState description={t('notifications.deliveriesLoadFailed')} onRetry={() => void deliveriesQuery.refetch()} />;
  }

  const deliveries = deliveriesQuery.data?.items ?? [];
  const pagination = deliveriesQuery.data?.pagination;
  const activeFilters = [
    status ? t('notifications.filterStatus', { status: t(`notifications.status.${status}`) }) : '',
    branchId ? t('finance.filterBranch', { branchId }) : '',
    courseId ? t('notifications.filterCourse', { courseId }) : '',
    dateFrom ? t('notifications.filterDateFrom', { date: dateFrom }) : '',
    dateTo ? t('notifications.filterDateTo', { date: dateTo }) : '',
  ].filter(Boolean);

  return (
    <PageLayout
      eyebrow={t('notifications.deliveryHistory')}
      title={t('notifications.deliveriesTitle')}
      description={t('notifications.deliveriesDescription')}
    >
      <div className="dashboard-grid">
        <Card className="metric-card">
          <span className="subtle">{t('notifications.deliveryHistory')}</span>
          <strong>{pagination?.total ?? deliveries.length}</strong>
          <span className="subtle">{t('notifications.readOnly')}</span>
        </Card>
        <Card className="metric-card">
          <span className="subtle">{t('notifications.dryRun')}</span>
          <strong>{deliveries.filter(item => item.status === 'dry_run').length}</strong>
          <span className="subtle">{t('notifications.visiblePage')}</span>
        </Card>
      </div>

      {deliveries.length === 0 ? (
        <EmptyState title={t('notifications.noDeliveriesFound')} description={t('notifications.noDeliveriesDescription')} />
      ) : (
        <TableShell
          title={t('notifications.deliveryHistory')}
          description={t('notifications.deliveriesTableDescription')}
          actions={(
            <TableToolbar
              search={search}
              onSearchChange={value => updateFilter('search', value, setSearchState)}
              searchPlaceholder={t('notifications.searchPlaceholder')}
              resultsLabel={t('notifications.resultsLabel', { count: pagination?.total ?? deliveries.length })}
              activeFilters={activeFilters}
              filters={(
                <>
                  <Select value={status} onChange={event => updateFilter('status', event.target.value, setStatusState)} aria-label={t('notifications.smsStatus')}>
                    {statusOptions.map(option => (
                      <option key={option || 'all'} value={option}>
                        {option ? t(`notifications.status.${option}`) : t('notifications.allStatuses')}
                      </option>
                    ))}
                  </Select>
                  <Select value={branchId} onChange={event => updateFilter('branchId', event.target.value, setBranchIdState)} aria-label={t('branches.branch')}>
                    <option value="">{t('finance.allBranches')}</option>
                    {branchesQuery.isLoading ? <option value="" disabled>{t('common.loading')}</option> : null}
                    {branchesQuery.error ? <option value="" disabled>{t('finance.filtersLoadFailed')}</option> : null}
                    {!branchesQuery.isLoading && !branchesQuery.error && (branchesQuery.data ?? []).length === 0 ? (
                      <option value="" disabled>{t('branches.noBranchesFound')}</option>
                    ) : null}
                    {(branchesQuery.data ?? []).map(branch => (
                      <option key={branch.id} value={branch.id}>{branch.name || branch.id}</option>
                    ))}
                  </Select>
                  <Select value={courseId} onChange={event => updateFilter('courseId', event.target.value, setCourseIdState)} aria-label={t('finance.selectCourse')}>
                    <option value="">{t('finance.allCourses')}</option>
                    {coursesQuery.isLoading ? <option value="" disabled>{t('common.loading')}</option> : null}
                    {coursesQuery.error ? <option value="" disabled>{t('finance.filtersLoadFailed')}</option> : null}
                    {!coursesQuery.isLoading && !coursesQuery.error && (coursesQuery.data ?? []).length === 0 ? (
                      <option value="" disabled>{t('notifications.noCoursesFound')}</option>
                    ) : null}
                    {(coursesQuery.data ?? []).map(course => (
                      <option key={course.id} value={course.id}>{course.name || course.id}</option>
                    ))}
                  </Select>
                  <Input type="date" value={dateFrom} onChange={event => updateFilter('dateFrom', event.target.value, setDateFromState)} aria-label={t('notifications.dateFrom')} />
                  <Input type="date" value={dateTo} onChange={event => updateFilter('dateTo', event.target.value, setDateToState)} aria-label={t('notifications.dateTo')} />
                </>
              )}
            />
          )}
        >
          <DataTable
            getRowKey={item => item.id}
            columns={[
              {
                key: 'createdAt',
                header: t('notifications.dateTime'),
                cell: item => formatDateTime(item.createdAt),
              },
              {
                key: 'student',
                header: t('finance.student'),
                className: 'data-table__cell--primary',
                cell: item => (
                  <div className="cell-stack cell-stack--primary">
                    <span className="cell-title">{item.studentName || '-'}</span>
                    <span className="cell-meta">{item.studentNumber || item.studentId}</span>
                  </div>
                ),
              },
              {
                key: 'recipient',
                header: t('notifications.recipient'),
                cell: item => (
                  <div className="cell-stack">
                    <span>{item.phone}</span>
                    <span className="cell-meta">{t(`notifications.recipientType.${item.recipientType}`)}</span>
                  </div>
                ),
              },
              {
                key: 'type',
                header: t('notifications.typeChannel'),
                cell: item => `${item.type} / ${item.channel}`,
              },
              {
                key: 'status',
                header: t('notifications.smsStatus'),
                cell: item => (
                  <Badge tone={statusTone(item.status)}>
                    {t(`notifications.status.${item.status}`)}
                  </Badge>
                ),
              },
              {
                key: 'message',
                header: t('notifications.messagePreview'),
                cell: item => messagePreview(item.message),
              },
              {
                key: 'error',
                header: t('notifications.error'),
                cell: item => item.error || '-',
              },
              {
                key: 'payment',
                header: t('notifications.paymentId'),
                cell: item => <span className="cell-meta">{item.paymentId}</span>,
              },
            ]}
            rows={deliveries}
            emptyTitle={t('notifications.noDeliveriesFound')}
            emptyDescription={t('notifications.noDeliveriesDescription')}
          />
          <Pagination page={pagination?.page ?? page} totalPages={pagination?.totalPages ?? 1} onChange={setPage} />
        </TableShell>
      )}
    </PageLayout>
  );
}
