import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { branchesApi } from '../../entities/branch/api';
import { coursesApi } from '../../entities/course/api';
import { groupsApi } from '../../entities/group/api';
import { PaymentDebtor, PaymentStatus, paymentsApi } from '../../entities/payment/api';
import { scheduleApi } from '../../entities/schedule/api';
import { gradesApi } from '../../entities/grade/api';
import { attendanceApi } from '../../entities/attendance/api';
import { usersApi } from '../../entities/user/api';
import { useAuthStore } from '../../features/auth/model/auth-store';
import { LoadingState } from '../../shared/ui/feedback/loading-state';
import { ErrorState } from '../../shared/ui/feedback/error-state';
import { EmptyState } from '../../shared/ui/feedback/empty-state';
import { Card } from '../../shared/ui/surfaces/card';
import { PageLayout } from '../../widgets/page/page-layout';
import { Badge } from '../../shared/ui/badges/badge';
import { formatDate, formatMoney } from '../../shared/lib/date';
import { useI18n } from '../../shared/i18n/i18n';
import { getRoleCapabilities } from '../../shared/lib/capabilities';
import { Select } from '../../shared/ui/forms/select';
import { Input } from '../../shared/ui/forms/input';
import { TableToolbar } from '../../shared/ui/data-display/table-toolbar';
import { TableShell } from '../../shared/ui/data-display/table-shell';
import { DataTable, type Column } from '../../shared/ui/data-display/data-table';
import { Pagination } from '../../shared/ui/data-display/pagination';

const debtorsPageSize = 10;

const statusColorMap: Record<PaymentStatus, 'success' | 'warning' | 'danger' | 'neutral' | 'info'> = {
  paid: 'success',
  partial: 'warning',
  debt: 'danger',
  pending: 'warning',
  frozen: 'neutral',
  overpaid: 'info',
};

function parseOptionalNumber(value: string) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
}

export function DashboardPage() {
  const user = useAuthStore(state => state.user);
  const capabilities = getRoleCapabilities(user?.role);
  const { t } = useI18n();

  const [branchId, setBranchId] = useState('');
  const [courseId, setCourseId] = useState('all');
  const [year, setYear] = useState('');
  const [month, setMonth] = useState('');
  const [status, setStatus] = useState<'all' | PaymentStatus>('all');
  const [search, setSearch] = useState('');
  const [debtorsPage, setDebtorsPage] = useState(1);

  const resetDebtorsPage = () => setDebtorsPage(1);
  const setBranchFilter = (value: string) => {
    setBranchId(value);
    resetDebtorsPage();
  };
  const setCourseFilter = (value: string) => {
    setCourseId(value);
    resetDebtorsPage();
  };
  const setYearFilter = (value: string) => {
    setYear(value);
    resetDebtorsPage();
  };
  const setMonthFilter = (value: string) => {
    setMonth(value);
    resetDebtorsPage();
  };
  const setStatusFilter = (value: 'all' | PaymentStatus) => {
    setStatus(value);
    resetDebtorsPage();
  };
  const setSearchFilter = (value: string) => {
    setSearch(value);
    resetDebtorsPage();
  };

  const financeFilters = useMemo(() => ({
    branchId: branchId || undefined,
    courseId: courseId === 'all' ? undefined : courseId,
    year: parseOptionalNumber(year),
    month: parseOptionalNumber(month),
    status: status === 'all' ? undefined : status,
  }), [branchId, courseId, month, status, year]);

  const dashboardQuery = useQuery({
    queryKey: ['dashboard', 'summary', user?.role],
    queryFn: async () => {
      const isStudent = user?.role === 'student';
      const [grades, attendance, payments] = isStudent
        ? await Promise.all([
            gradesApi.getMine().catch(() => []),
            attendanceApi.getMine().catch(() => []),
            paymentsApi.getMine().catch(() => []),
          ])
        : [[], [], []];
      const [users, courses, groups, schedule] = await Promise.all([
        usersApi.getAll().catch(() => []),
        coursesApi.getAll().catch(() => []),
        groupsApi.getAll().catch(() => []),
        scheduleApi.getAll().catch(() => []),
      ]);
      return { users, courses, groups, schedule, grades, attendance, payments };
    },
    enabled: !!user,
  });

  const financeOptionsQuery = useQuery({
    queryKey: ['dashboard', 'finance-filter-options', user?.role],
    queryFn: async () => {
      const [filterCourses, branches] = await Promise.all([
        coursesApi.getAll(),
        branchesApi.getAll(),
      ]);

      return { branchOptions: branches, courseOptions: filterCourses };
    },
    enabled: !!user && capabilities.dashboard.finance,
  });

  const financeSummaryQuery = useQuery({
    queryKey: ['payments', 'reports', 'summary', financeFilters],
    queryFn: () => paymentsApi.getPaymentReportsSummary(financeFilters),
    enabled: !!user && capabilities.dashboard.finance,
  });

  const debtorsQuery = useQuery({
    queryKey: ['payments', 'reports', 'debtors', financeFilters, search, debtorsPage],
    queryFn: () => paymentsApi.getPaymentDebtors({
      ...financeFilters,
      search: search.trim() || undefined,
      page: debtorsPage,
      limit: debtorsPageSize,
    }),
    enabled: !!user && capabilities.dashboard.finance,
  });

  if (dashboardQuery.isLoading) return <LoadingState label={t('common.loading')} />;
  if (dashboardQuery.error) return <ErrorState description={dashboardQuery.error.message} onRetry={() => void dashboardQuery.refetch()} />;
  if (!dashboardQuery.data) return <EmptyState title={t('dashboard.noDataTitle')} description={t('dashboard.noDataDescription')} />;

  const { users, courses, groups, schedule } = dashboardQuery.data;
  const financeSummary = financeSummaryQuery.data;
  const financeOptions = financeOptionsQuery.data;
  const branchOptions = financeOptions?.branchOptions ?? [];
  const courseOptions = financeOptions?.courseOptions ?? courses;
  const financeOptionsLoading = financeOptionsQuery.isLoading;
  const financeOptionsError = financeOptionsQuery.error;
  const financeLoading = financeSummaryQuery.isLoading || debtorsQuery.isLoading;
  const financeError = financeSummaryQuery.error ?? debtorsQuery.error;
  const debtors = debtorsQuery.data?.items ?? [];
  const debtorsPagination = debtorsQuery.data?.pagination;
  const statusLabels: Record<PaymentStatus, string> = {
    paid: t('paymentStatus.paid'),
    partial: t('paymentStatus.partial'),
    debt: t('paymentStatus.debt'),
    pending: t('paymentStatus.pending'),
    frozen: t('paymentStatus.frozen'),
    overpaid: t('paymentStatus.overpaid'),
  };
  const selectedBranch = branchOptions.find(item => item.id === branchId);
  const selectedCourse = courseOptions.find(item => item.id === courseId);
  const branchNameById = new Map(branchOptions.map(item => [item.id, item.name || item.id]));
  const activeFinanceFilters = [
    ...(branchId ? [t('finance.filterBranch', { branchId: selectedBranch?.name || branchId })] : []),
    ...(selectedCourse ? [t('payments.filterCourse', { course: selectedCourse.name || selectedCourse.id })] : []),
    ...(year ? [t('finance.filterYear', { year })] : []),
    ...(month ? [t('finance.filterMonth', { month })] : []),
    ...(status !== 'all' ? [t('payments.filterStatus', { status: statusLabels[status] })] : []),
  ];

  const debtorColumns: Column<PaymentDebtor>[] = [
    {
      key: 'student',
      header: t('finance.student'),
      className: 'data-table__cell--primary',
      cell: item => (
        <div className="cell-stack cell-stack--primary">
          <span className="cell-title">{item.studentNumber || '-'}</span>
          <span className="cell-meta">{item.studentName || '-'}</span>
        </div>
      ),
    },
    {
      key: 'contact',
      header: t('finance.contact'),
      cell: item => (
        <div className="cell-stack">
          <span>{item.phone || '-'}</span>
          <span className="cell-meta">{item.parentPhone || '-'}</span>
        </div>
      ),
    },
    {
      key: 'course',
      header: t('academic.course'),
      cell: item => (
        <div className="cell-stack">
          <span>{item.courseName || '-'}</span>
          <span className="cell-meta">{item.groupName || '-'}</span>
        </div>
      ),
    },
    {
      key: 'branch',
      header: t('finance.branch'),
      cell: item => item.branchName ?? (item.branchId ? branchNameById.get(item.branchId) : undefined) ?? '-',
    },
    {
      key: 'amounts',
      header: t('finance.amounts'),
      cell: item => (
        <div className="cell-stack cell-stack--amount">
          <span>{t('finance.expectedAmount')}: {formatMoney(item.expectedAmount)}</span>
          <span>{t('finance.paidAmount')}: {formatMoney(item.paidAmount)}</span>
          <span>{t('finance.remainingAmount')}: {formatMoney(item.remainingAmount)}</span>
        </div>
      ),
    },
    {
      key: 'status',
      header: t('common.status'),
      cell: item => <Badge tone={statusColorMap[item.status]}>{statusLabels[item.status]}</Badge>,
    },
    {
      key: 'dueDate',
      header: t('finance.dueDate'),
      cell: item => (
        <div className="cell-stack">
          <span>{formatDate(item.dueDate)}</span>
          <span className="cell-meta">{item.month}/{item.year}</span>
        </div>
      ),
    },
  ];

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
          <span className="subtle">{t('dashboard.metric.currentCourses')}</span>
        </Card>
        <Card className="metric-card">
          <span className="subtle">{t('dashboard.metric.groups')}</span>
          <strong>{groups.length}</strong>
          <span className="subtle">{t('dashboard.metric.activeGroups')}</span>
        </Card>
        <Card className="metric-card">
          <span className="subtle">{t('dashboard.metric.payments')}</span>
          <strong>{financeSummary ? formatMoney(financeSummary.totalPaidAmount) : '-'}</strong>
          <span className="subtle">{capabilities.dashboard.finance ? t('finance.backendReports') : t('dashboard.metric.notAvailableForTeachers')}</span>
        </Card>
      </div>

      {capabilities.dashboard.finance ? (
        <Card>
          <TableToolbar
            search={search}
            onSearchChange={setSearchFilter}
            searchPlaceholder={t('finance.searchDebtors')}
            activeFilters={activeFinanceFilters}
            resultsLabel={t('finance.debtorsCount', { count: debtorsPagination?.total ?? debtors.length })}
            filters={(
              <>
                <Select
                  value={branchId}
                  onChange={event => setBranchFilter(event.target.value)}
                  aria-label={t('finance.branch')}
                  disabled={financeOptionsLoading || !!financeOptionsError}
                >
                  <option value="">{t('finance.allBranches')}</option>
                  {financeOptionsLoading ? <option value="" disabled>{t('common.loading')}</option> : null}
                  {financeOptionsError ? <option value="" disabled>{t('finance.filtersLoadFailed')}</option> : null}
                  {!financeOptionsLoading && !financeOptionsError && branchOptions.length === 0 ? (
                    <option value="" disabled>{t('branches.noBranchesFound')}</option>
                  ) : null}
                  {branchOptions.map(item => <option key={item.id} value={item.id}>{item.name || item.id}</option>)}
                </Select>
                <Select value={courseId} onChange={event => setCourseFilter(event.target.value)} aria-label={t('academic.course')}>
                  <option value="all">{t('finance.allCourses')}</option>
                  {financeOptionsLoading ? <option value="all" disabled>{t('common.loading')}</option> : null}
                  {financeOptionsError ? <option value="all" disabled>{t('finance.filtersLoadFailed')}</option> : null}
                  {!financeOptionsLoading && !financeOptionsError && courseOptions.length === 0 ? (
                    <option value="all" disabled>{t('common.noOptionsAvailable')}</option>
                  ) : null}
                  {courseOptions.map(item => <option key={item.id} value={item.id}>{item.name || item.id}</option>)}
                </Select>
                <Input
                  value={year}
                  onChange={event => setYearFilter(event.target.value)}
                  inputMode="numeric"
                  placeholder={t('finance.yearPlaceholder')}
                  aria-label={t('finance.year')}
                />
                <Input
                  value={month}
                  onChange={event => setMonthFilter(event.target.value)}
                  inputMode="numeric"
                  placeholder={t('finance.monthPlaceholder')}
                  aria-label={t('finance.month')}
                />
                <Select value={status} onChange={event => setStatusFilter(event.target.value as 'all' | PaymentStatus)} aria-label={t('common.status')}>
                  <option value="all">{t('payments.allStatuses')}</option>
                  <option value="pending">{statusLabels.pending}</option>
                  <option value="partial">{statusLabels.partial}</option>
                  <option value="debt">{statusLabels.debt}</option>
                  <option value="paid">{statusLabels.paid}</option>
                  <option value="frozen">{statusLabels.frozen}</option>
                  <option value="overpaid">{statusLabels.overpaid}</option>
                </Select>
              </>
            )}
          />

          {financeError ? (
            <ErrorState description={financeError.message} onRetry={() => {
              void financeSummaryQuery.refetch();
              void debtorsQuery.refetch();
            }} />
          ) : financeLoading ? (
            <LoadingState label={t('finance.loading')} />
          ) : (
            <>
              <div className="dashboard-grid">
                <Card className="metric-card">
                  <span className="subtle">{t('finance.totalExpected')}</span>
                  <strong>{formatMoney(financeSummary?.totalExpectedAmount)}</strong>
                  <span className="subtle">{t('finance.totalPaymentsCount', { count: financeSummary?.totalPaymentsCount ?? 0 })}</span>
                </Card>
                <Card className="metric-card">
                  <span className="subtle">{t('finance.totalPaid')}</span>
                  <strong>{formatMoney(financeSummary?.totalPaidAmount)}</strong>
                  <span className="subtle">{t('finance.paidCount', { count: financeSummary?.paidCount ?? 0 })}</span>
                </Card>
                <Card className="metric-card">
                  <span className="subtle">{t('finance.totalRemaining')}</span>
                  <strong>{formatMoney(financeSummary?.totalRemainingAmount)}</strong>
                  <span className="subtle">{t('finance.partialPendingCount', {
                    partial: financeSummary?.partialCount ?? 0,
                    pending: financeSummary?.pendingCount ?? 0,
                  })}</span>
                </Card>
                <Card className="metric-card">
                  <span className="subtle">{t('finance.totalDebt')}</span>
                  <strong>{formatMoney(financeSummary?.totalDebtAmount)}</strong>
                  <span className="subtle">{t('finance.debtFrozenOverpaidCount', {
                    debt: financeSummary?.debtCount ?? 0,
                    frozen: financeSummary?.frozenCount ?? 0,
                    overpaid: financeSummary?.overpaidCount ?? 0,
                  })}</span>
                </Card>
              </div>

              <TableShell
                title={t('finance.debtors')}
                description={t('finance.debtorsDescription')}
                actions={debtorsPagination ? (
                  <Pagination
                    page={debtorsPagination.page}
                    totalPages={debtorsPagination.totalPages}
                    onChange={setDebtorsPage}
                  />
                ) : undefined}
              >
                <DataTable
                  columns={debtorColumns}
                  rows={debtors}
                  getRowKey={item => item.paymentId}
                  emptyTitle={t('finance.noDebtorsFound')}
                  emptyDescription={t('common.tryAnotherSearch')}
                />
              </TableShell>
            </>
          )}
        </Card>
      ) : null}

      <div className="ops-layout">
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
