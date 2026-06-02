import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { coursesApi } from '../../entities/course/api';
import { groupsApi } from '../../entities/group/api';
import { Student, StudentFormValues, studentsApi, StudentStatus } from '../../entities/student/api';
import { PageLayout } from '../../widgets/page/page-layout';
import { Badge } from '../../shared/ui/badges/badge';
import { Button } from '../../shared/ui/buttons/button';
import { DataTable, Column } from '../../shared/ui/data-display/data-table';
import { Pagination } from '../../shared/ui/data-display/pagination';
import { TableShell } from '../../shared/ui/data-display/table-shell';
import { TableToolbar } from '../../shared/ui/data-display/table-toolbar';
import { Select } from '../../shared/ui/forms/select';
import { ErrorState } from '../../shared/ui/feedback/error-state';
import { LoadingState } from '../../shared/ui/feedback/loading-state';
import { toast } from '../../shared/ui/feedback/toaster';
import { ConfirmModal } from '../../shared/ui/overlay/confirm-modal';
import { StudentFormModal } from './student-form-modal';

const pageSize = 10;
const statusOptions: Array<'all' | StudentStatus> = ['all', 'active', 'inactive', 'archived'];

function getStudentName(student: Student) {
  return student.fullName || [student.firstName, student.lastName].filter(Boolean).join(' ') || student.id;
}

export function StudentsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'all' | StudentStatus>('all');
  const [selected, setSelected] = useState<Student | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [archiveCandidate, setArchiveCandidate] = useState<Student | null>(null);

  const studentsQuery = useQuery({
    queryKey: ['students', page, search, status],
    queryFn: () => studentsApi.getStudentsPage({
      page,
      limit: pageSize,
      search: search || undefined,
      status: status === 'all' ? undefined : status,
    }),
  });

  const supportQuery = useQuery({
    queryKey: ['students-support'],
    queryFn: async () => {
      const [courses, groups] = await Promise.all([coursesApi.getAll(), groupsApi.getAll()]);
      return { courses, groups };
    },
  });

  const saveMutation = useMutation({
    mutationFn: ({ id, payload }: { id?: string; payload: StudentFormValues }) =>
      id ? studentsApi.updateStudent(id, payload) : studentsApi.createStudent(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['students'] });
      toast.success('Student saved');
      setFormOpen(false);
      setSelected(null);
    },
    onError: error => toast.error(error.message),
  });

  const archiveMutation = useMutation({
    mutationFn: (id: string) => studentsApi.archiveStudent(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['students'] });
      toast.success('Student archived');
      setArchiveCandidate(null);
    },
    onError: error => toast.error(error.message),
  });

  const students = studentsQuery.data?.items ?? [];
  const totalPages = studentsQuery.data?.pagination?.totalPages ?? 1;
  const courses = supportQuery.data?.courses ?? [];
  const groups = supportQuery.data?.groups ?? [];

  const courseNames = useMemo(() => new Map(courses.map(course => [course.id, course.name])), [courses]);
  const groupNames = useMemo(() => new Map(groups.map(group => [group.id, group.name])), [groups]);

  const columns: Column<Student>[] = [
    {
      key: 'student',
      header: 'Student',
      className: 'data-table__cell--primary',
      cell: item => (
        <div className="cell-stack cell-stack--primary">
          <span className="cell-title">{getStudentName(item)}</span>
          <span className="cell-meta">{item.phoneNumber || item.telegramId || 'No contact'}</span>
        </div>
      ),
    },
    {
      key: 'parent',
      header: 'Parent',
      cell: item => (
        <div className="cell-stack">
          <span className="cell-title">{item.parentName || '-'}</span>
          <span className="cell-meta">{item.parentPhoneNumber || '-'}</span>
        </div>
      ),
    },
    {
      key: 'enrolment',
      header: 'Enrolment',
      cell: item => (
        <div className="cell-stack">
          <span className="cell-title">{item.courseIds.map(id => courseNames.get(id) ?? id).join(', ') || '-'}</span>
          <span className="cell-meta">{item.groupIds.map(id => groupNames.get(id) ?? id).join(', ') || '-'}</span>
        </div>
      ),
    },
    {
      key: 'payment',
      header: 'Payment',
      cell: item => (
        <div className="cell-stack">
          <span className="cell-title">{item.monthlyPayment ?? '-'}</span>
          <span className="cell-meta">{item.paymentDueDate?.slice(0, 10) ?? '-'}</span>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      cell: item => <Badge tone={item.isActive ? 'success' : 'warning'}>{item.status}</Badge>,
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'data-table__cell--actions',
      headClassName: 'data-table__head--actions',
      cell: item => (
        <div className="row-actions">
          <Button size="sm" variant="secondary" onClick={() => { setSelected(item); setFormOpen(true); }}>Edit</Button>
          <Button size="sm" variant="danger" onClick={() => setArchiveCandidate(item)} disabled={!item.isActive}>Archive</Button>
        </div>
      ),
    },
  ];

  if (studentsQuery.isLoading) {
    return <LoadingState label="Loading students" />;
  }

  if (studentsQuery.error) {
    return <ErrorState description={studentsQuery.error.message} onRetry={() => void studentsQuery.refetch()} />;
  }

  return (
    <PageLayout
      eyebrow="Students"
      title="Students"
      description="Student registry, contacts, enrolment, and payment settings."
      actions={<Button onClick={() => { setSelected(null); setFormOpen(true); }}>New student</Button>}
    >
      <TableShell title="Student list" description="Students are stored separately from operational users." actions={<Pagination page={page} totalPages={totalPages} onChange={setPage} />}>
        <TableToolbar
          search={search}
          onSearchChange={value => { setSearch(value); setPage(1); }}
          searchPlaceholder="Search by name, phone, Telegram, or parent"
          resultsLabel={`${studentsQuery.data?.pagination?.total ?? students.length} students`}
          activeFilters={status === 'all' ? [] : [`Status: ${status}`]}
          filters={(
            <Select value={status} onChange={event => { setStatus(event.target.value as 'all' | StudentStatus); setPage(1); }} aria-label="Filter by status">
              {statusOptions.map(option => <option key={option} value={option}>{option}</option>)}
            </Select>
          )}
        />
        <DataTable
          getRowKey={item => item.id}
          rows={students}
          columns={columns}
          emptyTitle="No students found"
          emptyDescription="Create a student or adjust filters."
        />
      </TableShell>

      <StudentFormModal
        open={formOpen}
        student={selected}
        courses={courses}
        groups={groups}
        loading={saveMutation.isPending}
        onClose={() => { setFormOpen(false); setSelected(null); }}
        onSubmit={async payload => {
          await saveMutation.mutateAsync({ id: selected?.id, payload });
        }}
      />
      <ConfirmModal
        open={!!archiveCandidate}
        title="Archive student"
        description={archiveCandidate ? `Archive ${getStudentName(archiveCandidate)}? Existing history will stay available.` : ''}
        confirmLabel="Archive"
        cancelLabel="Cancel"
        tone="danger"
        loading={archiveMutation.isPending}
        onClose={() => setArchiveCandidate(null)}
        onConfirm={async () => {
          if (archiveCandidate) {
            await archiveMutation.mutateAsync(archiveCandidate.id);
          }
        }}
      />
    </PageLayout>
  );
}
