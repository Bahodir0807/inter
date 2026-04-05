import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { coursesApi, Course, CourseFormValues } from '../../entities/course/api';
import { usersApi } from '../../entities/user/api';
import { adminLikeRoles, teachingRoles } from '../../app/router/navigation';
import { useAuthStore } from '../../features/auth/model/auth-store';
import { PageLayout } from '../../widgets/page/page-layout';
import { LoadingState } from '../../shared/ui/feedback/loading-state';
import { ErrorState } from '../../shared/ui/feedback/error-state';
import { EmptyState } from '../../shared/ui/feedback/empty-state';
import { TableShell } from '../../shared/ui/data-display/table-shell';
import { DataTable } from '../../shared/ui/data-display/data-table';
import { Badge } from '../../shared/ui/badges/badge';
import { Card } from '../../shared/ui/surfaces/card';
import { formatMoney } from '../../shared/lib/date';
import { getUserDisplayName, getUserListSummary } from '../../shared/lib/entity-display';
import { TableToolbar } from '../../shared/ui/data-display/table-toolbar';
import { Pagination } from '../../shared/ui/data-display/pagination';
import { Button } from '../../shared/ui/buttons/button';
import { Select } from '../../shared/ui/forms/select';
import { sortBy, paginate, SortDirection } from '../../shared/lib/table';
import { toast } from '../../shared/ui/feedback/toaster';
import { CourseFormModal } from './course-form-modal';
import { ConfirmModal } from '../../shared/ui/overlay/confirm-modal';

const pageSize = 8;

export function CoursesPage() {
  const queryClient = useQueryClient();
  const sessionUser = useAuthStore(state => state.user);
  const canManage = !!sessionUser && teachingRoles.includes(sessionUser.role);
  const isAdminLike = !!sessionUser && adminLikeRoles.includes(sessionUser.role);

  const [search, setSearch] = useState('');
  const [teacherFilter, setTeacherFilter] = useState<'all' | string>('all');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [page, setPage] = useState(1);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteCandidate, setDeleteCandidate] = useState<Course | null>(null);

  const coursesQuery = useQuery({
    queryKey: ['courses'],
    queryFn: () => coursesApi.getAll(),
  });

  const usersQuery = useQuery({
    queryKey: ['course-form-users', isAdminLike ? 'all' : 'students'],
    queryFn: () => (isAdminLike ? usersApi.getAll() : usersApi.getStudents()),
    enabled: canManage,
  });

  const createMutation = useMutation({
    mutationFn: (payload: CourseFormValues) => coursesApi.create(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['courses'] });
      toast.success('Course created');
      setFormOpen(false);
    },
    onError: error => toast.error(error.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: CourseFormValues }) => coursesApi.update(id, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['courses'] });
      toast.success('Course updated');
      setFormOpen(false);
    },
    onError: error => toast.error(error.message),
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => coursesApi.remove(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['courses'] });
      toast.success('Course deleted');
    },
    onError: error => toast.error(error.message),
  });

  const courses = coursesQuery.data ?? [];
  const allUsers = usersQuery.data ?? [];
  const teachers = isAdminLike
    ? allUsers.filter(user => user.role === 'teacher')
    : sessionUser
      ? [sessionUser]
      : [];
  const students = isAdminLike ? allUsers.filter(user => user.role === 'student') : allUsers;

  const filteredCourses = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    const filtered = courses.filter(course => {
      const teacherId = typeof course.teacherId === 'string' ? course.teacherId : course.teacherId?.id;
      const teacherName = typeof course.teacherId === 'string' ? course.teacherId : getUserDisplayName(course.teacherId);
      const matchesTeacher = teacherFilter === 'all' || teacherId === teacherFilter;
      const haystack = [course.name, course.description, teacherName].filter(Boolean).join(' ').toLowerCase();
      return matchesTeacher && haystack.includes(normalizedSearch);
    });

    return sortBy(filtered, item => item.name.toLowerCase(), sortDirection);
  }, [courses, search, sortDirection, teacherFilter]);

  const selectedTeacherLabel =
    teacherFilter === 'all' ? '' : getUserDisplayName(teachers.find(teacher => teacher.id === teacherFilter));

  const toolbarFilters = [
    ...(teacherFilter !== 'all' ? [`Teacher: ${selectedTeacherLabel}`] : []),
    ...(sortDirection === 'desc' ? ['Order: Name Z-A'] : []),
  ];

  if (coursesQuery.isLoading) {
    return <LoadingState label="Loading courses..." />;
  }

  if (coursesQuery.error) {
    return <ErrorState description={coursesQuery.error.message} onRetry={() => void coursesQuery.refetch()} />;
  }

  const totalPages = Math.max(1, Math.ceil(filteredCourses.length / pageSize));
  const pagedCourses = paginate(filteredCourses, page, pageSize);
  const totalStudents = courses.reduce((sum, item) => sum + (item.students?.length ?? 0), 0);

  return (
    <PageLayout
      eyebrow="Programs"
      title="Courses"
      description="Manage program offers, teacher assignments, pricing, and enrollment from one catalog."
      actions={canManage ? <Button onClick={() => { setSelectedCourse(null); setFormOpen(true); }}>New course</Button> : undefined}
    >
      <div className="dashboard-grid">
        <Card className="metric-card">
          <span className="subtle">Visible courses</span>
          <strong>{filteredCourses.length}</strong>
          <span className="subtle">After filters and search</span>
        </Card>
        <Card className="metric-card">
          <span className="subtle">Linked students</span>
          <strong>{totalStudents}</strong>
          <span className="subtle">Across all loaded courses</span>
        </Card>
      </div>
      {courses.length === 0 ? (
        <EmptyState title="No courses yet" description="The catalog is still empty. Add the first course when you are ready to assign teachers and students." />
      ) : (
        <TableShell
          title="Course catalog"
          description="Each row shows the offer, teacher assignment, pricing, and enrollment context."
          actions={<Pagination page={page} totalPages={totalPages} onChange={setPage} />}
        >
          <TableToolbar
            search={search}
            onSearchChange={value => {
              setSearch(value);
              setPage(1);
            }}
            searchPlaceholder="Search by course, description, or teacher"
            resultsLabel={`${filteredCourses.length} result${filteredCourses.length === 1 ? '' : 's'}`}
            activeFilters={toolbarFilters}
            filters={
              <>
                <Select
                  aria-label="Filter courses by teacher"
                  value={teacherFilter}
                  onChange={event => {
                    setTeacherFilter(event.target.value);
                    setPage(1);
                  }}
                >
                  <option value="all">All teachers</option>
                  {teachers.map(teacher => (
                    <option key={teacher.id} value={teacher.id}>
                      {getUserDisplayName(teacher)}
                    </option>
                  ))}
                </Select>
                <Select
                  aria-label="Sort courses"
                  value={sortDirection}
                  onChange={event => {
                    setSortDirection(event.target.value as SortDirection);
                    setPage(1);
                  }}
                >
                  <option value="asc">Name A-Z</option>
                  <option value="desc">Name Z-A</option>
                </Select>
              </>
            }
          />
          <DataTable
            getRowKey={item => item.id}
            emptyTitle="No courses match this view"
            emptyDescription="Try a different search or clear one of the catalog filters."
            columns={[
              {
                key: 'course',
                header: 'Course',
                className: 'data-table__cell--primary',
                cell: item => (
                  <div className="cell-stack cell-stack--primary cell-stack--relation">
                    <span className="cell-title">{item.name}</span>
                    <span className="cell-meta">{item.description || 'No description provided yet'}</span>
                  </div>
                ),
              },
              {
                key: 'delivery',
                header: 'Delivery',
                className: 'data-table__cell--relation',
                cell: item => (
                  <div className="cell-stack cell-stack--relation">
                    <span className="cell-title">
                      {item.teacherId ? getUserDisplayName(item.teacherId) : 'No teacher assigned'}
                    </span>
                    <span className="cell-meta">Assigned instructor</span>
                    <div className="cell-badges">
                      <Badge tone="neutral">{formatMoney(item.price)}</Badge>
                    </div>
                  </div>
                ),
              },
              {
                key: 'enrollment',
                header: 'Enrollment',
                className: 'data-table__cell--relation',
                cell: item => (
                  <div className="cell-stack cell-stack--relation">
                    <span className="cell-title">{item.students?.length ?? 0} students</span>
                    <span className="cell-meta">{getUserListSummary(item.students)}</span>
                  </div>
                ),
              },
              {
                key: 'actions',
                header: 'Actions',
                className: 'data-table__cell--actions',
                headClassName: 'data-table__head--actions',
                cell: item => (
                  <div className="row-actions">
                    {canManage ? (
                      <>
                        <Button size="sm" variant="secondary" onClick={() => { setSelectedCourse(item); setFormOpen(true); }}>
                          Edit
                        </Button>
                        {isAdminLike ? (
                          <Button size="sm" variant="danger" onClick={() => setDeleteCandidate(item)}>
                            Delete
                          </Button>
                        ) : null}
                      </>
                    ) : (
                      <Badge tone="info">Read only</Badge>
                    )}
                  </div>
                ),
              },
            ]}
            rows={pagedCourses}
          />
        </TableShell>
      )}

      <CourseFormModal
        open={formOpen}
        course={selectedCourse}
        teachers={teachers}
        students={students}
        defaultTeacherId={!isAdminLike ? sessionUser?.id : undefined}
        loading={createMutation.isPending || updateMutation.isPending}
        onClose={() => setFormOpen(false)}
        onSubmit={async values => {
          if (selectedCourse) {
            await updateMutation.mutateAsync({ id: selectedCourse.id, payload: values });
            return;
          }

          await createMutation.mutateAsync(values);
        }}
      />
      <ConfirmModal
        open={!!deleteCandidate}
        title="Delete course?"
        description={
          deleteCandidate
            ? `This will permanently remove course "${deleteCandidate.name}" from the catalog. Teacher: ${deleteCandidate.teacherId ? getUserDisplayName(deleteCandidate.teacherId) : 'not assigned'}. Price: ${formatMoney(deleteCandidate.price)}. Historical references may remain visible in related records.`
            : ''
        }
        confirmLabel="Delete course"
        cancelLabel="Keep course"
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
