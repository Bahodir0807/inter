import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { coursesApi } from '../../entities/course/api';
import { AddPaymentFormValues, CreatePaymentFormValues, Payment, PaymentStatus, paymentsApi } from '../../entities/payment/api';
import { groupsApi } from '../../entities/group/api';
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
import { formatMoney } from '../../shared/lib/date';
import { TableToolbar } from '../../shared/ui/data-display/table-toolbar';
import { Pagination } from '../../shared/ui/data-display/pagination';
import { Select } from '../../shared/ui/forms/select';
import { Button } from '../../shared/ui/buttons/button';
import { getCourseDisplayName, getGroupDisplayName, getUserDisplayName } from '../../shared/lib/entity-display';
import { SortDirection } from '../../shared/lib/table';
import { toast } from '../../shared/ui/feedback/toaster';
import { PaymentFormModal } from './payment-form-modal';
import { PaymentDetailModal } from './payment-detail-modal';
import { AddPaymentModal } from './add-payment-modal';
import { ConfirmModal } from '../../shared/ui/overlay/confirm-modal';
import { useUrlState } from '../../shared/hooks/use-url-state';
import { useI18n } from '../../shared/i18n/i18n';

const pageSize = 10;

const statusColorMap: Record<PaymentStatus, 'success' | 'warning' | 'danger' | 'neutral' | 'info'> = {
  paid: 'success',
  partial: 'warning',
  debt: 'danger',
  pending: 'warning',
  frozen: 'neutral',
  overpaid: 'info',
};

const statusLabels: Record<PaymentStatus, string> = {
  paid: 'Оплачено',
  partial: 'Частично',
  debt: 'Долг',
  pending: 'Ожидание',
  frozen: 'Заморожено',
  overpaid: 'Переплата',
};

export function PaymentsPage() {
  const queryClient = useQueryClient();
  const { t } = useI18n();
  const user = useAuthStore(state => state.user);
  const isAdminLike = !!user && paymentsManagerRoles.includes(user.role as 'owner');
  const canManagePayments = user?.role === 'owner';
  const urlState = useUrlState();

  const [search, setSearchState] = useState(urlState.getString('search'));
  const [studentFilter, setStudentFilterState] = useState<'all' | string>(urlState.getString('student', 'all'));
  const [statusFilter, setStatusFilterState] = useState<'all' | PaymentStatus>(urlState.getString('status', 'all') as 'all' | PaymentStatus);
  const [sortDirection, setSortDirectionState] = useState<SortDirection>(urlState.getString('sort', 'desc') as SortDirection);
  const [page, setPageState] = useState(urlState.getNumber('page', 1));
  const [formOpen, setFormOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState<Payment | null>(null);
  const [addPaymentOpen, setAddPaymentOpen] = useState<Payment | null>(null);
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

  const paymentParams = useMemo(
    () => ({
      page,
      limit: pageSize,
      studentId: isAdminLike && studentFilter !== 'all' ? studentFilter : undefined,
      status: statusFilter === 'all' ? undefined : statusFilter,
      sortBy: 'paymentPeriod',
      sortOrder: sortDirection,
    }),
    [isAdminLike, page, sortDirection, statusFilter, studentFilter],
  );

  const paymentsQuery = useQuery({
    queryKey: ['payments', isAdminLike ? 'all' : 'me', paymentParams],
    queryFn: () => (isAdminLike ? paymentsApi.getAllPage(paymentParams) : paymentsApi.getMinePage(paymentParams)),
    enabled: !!user,
  });

  const supportQuery = useQuery({
    queryKey: ['payments-support'],
    queryFn: async () => {
      const [students, courses, groups] = await Promise.all([usersApi.getStudents(), coursesApi.getAll(), groupsApi.getAll()]);
      return { students, courses, groups };
    },
    enabled: isAdminLike,
  });

  const createMutation = useMutation({
    mutationFn: (payload: CreatePaymentFormValues) => paymentsApi.create(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['payments'] });
      toast.success(t('payments.created'));
      setFormOpen(false);
    },
    onError: error => toast.error(error.message),
  });
  const addPaymentMutation = useMutation({
    mutationFn: (values: { id: string; payload: AddPaymentFormValues }) => paymentsApi.addPayment(values.id, values.payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['payments'] });
      toast.success(t('payments.paymentAdded'));
      setAddPaymentOpen(null);
    },
    onError: error => toast.error(error.message),
  });
  const freezeMutation = useMutation({
    mutationFn: (values: { id: string; reason: string }) => paymentsApi.freeze(values.id, values.reason),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['payments'] });
      toast.success(t('payments.paymentFrozen'));
    },
    onError: error => toast.error(error.message),
  });
  const unfreezeMutation = useMutation({
    mutationFn: (id: string) => paymentsApi.unfreeze(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['payments'] });
      toast.success(t('payments.paymentUnfrozen'));
    },
    onError: error => toast.error(error.message),
  });
  const removeMutation = useMutation({
    mutationFn: (id: string) => paymentsApi.remove(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['payments'] });
      toast.success(t('payments.deleted'));
      setDeleteCandidate(null);
    },
    onError: error => toast.error(error.message),
  });

  const payments = paymentsQuery.data?.items ?? [];
  const pagination = paymentsQuery.data?.pagination;
  const students = supportQuery.data?.students ?? [];
  const courses = supportQuery.data?.courses ?? [];
  const groups = supportQuery.data?.groups ?? [];
  const selectedStudent = students.find(s => s.id === studentFilter);
  const toolbarFilters = [
    ...(isAdminLike && studentFilter !== 'all' ? [t('payments.filterStudent', { student: getUserDisplayName(selectedStudent) })] : []),
    ...(statusFilter !== 'all' ? [statusLabels[statusFilter]] : []),
    ...(sortDirection === 'asc' ? [t('payments.orderOldestFirst')] : []),
  ];

  if (paymentsQuery.isLoading) return <LoadingState label={t('payments.loading')} />;
  if (paymentsQuery.error) return <ErrorState description={paymentsQuery.error.message} onRetry={() => void paymentsQuery.refetch()} />;
  if (payments.length === 0) {
    return (
      <PageLayout title={t('payments.title')} description={t('payments.description.admin')}>
        <EmptyState title={t('payments.noPaymentsFound')} description={t('payments.empty')} />
      </PageLayout>
    );
  }

  const columns: Column<Payment>[] = [
    {
      key: 'period',
      header: t('payments.period'),
      className: 'data-table__cell--primary',
      cell: item => (
        <div className="cell-stack cell-stack--primary">
          <span className="cell-title">{item.paymentPeriod}</span>
          <span className="cell-meta">{item.month}/{item.year}</span>
        </div>
      ),
    },
    ...(isAdminLike ? [{
      key: 'student',
      header: t('academic.student'),
      className: 'data-table__cell--relation',
      cell: (item: Payment) => <span>{getUserDisplayName(students.find(s => s.id === item.studentId))}</span>,
    } satisfies Column<Payment>] : []),
    {
      key: 'course',
      header: t('academic.course'),
      className: 'data-table__cell--relation',
      cell: item => (
        <div className="cell-stack cell-stack--relation">
          <span className="cell-title">{getCourseDisplayName(courses.find(c => c.id === item.courseId))}</span>
          <span className="cell-meta">{getGroupDisplayName(groups.find(g => g.id === item.groupId))}</span>
        </div>
      ),
    },
    {
      key: 'amounts',
      header: t('payments.amounts'),
      cell: item => (
        <div className="cell-stack cell-stack--amount">
          <span>Ожидается: {formatMoney(item.expectedAmount)}</span>
          <span>Оплачено: {formatMoney(item.paidAmount)}</span>
          <span>Осталось: {formatMoney(item.remainingAmount)}</span>
          {item.overpaidAmount > 0 ? <span>Переплата: {formatMoney(item.overpaidAmount)}</span> : null}
        </div>
      ),
    },
    {
      key: 'status',
      header: t('payments.status'),
      cell: item => (
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
          <Badge tone={statusColorMap[item.status]}>{statusLabels[item.status]}</Badge>
          {item.isFrozen ? <Badge tone="neutral">Заморожено</Badge> : null}
        </div>
      ),
    },
    {
      key: 'actions',
      header: t('common.actions'),
      className: 'data-table__cell--actions',
      cell: item => (
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button size="sm" variant="secondary" onClick={() => setDetailOpen(item)}>{t('common.view')}</Button>
          {canManagePayments && item.status !== 'paid' && !item.isFrozen ? (
            <Button size="sm" onClick={() => setAddPaymentOpen(item)}>+</Button>
          ) : null}
          {canManagePayments && !item.isFrozen ? (
            <Button size="sm" variant="secondary" onClick={() => setDeleteCandidate(item)}>{t('common.delete')}</Button>
          ) : null}
        </div>
      ),
    },
  ];

  return (
    <PageLayout title={t('payments.title')} description={t('payments.description.admin')}>
      <Card>
        <TableToolbar
          search={search}
          onSearchChange={setSearch}
          activeFilters={toolbarFilters}
          filters={isAdminLike ? (
            <>
              <Select value={studentFilter} onChange={event => setStudentFilter(event.target.value)}>
                <option value="all">{t('common.all')}</option>
                {students.map(s => <option key={s.id} value={s.id}>{getUserDisplayName(s)}</option>)}
              </Select>
              <Select value={statusFilter} onChange={event => setStatusFilter(event.target.value as 'all' | PaymentStatus)}>
                <option value="all">{t('common.all')}</option>
                {Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </Select>
              <Select value={sortDirection} onChange={event => setSortDirection(event.target.value as SortDirection)}>
                <option value="desc">{t('payments.newestFirst')}</option>
                <option value="asc">{t('payments.oldestFirst')}</option>
              </Select>
            </>
          ) : undefined}
          actions={canManagePayments ? <Button onClick={() => setFormOpen(true)}>{t('common.create')}</Button> : undefined}
        />

        <TableShell title={t('payments.ledgerTitle')} description={isAdminLike ? t('payments.ledgerDescription.admin') : t('payments.ledgerDescription.student')}>
          <DataTable columns={columns} rows={payments} />
        </TableShell>

        {pagination && pagination.total > pageSize ? (
          <Pagination
            page={page}
            totalPages={Math.max(1, Math.ceil(pagination.total / pageSize))}
            onChange={setPage}
          />
        ) : null}
      </Card>

      {formOpen ? (
        <PaymentFormModal
          students={students}
          courses={courses}
          groups={groups}
          onSubmit={values => createMutation.mutate(values)}
          onClose={() => setFormOpen(false)}
          isLoading={createMutation.isPending}
        />
      ) : null}

      {detailOpen ? (
        <PaymentDetailModal
          payment={detailOpen}
          onClose={() => setDetailOpen(null)}
          onFreeze={reason => freezeMutation.mutate({ id: detailOpen.id, reason })}
          onUnfreeze={() => unfreezeMutation.mutate(detailOpen.id)}
          canManage={canManagePayments}
          isFreezing={freezeMutation.isPending}
          isUnfreezing={unfreezeMutation.isPending}
        />
      ) : null}

      {addPaymentOpen ? (
        <AddPaymentModal
          payment={addPaymentOpen}
          onSubmit={values => addPaymentMutation.mutate({ id: addPaymentOpen.id, payload: values })}
          onClose={() => setAddPaymentOpen(null)}
          isLoading={addPaymentMutation.isPending}
        />
      ) : null}

      <ConfirmModal
        open={!!deleteCandidate}
        title={t('payments.deleteConfirmTitle')}
        description={t('payments.deleteConfirmDescription')}
        onConfirm={() => {
          if (deleteCandidate) {
            removeMutation.mutate(deleteCandidate.id);
          }
        }}
        onClose={() => setDeleteCandidate(null)}
        confirmLabel={t('common.delete')}
        loading={removeMutation.isPending}
        tone="danger"
      />
    </PageLayout>
  );
}
