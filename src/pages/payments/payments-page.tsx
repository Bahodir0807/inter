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

const pageSize = 8;
const statusToneMap: Record<PaymentStatus, 'success' | 'warning' | 'danger'> = {
  confirmed: 'success',
  pending: 'warning',
  cancelled: 'danger',
};
const statusLabelMap: Record<PaymentStatus, string> = {
  confirmed: 'Confirmed',
  pending: 'Pending',
  cancelled: 'Cancelled',
};

function getPaymentCourse(payment: Payment) {
  return payment.course ?? payment.courseId;
}

export function PaymentsPage() {
  const queryClient = useQueryClient();
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
      toast.success('Payment created');
      setFormOpen(false);
    },
    onError: error => toast.error(error.message),
  });

  const confirmMutation = useMutation({
    mutationFn: (id: string) => paymentsApi.confirm(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['payments'] });
      toast.success('Payment confirmed');
    },
    onError: error => toast.error(error.message),
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => paymentsApi.remove(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['payments'] });
      toast.success('Payment deleted');
    },
    onError: error => toast.error(error.message),
  });

  const payments = paymentsQuery.data?.items ?? [];
  const pagination = paymentsQuery.data?.pagination;
  const students = supportQuery.data?.students ?? [];
  const courses = supportQuery.data?.courses ?? [];

  const selectedStudentLabel =
    studentFilter === 'all' ? '' : getUserDisplayName(students.find(student => student.id === studentFilter));
  const selectedCourseLabel =
    courseFilter === 'all' ? '' : getCourseDisplayName(courses.find(course => course.id === courseFilter));

  const toolbarFilters = [
    ...(isAdminLike && studentFilter !== 'all' ? [`Student: ${selectedStudentLabel}`] : []),
    ...(isAdminLike && courseFilter !== 'all' ? [`Course: ${selectedCourseLabel}`] : []),
    ...(statusFilter !== 'all' ? [`Status: ${statusLabelMap[statusFilter]}`] : []),
    ...(sortDirection === 'asc' ? ['Order: Oldest first'] : []),
  ];

  if (paymentsQuery.isLoading) {
    return <LoadingState label="Loading payments..." />;
  }

  if (paymentsQuery.error) {
    return <ErrorState description={paymentsQuery.error.message} onRetry={() => void paymentsQuery.refetch()} />;
  }

  const confirmedPayments = payments.filter(item => item.status === 'confirmed').length;
  const columns: Column<Payment>[] = [
    {
      key: 'payment',
      header: 'Payment',
      className: 'data-table__cell--primary',
      cell: item => (
        <div className="cell-stack cell-stack--primary cell-stack--relation">
          <span className="cell-title">{formatMoney(item.amount)}</span>
          <span className="cell-meta cell-meta--strong">{formatDate(item.paidAt)}</span>
          <div className="cell-badges">
            <Badge tone={statusToneMap[item.status]}>
              {statusLabelMap[item.status]}
            </Badge>
          </div>
        </div>
      ),
    },
    ...(isAdminLike
      ? [
          {
            key: 'student',
            header: 'Student',
            className: 'data-table__cell--relation',
            cell: (item: Payment) => (
              <div className="cell-stack cell-stack--relation">
                <span className="cell-title">{getUserDisplayName(item.student)}</span>
                <span className="cell-meta">Linked payer</span>
              </div>
            ),
          },
        ]
      : []),
    {
      key: 'course',
      header: 'Course',
      className: 'data-table__cell--relation',
      cell: item => (
        <div className="cell-stack cell-stack--relation">
          <span className="cell-title">{getCourseDisplayName(getPaymentCourse(item))}</span>
          <span className="cell-meta">{isAdminLike ? 'Linked offer' : 'Covered course'}</span>
        </div>
      ),
    },
    ...(isAdminLike
      ? [
          {
            key: 'actions',
            header: 'Actions',
            className: 'data-table__cell--actions',
            headClassName: 'data-table__head--actions',
            cell: (item: Payment) => (
              <div className="row-actions">
                {item.status === 'pending' && (
                  <>
                    <Button size="sm" variant="secondary" onClick={() => setConfirmCandidate(item)}>
                      Confirm
                    </Button>
                    <Button size="sm" variant="danger" onClick={() => setDeleteCandidate(item)}>
                      Delete
                    </Button>
                  </>
                )}
                {item.status === 'cancelled' && (
                  <Button size="sm" variant="ghost" disabled>
                    Cancelled
                  </Button>
                )}
                {item.status === 'confirmed' && (
                  <Button size="sm" variant="ghost" disabled>
                    Confirmed
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
      eyebrow="Finance"
      title="Payments"
      description={
        isAdminLike
          ? 'Payments linked to students and courses.'
          : 'Your payments and confirmation status.'
      }
      actions={isAdminLike ? <Button onClick={() => setFormOpen(true)}>New payment</Button> : undefined}
    >
      <div className="dashboard-grid">
        <Card className="metric-card">
          <span className="subtle">Visible payments</span>
          <strong>{pagination?.total ?? payments.length}</strong>
          <span className="subtle">After filters and search</span>
        </Card>
        <Card className="metric-card">
          <span className="subtle">Confirmed</span>
          <strong>{confirmedPayments}</strong>
          <span className="subtle">Marked as verified</span>
        </Card>
      </div>
      {payments.length === 0 ? (
        <EmptyState
          title="No payments yet"
          description={
            isAdminLike
              ? 'Payment records will appear here after the first entry.'
              : 'Your payments will appear here after the first record is added.'
          }
        />
      ) : (
        <TableShell
          title="Payment ledger"
          description={isAdminLike ? 'Student, course, amount, and status.' : 'Course, amount, and status.'}
          actions={<Pagination page={pagination?.page ?? page} totalPages={pagination?.totalPages ?? 1} onChange={setPage} />}
        >
          <TableToolbar
            search={search}
            onSearchChange={value => {
              setSearch(value);
            }}
            searchPlaceholder={isAdminLike ? 'Search by student, course, or amount' : 'Search by course or amount'}
            resultsLabel={`${pagination?.total ?? payments.length} result${(pagination?.total ?? payments.length) === 1 ? '' : 's'}`}
            activeFilters={toolbarFilters}
            filters={
              isAdminLike ? (
                <>
                  <Select
                    aria-label="Filter payments by student"
                    value={studentFilter}
                    onChange={event => {
                      setStudentFilter(event.target.value);
                    }}
                  >
                    <option value="all">All students</option>
                    {students.map(student => (
                      <option key={student.id} value={student.id}>
                        {getUserDisplayName(student)}
                      </option>
                    ))}
                  </Select>
                  <Select
                    aria-label="Filter payments by status"
                    value={statusFilter}
                    onChange={event => {
                      setStatusFilter(event.target.value as 'all' | PaymentStatus);
                    }}
                  >
                    <option value="all">All statuses</option>
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="cancelled">Cancelled</option>
                  </Select>
                  <Select
                    aria-label="Filter payments by course"
                    value={courseFilter}
                    onChange={event => {
                      setCourseFilter(event.target.value);
                    }}
                  >
                    <option value="all">All courses</option>
                    {courses.map(course => (
                      <option key={course.id} value={course.id}>
                        {getCourseDisplayName(course)}
                      </option>
                    ))}
                  </Select>
                  <Select
                    aria-label="Sort payments"
                    value={sortDirection}
                    onChange={event => {
                      setSortDirection(event.target.value as SortDirection);
                    }}
                  >
                    <option value="desc">Newest first</option>
                    <option value="asc">Oldest first</option>
                  </Select>
                </>
              ) : (
                <Select
                  aria-label="Sort payments"
                  value={sortDirection}
                  onChange={event => {
                    setSortDirection(event.target.value as SortDirection);
                  }}
                >
                  <option value="desc">Newest first</option>
                  <option value="asc">Oldest first</option>
                </Select>
              )
            }
          />
          <DataTable
            getRowKey={item => item.id}
            emptyTitle="No payments found"
            emptyDescription={isAdminLike ? 'Try another search or clear a filter.' : 'Try another search.'}
            columns={columns}
            rows={payments}
          />
        </TableShell>
      )}

      <PaymentFormModal
        open={formOpen}
        students={students}
        courses={courses}
        loading={createMutation.isPending}
        onClose={() => setFormOpen(false)}
        onSubmit={async values => {
          await createMutation.mutateAsync(values);
        }}
      />
      <ConfirmModal
        open={!!confirmCandidate}
        title="Confirm payment?"
        description={
          confirmCandidate
            ? `Mark the payment of ${formatMoney(confirmCandidate.amount)} for ${getUserDisplayName(confirmCandidate.student)} on ${getCourseDisplayName(getPaymentCourse(confirmCandidate))} as confirmed?`
            : ''
        }
        confirmLabel="Confirm payment"
        cancelLabel="Keep pending"
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
        title="Delete payment?"
        description={
          deleteCandidate
            ? `This will permanently remove the payment of ${formatMoney(deleteCandidate.amount)} for ${getUserDisplayName(deleteCandidate.student)} on ${getCourseDisplayName(getPaymentCourse(deleteCandidate))} from the ledger. Paid at: ${formatDate(deleteCandidate.paidAt)}. This action cannot be undone.`
            : ''
        }
        confirmLabel="Delete payment"
        cancelLabel="Keep payment"
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
