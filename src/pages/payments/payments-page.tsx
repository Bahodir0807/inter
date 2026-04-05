import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { coursesApi } from '../../entities/course/api';
import { Payment, paymentsApi, PaymentFormValues } from '../../entities/payment/api';
import { usersApi } from '../../entities/user/api';
import { useAuthStore } from '../../features/auth/model/auth-store';
import { paymentsManagerRoles } from '../../app/router/navigation';
import { PageLayout } from '../../widgets/page/page-layout';
import { LoadingState } from '../../shared/ui/feedback/loading-state';
import { ErrorState } from '../../shared/ui/feedback/error-state';
import { EmptyState } from '../../shared/ui/feedback/empty-state';
import { TableShell } from '../../shared/ui/data-display/table-shell';
import { DataTable } from '../../shared/ui/data-display/data-table';
import { Badge } from '../../shared/ui/badges/badge';
import { Card } from '../../shared/ui/surfaces/card';
import { formatDate, formatMoney } from '../../shared/lib/date';
import { TableToolbar } from '../../shared/ui/data-display/table-toolbar';
import { Pagination } from '../../shared/ui/data-display/pagination';
import { Select } from '../../shared/ui/forms/select';
import { Button } from '../../shared/ui/buttons/button';
import { getCourseDisplayName, getUserDisplayName } from '../../shared/lib/entity-display';
import { paginate, sortBy, SortDirection } from '../../shared/lib/table';
import { toast } from '../../shared/ui/feedback/toaster';
import { PaymentFormModal } from './payment-form-modal';
import { ConfirmModal } from '../../shared/ui/overlay/confirm-modal';

const pageSize = 8;

export function PaymentsPage() {
  const queryClient = useQueryClient();
  const user = useAuthStore(state => state.user);
  const isAdminLike = !!user && paymentsManagerRoles.includes(user.role);

  const [search, setSearch] = useState('');
  const [studentFilter, setStudentFilter] = useState<'all' | string>('all');
  const [courseFilter, setCourseFilter] = useState<'all' | string>('all');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [confirmCandidate, setConfirmCandidate] = useState<Payment | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<Payment | null>(null);

  const paymentsQuery = useQuery({
    queryKey: ['payments', isAdminLike ? 'all' : 'me'],
    queryFn: () => (isAdminLike ? paymentsApi.getAll() : paymentsApi.getMine()),
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

  const payments = paymentsQuery.data ?? [];
  const students = supportQuery.data?.students ?? [];
  const courses = supportQuery.data?.courses ?? [];

  const filteredPayments = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    const filtered = payments.filter(payment => {
      const studentId = typeof payment.student === 'string' ? payment.student : payment.student?.id;
      const courseId = typeof payment.course === 'string' ? payment.course : payment.course?.id;
      const haystack = [
        getUserDisplayName(payment.student),
        getCourseDisplayName(payment.course),
        formatMoney(payment.amount),
      ]
        .join(' ')
        .toLowerCase();

      const matchesStudent = studentFilter === 'all' || studentId === studentFilter;
      const matchesCourse = courseFilter === 'all' || courseId === courseFilter;

      return matchesStudent && matchesCourse && haystack.includes(normalizedSearch);
    });

    return sortBy(filtered, item => item.paidAt || item.createdAt || '', sortDirection);
  }, [courseFilter, payments, search, sortDirection, studentFilter]);

  if (paymentsQuery.isLoading) {
    return <LoadingState label="Loading payments..." />;
  }

  if (paymentsQuery.error) {
    return <ErrorState description={paymentsQuery.error.message} onRetry={() => void paymentsQuery.refetch()} />;
  }

  const totalPages = Math.max(1, Math.ceil(filteredPayments.length / pageSize));
  const pagedPayments = paginate(filteredPayments, page, pageSize);
  const confirmedPayments = payments.filter(item => item.isConfirmed).length;

  return (
    <PageLayout
      eyebrow="Finance"
      title="Payments"
      description={
        isAdminLike
          ? 'Track payment records with clear links to students, courses, and confirmation status.'
          : 'Review your personal payment history and confirmation status.'
      }
      actions={isAdminLike ? <Button onClick={() => setFormOpen(true)}>New payment</Button> : undefined}
    >
      <div className="dashboard-grid">
        <Card className="metric-card">
          <span className="subtle">Visible payments</span>
          <strong>{filteredPayments.length}</strong>
          <span className="subtle">After filters and search</span>
        </Card>
        <Card className="metric-card">
          <span className="subtle">Confirmed</span>
          <strong>{confirmedPayments}</strong>
          <span className="subtle">Marked as verified</span>
        </Card>
      </div>
      {payments.length === 0 ? (
        <EmptyState title="No payments yet" description="Payment records will appear here as soon as they are created." />
      ) : (
        <TableShell
          title="Payment ledger"
          description="Each row keeps the financial record tied to the student, course, and current confirmation state."
          actions={<Pagination page={page} totalPages={totalPages} onChange={setPage} />}
        >
          <TableToolbar
            search={search}
            onSearchChange={value => {
              setSearch(value);
              setPage(1);
            }}
            searchPlaceholder="Search by student, course, or amount"
            resultsLabel={`${filteredPayments.length} result${filteredPayments.length === 1 ? '' : 's'}`}
            filters={
              isAdminLike ? (
                <>
                  <Select value={studentFilter} onChange={event => setStudentFilter(event.target.value)}>
                    <option value="all">All students</option>
                    {students.map(student => (
                      <option key={student.id} value={student.id}>
                        {getUserDisplayName(student)}
                      </option>
                    ))}
                  </Select>
                  <Select value={courseFilter} onChange={event => setCourseFilter(event.target.value)}>
                    <option value="all">All courses</option>
                    {courses.map(course => (
                      <option key={course.id} value={course.id}>
                        {getCourseDisplayName(course)}
                      </option>
                    ))}
                  </Select>
                  <Select value={sortDirection} onChange={event => setSortDirection(event.target.value as SortDirection)}>
                    <option value="desc">Newest first</option>
                    <option value="asc">Oldest first</option>
                  </Select>
                </>
              ) : undefined
            }
          />
          <DataTable
            getRowKey={item => item.id}
            columns={[
              {
                key: 'payment',
                header: 'Payment',
                cell: item => (
                  <div className="cell-stack">
                    <span className="cell-title">{formatMoney(item.amount)}</span>
                    <span className="cell-meta">{formatDate(item.paidAt)}</span>
                    <div className="cell-badges">
                      <Badge tone={item.isConfirmed ? 'success' : 'warning'}>
                        {item.isConfirmed ? 'Confirmed' : 'Pending'}
                      </Badge>
                    </div>
                  </div>
                ),
              },
              {
                key: 'student',
                header: 'Student',
                cell: item => (
                  <div className="cell-stack">
                    <span className="cell-title">{getUserDisplayName(item.student)}</span>
                    <span className="cell-meta">Linked payer</span>
                  </div>
                ),
              },
              {
                key: 'course',
                header: 'Course',
                cell: item => (
                  <div className="cell-stack">
                    <span className="cell-title">{getCourseDisplayName(item.course)}</span>
                    <span className="cell-meta">Linked offer</span>
                  </div>
                ),
              },
              {
                key: 'actions',
                header: 'Actions',
                cell: item => (
                  <div className="inline-actions">
                    {isAdminLike ? (
                      <>
                        {!item.isConfirmed ? (
                          <Button size="sm" variant="secondary" onClick={() => setConfirmCandidate(item)}>
                            Confirm
                          </Button>
                        ) : null}
                        <Button size="sm" variant="danger" onClick={() => setDeleteCandidate(item)}>
                          Delete
                        </Button>
                      </>
                    ) : (
                      <Badge tone="info">Read only</Badge>
                    )}
                  </div>
                ),
              },
            ]}
            rows={pagedPayments}
            emptyTitle="No matching payments"
            emptyDescription="Adjust the filters or broaden the search query."
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
            ? `Mark the payment of ${formatMoney(confirmCandidate.amount)} for ${getUserDisplayName(confirmCandidate.student)} on ${getCourseDisplayName(confirmCandidate.course)} as confirmed?`
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
            ? `This will permanently remove the payment of ${formatMoney(deleteCandidate.amount)} for ${getUserDisplayName(deleteCandidate.student)} on ${getCourseDisplayName(deleteCandidate.course)} from the ledger. Paid at: ${formatDate(deleteCandidate.paidAt)}. This action cannot be undone.`
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
