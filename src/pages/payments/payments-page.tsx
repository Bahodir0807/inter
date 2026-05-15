import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { coursesApi } from '../../entities/course/api';
import { Payment, paymentsApi, PaymentFormValues, PaymentStatus } from '../../entities/payment/api';
import { usersApi } from '../../entities/user/api';
import { useAuthStore } from '../../features/auth/model/auth-store';
import { paymentsManagerRoles } from '../../app/router/navigation';
import { PageLayout } from '../../widgets/page/page-layout';
import { LoadingState } from '../../shared/ui/feedback/loading-state';
import { ErrorState } from '../../shared/ui/feedback/error-state';
import { EmptyState } from '../../shared/ui/feedback/empty-state';
import { TableShell } from '../../shared/ui/data-display/table-shell';
import { DataTable, type Column } from '../../shared/ui/data-display/data-table';
import { Badge } from '../../shared/ui/badges/badge';
import { Card } from '../../shared/ui/surfaces/card';
import { formatDate, formatMoney } from '../../shared/lib/date';
import { TableToolbar } from '../../shared/ui/data-display/table-toolbar';
import { Pagination } from '../../shared/ui/data-display/pagination';
import { Select } from '../../shared/ui/forms/select';
import { Button } from '../../shared/ui/buttons/button';
import { getCourseDisplayName, getUserDisplayName } from '../../shared/lib/entity-display';
import { SortDirection } from '../../shared/lib/table';
import { toast } from '../../shared/ui/feedback/toaster';
import { PaymentFormModal } from './payment-form-modal';
import { ConfirmModal } from '../../shared/ui/overlay/confirm-modal';
import { useDebouncedValue } from '../../shared/hooks/use-debounced-value';
import { useUrlState } from '../../shared/hooks/use-url-state';
import { useI18n } from '../../shared/i18n/i18n';

const pageSize = 8;
const statusToneMap: Record<PaymentStatus, 'success' | 'warning' | 'danger'> = {
  confirmed: 'success',
  pending: 'warning',
  cancelled: 'danger',
};
function getPaymentCourse(payment: Payment) {
  return payment.course ?? payment.courseId;
}

export function PaymentsPage() {
  const queryClient = useQueryClient();
  const { t } = useI18n();
  const user = useAuthStore(state => state.user);
  const isAdminLike = !!user && paymentsManagerRoles.includes(user.role);
  const urlState = useUrlState();

  const [search, setSearchState] = useState(urlState.getString('search'));
  const [studentFilter, setStudentFilterState] = useState<'all' | string>(urlState.getString('student', 'all'));
  const [courseFilter, setCourseFilterState] = useState<'all' | string>(urlState.getString('course', 'all'));
  const [statusFilter, setStatusFilterState] = useState<'all' | PaymentStatus>(urlState.getString('status', 'all') as 'all' | PaymentStatus);
  const [sortDirection, setSortDirectionState] = useState<SortDirection>(urlState.getString('sort', 'desc') as SortDirection);
  const [page, setPageState] = useState(urlState.getNumber('page', 1));
  const debouncedSearch = useDebouncedValue(search);
  const [formOpen, setFormOpen] = useState(false);
  const [confirmCandidate, setConfirmCandidate] = useState<Payment | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<Payment | null>(null);

  const setPage = (value: number) => {
    setPageState(value);
    urlState.setValue('page', value > 1 ? value : undefined);
  };
  const setSearch = (value: string) => {
    setSearchState(value);
    setPageState(1);
    urlState.setValues({ search: value || undefined, page: undefined });
  };
  const setStudentFilter = (value: string) => {
    setStudentFilterState(value);
    setPageState(1);
    urlState.setValues({ student: value === 'all' ? undefined : value, page: undefined });
  };
  const setCourseFilter = (value: string) => {
    setCourseFilterState(value);
    setPageState(1);
    urlState.setValues({ course: value === 'all' ? undefined : value, page: undefined });
  };
  const setStatusFilter = (value: 'all' | PaymentStatus) => {
    setStatusFilterState(value);
    setPageState(1);
    urlState.setValues({ status: value === 'all' ? undefined : value, page: undefined });
  };
  const setSortDirection = (value: SortDirection) => {
    setSortDirectionState(value);
    setPageState(1);
    urlState.setValues({ sort: value === 'desc' ? undefined : value, page: undefined });
  };

  const paymentParams = useMemo(() => ({
    page,
    limit: pageSize,
    search: debouncedSearch || undefined,
    studentId: isAdminLike && studentFilter !== 'all' ? studentFilter : undefined,
    courseId: isAdminLike && courseFilter !== 'all' ? courseFilter : undefined,
    status: statusFilter === 'all' ? undefined : statusFilter,
    sortBy: 'paidAt',
    sortOrder: sortDirection,
  }), [courseFilter, debouncedSearch, isAdminLike, page, sortDirection, statusFilter, studentFilter]);

  const paymentsQuery = useQuery({
    queryKey: ['payments', isAdminLike ? 'all' : 'me', paymentParams],
    queryFn: () => (isAdminLike ? paymentsApi.getAllPage(paymentParams) : paymentsApi.getMinePage(paymentParams)),
    enabled: !!user,
  });

  const supportQuery = useQuery({
    queryKey: ['payments-support'],
    queryFn: async () => {
      const [students, courses] = await Promise.all([usersApi.getStudents(), coursesApi.getAll()]);
      return { students, courses };
    },
    enabled: isAdminLike,
  });

  const createMutation = useMutation({
    mutationFn: (payload: PaymentFormValues) => paymentsApi.create(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['payments'] });
      toast.success(t('payments.created'));
      setFormOpen(false);
    },
    onError: error => toast.error(error.message),
  });

  const confirmMutation = useMutation({
    mutationFn: (id: string) => paymentsApi.confirm(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['payments'] });
      toast.success(t('payments.confirmed'));
    },
    onError: error => toast.error(error.message),
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => paymentsApi.remove(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['payments'] });
      toast.success(t('payments.deleted'));
    },
    onError: error => toast.error(error.message),
  });

  const payments = paymentsQuery.data?.items ?? [];
  const pagination = paymentsQuery.data?.pagination;
  const students = supportQuery.data?.students ?? [];
  const courses = supportQuery.data?.courses ?? [];
  const supportUnavailable = isAdminLike && !!supportQuery.error;
  const supportLoading = isAdminLike && supportQuery.isLoading;

  const selectedStudentLabel =
    studentFilter === 'all' ? '' : getUserDisplayName(students.find(student => student.id === studentFilter));
  const selectedCourseLabel =
    courseFilter === 'all' ? '' : getCourseDisplayName(courses.find(course => course.id === courseFilter));

  const toolbarFilters = [
    ...(isAdminLike && studentFilter !== 'all' ? [t('payments.filterStudent', { student: selectedStudentLabel })] : []),
    ...(isAdminLike && courseFilter !== 'all' ? [t('payments.filterCourse', { course: selectedCourseLabel })] : []),
    ...(statusFilter !== 'all' ? [t('payments.filterStatus', { status: t(`paymentStatus.${statusFilter}`) })] : []),
    ...(sortDirection === 'asc' ? [t('payments.orderOldestFirst')] : []),
  ];

  if (paymentsQuery.isLoading) {
    return <LoadingState label={t('payments.loading')} />;
  }

  if (paymentsQuery.error) {
    return <ErrorState description={paymentsQuery.error.message} onRetry={() => void paymentsQuery.refetch()} />;
  }

  const confirmedPayments = payments.filter(item => item.status === 'confirmed').length;
  const columns: Column<Payment>[] = [
    {
      key: 'payment',
      header: t('payments.payment'),
      className: 'data-table__cell--primary',
      cell: item => (
        <div className="cell-stack cell-stack--primary cell-stack--relation">
          <span className="cell-title">{formatMoney(item.amount)}</span>
          <span className="cell-meta cell-meta--strong">{formatDate(item.paidAt)}</span>
          <div className="cell-badges">
            <Badge tone={statusToneMap[item.status]}>
              {t(`paymentStatus.${item.status}`)}
            </Badge>
          </div>
        </div>
      ),
    },
    ...(isAdminLike
      ? [
          {
            key: 'student',
            header: t('academic.student'),
            className: 'data-table__cell--relation',
            cell: (item: Payment) => (
              <div className="cell-stack cell-stack--relation">
                <span className="cell-title">{getUserDisplayName(item.student)}</span>
                <span className="cell-meta">{t('payments.linkedPayer')}</span>
              </div>
            ),
          },
        ]
      : []),
    {
      key: 'course',
      header: t('dashboard.table.course'),
      className: 'data-table__cell--relation',
      cell: item => (
        <div className="cell-stack cell-stack--relation">
          <span className="cell-title">{getCourseDisplayName(getPaymentCourse(item))}</span>
          <span className="cell-meta">{isAdminLike ? t('payments.linkedOffer') : t('payments.coveredCourse')}</span>
        </div>
      ),
    },
    ...(isAdminLike
      ? [
          {
            key: 'actions',
            header: t('common.actions'),
            className: 'data-table__cell--actions',
            headClassName: 'data-table__head--actions',
            cell: (item: Payment) => (
              <div className="row-actions">
                {item.status === 'pending' && (
                  <>
                    <Button size="sm" variant="secondary" onClick={() => setConfirmCandidate(item)}>
                      {t('common.confirm')}
                    </Button>
                    <Button size="sm" variant="danger" onClick={() => setDeleteCandidate(item)}>
                      {t('common.delete')}
                    </Button>
                  </>
                )}
                {item.status === 'cancelled' && (
                  <Button size="sm" variant="ghost" disabled>
                    {t('paymentStatus.cancelled')}
                  </Button>
                )}
                {item.status === 'confirmed' && (
                  <Button size="sm" variant="ghost" disabled>
                    {t('paymentStatus.confirmed')}
                  </Button>
                )}
              </div>
            ),
          },
        ]
      : []),
  ];

  return (
    <PageLayout
      eyebrow={t('payments.eyebrow')}
      title={t('payments.title')}
      description={
        isAdminLike
          ? t('payments.description.admin')
          : t('payments.description.student')
      }
      actions={isAdminLike ? (
        <Button onClick={() => setFormOpen(true)} disabled={supportLoading || supportUnavailable}>
          {supportLoading ? t('common.loading') : t('payments.newPayment')}
        </Button>
      ) : undefined}
    >
      {supportUnavailable ? (
        <ErrorState
          title={t('payments.supportLoadFailedTitle', 'Payment form data could not be loaded')}
          description={supportQuery.error.message}
          onRetry={() => void supportQuery.refetch()}
        />
      ) : null}
      <div className="dashboard-grid">
        <Card className="metric-card">
          <span className="subtle">{t('payments.visiblePayments')}</span>
          <strong>{pagination?.total ?? payments.length}</strong>
          <span className="subtle">{t('users.afterFilters')}</span>
        </Card>
        <Card className="metric-card">
          <span className="subtle">{t('dashboard.metric.confirmed')}</span>
          <strong>{confirmedPayments}</strong>
          <span className="subtle">{t('payments.markedVerified')}</span>
        </Card>
      </div>
      {payments.length === 0 ? (
        <EmptyState
          title={t('dashboard.noPaymentsYet')}
          description={
            isAdminLike
              ? t('payments.recordsAppearAdmin')
              : t('payments.recordsAppearStudent')
          }
        />
      ) : (
        <TableShell
          title={t('payments.ledgerTitle')}
          description={isAdminLike ? t('payments.ledgerDescription.admin') : t('payments.ledgerDescription.student')}
          actions={<Pagination page={pagination?.page ?? page} totalPages={pagination?.totalPages ?? 1} onChange={setPage} />}
        >
          <TableToolbar
            search={search}
            onSearchChange={value => {
              setSearch(value);
            }}
            searchPlaceholder={isAdminLike ? t('payments.searchPlaceholder.admin') : t('payments.searchPlaceholder.student')}
            resultsLabel={t('common.resultsLabel', { count: pagination?.total ?? payments.length })}
            activeFilters={toolbarFilters}
            filters={
              isAdminLike ? (
                <>
                  <Select
                    aria-label={t('payments.filterByStudent')}
                    value={studentFilter}
                    onChange={event => {
                      setStudentFilter(event.target.value);
                    }}
                  >
                    <option value="all">{t('payments.allStudents')}</option>
                    {students.map(student => (
                      <option key={student.id} value={student.id}>
                        {getUserDisplayName(student)}
                      </option>
                    ))}
                  </Select>
                  <Select
                    aria-label={t('payments.filterByStatus')}
                    value={statusFilter}
                    onChange={event => {
                      setStatusFilter(event.target.value as 'all' | PaymentStatus);
                    }}
                  >
                    <option value="all">{t('payments.allStatuses')}</option>
                    <option value="pending">{t('paymentStatus.pending')}</option>
                    <option value="confirmed">{t('paymentStatus.confirmed')}</option>
                    <option value="cancelled">{t('paymentStatus.cancelled')}</option>
                  </Select>
                  <Select
                    aria-label={t('payments.filterByCourse')}
                    value={courseFilter}
                    onChange={event => {
                      setCourseFilter(event.target.value);
                    }}
                  >
                    <option value="all">{t('payments.allCourses')}</option>
                    {courses.map(course => (
                      <option key={course.id} value={course.id}>
                        {getCourseDisplayName(course)}
                      </option>
                    ))}
                  </Select>
                  <Select
                    aria-label={t('payments.sortPayments')}
                    value={sortDirection}
                    onChange={event => {
                      setSortDirection(event.target.value as SortDirection);
                    }}
                  >
                    <option value="desc">{t('payments.newestFirst')}</option>
                    <option value="asc">{t('payments.oldestFirst')}</option>
                  </Select>
                </>
              ) : (
                <Select
                  aria-label={t('payments.sortPayments')}
                  value={sortDirection}
                  onChange={event => {
                    setSortDirection(event.target.value as SortDirection);
                  }}
                >
                  <option value="desc">{t('payments.newestFirst')}</option>
                  <option value="asc">{t('payments.oldestFirst')}</option>
                </Select>
              )
            }
          />
          <DataTable
            getRowKey={item => item.id}
            emptyTitle={t('payments.noPaymentsFound')}
            emptyDescription={isAdminLike ? t('common.tryAnotherSearch') : t('common.trySearch')}
            columns={columns}
            rows={payments}
          />
        </TableShell>
      )}

      <PaymentFormModal
        open={formOpen}
        students={students}
        courses={courses}
        loading={createMutation.isPending || supportLoading}
        onClose={() => setFormOpen(false)}
        onSubmit={async values => {
          await createMutation.mutateAsync(values);
        }}
      />
      <ConfirmModal
        open={!!confirmCandidate}
        title={t('payments.confirmPaymentTitle')}
        description={
          confirmCandidate
            ? t('payments.confirmPaymentDescription', { amount: formatMoney(confirmCandidate.amount), student: getUserDisplayName(confirmCandidate.student), course: getCourseDisplayName(getPaymentCourse(confirmCandidate)) })
            : ''
        }
        confirmLabel={t('payments.confirmPaymentConfirm')}
        cancelLabel={t('payments.keepPending')}
        loading={confirmMutation.isPending}
        onClose={() => setConfirmCandidate(null)}
        onConfirm={async () => {
          if (!confirmCandidate) {
            return;
          }

          await confirmMutation.mutateAsync(confirmCandidate.id);
          setConfirmCandidate(null);
        }}
      />
      <ConfirmModal
        open={!!deleteCandidate}
        title={t('payments.deletePaymentTitle')}
        description={
          deleteCandidate
            ? t('payments.deletePaymentDescription', { amount: formatMoney(deleteCandidate.amount), student: getUserDisplayName(deleteCandidate.student), course: getCourseDisplayName(getPaymentCourse(deleteCandidate)), paidAt: formatDate(deleteCandidate.paidAt) })
            : ''
        }
        confirmLabel={t('payments.deletePaymentConfirm')}
        cancelLabel={t('payments.keepPayment')}
        tone="danger"
        loading={removeMutation.isPending}
        onClose={() => setDeleteCandidate(null)}
        onConfirm={async () => {
          if (!deleteCandidate) {
            return;
          }

          await removeMutation.mutateAsync(deleteCandidate.id);
          setDeleteCandidate(null);
        }}
      />
    </PageLayout>
  );
}
