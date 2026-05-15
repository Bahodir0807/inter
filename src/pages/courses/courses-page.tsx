import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { coursesApi, Course, CourseFormValues } from '../../entities/course/api';
import { usersApi } from '../../entities/user/api';
import { useI18n } from '../../shared/i18n/i18n';
import { adminLikeRoles } from '../../app/router/navigation';
import { useAuthStore } from '../../features/auth/model/auth-store';
import { PageLayout } from '../../widgets/page/page-layout';
import { LoadingState } from '../../shared/ui/feedback/loading-state';
import { ErrorState } from '../../shared/ui/feedback/error-state';
import { EmptyState } from '../../shared/ui/feedback/empty-state';
import { TableShell } from '../../shared/ui/data-display/table-shell';
import { DataTable, type Column } from '../../shared/ui/data-display/data-table';
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
  const { t } = useI18n();
  const isAdminLike = !!sessionUser && adminLikeRoles.includes(sessionUser.role);
  const canManage = isAdminLike;
  const isTeacher = sessionUser?.role === 'teacher';
  const isStudent = sessionUser?.role === 'student';

  const [search, setSearch] = useState('');
  const [teacherFilter, setTeacherFilter] = useState<'all' | string>('all');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [page, setPage] = useState(1);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteCandidate, setDeleteCandidate] = useState<Course | null>(null);

  const coursesQuery = useQuery({
    queryKey: ['courses', isTeacher ? sessionUser?.id : 'all'],
    queryFn: () => coursesApi.getAll(isTeacher && sessionUser ? { teacherId: sessionUser.id } : undefined),
    enabled: !!sessionUser,
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
      toast.success(t('common.saved'));
      setFormOpen(false);
    },
    onError: error => toast.error(error.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: CourseFormValues }) => coursesApi.update(id, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['courses'] });
      toast.success(t('common.updated'));
      setFormOpen(false);
    },
    onError: error => toast.error(error.message),
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => coursesApi.remove(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['courses'] });
      toast.success(t('common.deleted'));
    },
    onError: error => toast.error(error.message),
  });

  const courses = coursesQuery.data ?? [];
  const allUsers = usersQuery.data ?? [];
  const supportLoading = canManage && usersQuery.isLoading;
  const supportUnavailable = canManage && !!usersQuery.error;
  const teachers = canManage
    ? isAdminLike
      ? allUsers.filter(user => user.role === 'teacher')
      : sessionUser
        ? [sessionUser]
        : []
    : [];
  const students = canManage ? (isAdminLike ? allUsers.filter(user => user.role === 'student') : allUsers) : [];
  const visibleCourses = useMemo(() => {
    if (!sessionUser) {
      return [];
    }

    if (isAdminLike) {
      return courses;
    }

    if (isTeacher) {
      return courses.filter(course => {
        const teacherId = typeof course.teacherId === 'string' ? course.teacherId : course.teacherId?.id;
        return teacherId === sessionUser.id;
      });
    }

    return courses.filter(course =>
      (course.students ?? []).some(student => (typeof student === 'string' ? student : student.id) === sessionUser.id),
    );
  }, [courses, isAdminLike, isTeacher, sessionUser]);

  const filteredCourses = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    const filtered = visibleCourses.filter(course => {
      const teacherId = typeof course.teacherId === 'string' ? course.teacherId : course.teacherId?.id;
      const teacherName = typeof course.teacherId === 'string' ? course.teacherId : getUserDisplayName(course.teacherId);
      const matchesTeacher = !isAdminLike || teacherFilter === 'all' || teacherId === teacherFilter;
      const haystack = [course.name, course.description, teacherName].filter(Boolean).join(' ').toLowerCase();
      return matchesTeacher && haystack.includes(normalizedSearch);
    });

    return sortBy(filtered, item => item.name.toLowerCase(), sortDirection);
  }, [isAdminLike, search, sortDirection, teacherFilter, visibleCourses]);

  const selectedTeacherLabel =
    teacherFilter === 'all' ? '' : getUserDisplayName(teachers.find(teacher => teacher.id === teacherFilter));

  const toolbarFilters = [
    ...(isAdminLike && teacherFilter !== 'all' ? [t('course.filterTeacherValue', { teacher: selectedTeacherLabel })] : []),
    ...(sortDirection === 'desc' ? [t('common.sortOrderDesc')] : []),
  ];

  if (coursesQuery.isLoading) {
    return <LoadingState label={t('common.loading')} />;
  }

  if (coursesQuery.error) {
    return <ErrorState description={coursesQuery.error.message} onRetry={() => void coursesQuery.refetch()} />;
  }

  const totalPages = Math.max(1, Math.ceil(filteredCourses.length / pageSize));
  const pagedCourses = paginate(filteredCourses, page, pageSize);
  const totalStudents = visibleCourses.reduce((sum, item) => sum + (item.students?.length ?? 0), 0);
  const coursesWithTeacher = visibleCourses.filter(item => item.teacherId).length;
  const columns: Column<Course>[] = [
    {
      key: 'course',
      header: t('course.courseLabel'),
      className: 'data-table__cell--primary',
      cell: item => (
        <div className="cell-stack cell-stack--primary cell-stack--relation">
          <span className="cell-title">{item.name}</span>
          <span className="cell-meta">{item.description || t('course.noDescription')}</span>
        </div>
      ),
    },
    {
      key: 'delivery',
      header: t('course.deliveryLabel'),
      className: 'data-table__cell--relation',
      cell: item => (
        <div className="cell-stack cell-stack--relation">
          <span className="cell-title">
            {item.teacherId ? getUserDisplayName(item.teacherId) : t('course.noTeacherAssigned')}
          </span>
          <span className="cell-meta">{isStudent ? t('course.assignedTeacher') : t('course.assignedInstructor')}</span>
          <div className="cell-badges">
            <Badge tone="neutral">{formatMoney(item.price)}</Badge>
          </div>
        </div>
      ),
    },
    ...(canManage
      ? [
          {
            key: 'enrollment',
            header: t('course.enrollmentLabel'),
            className: 'data-table__cell--relation',
            cell: (item: Course) => (
              <div className="cell-stack cell-stack--relation">
                <span className="cell-title">{t('course.studentsLabel', { count: item.students?.length ?? 0 })}</span>
                <span className="cell-meta">{getUserListSummary(item.students)}</span>
              </div>
            ),
          },
          {
            key: 'actions',
            header: t('common.actions'),
            className: 'data-table__cell--actions',
            headClassName: 'data-table__head--actions',
            cell: (item: Course) => (
              <div className="row-actions">
                <Button size="sm" variant="secondary" disabled={supportLoading || supportUnavailable} onClick={() => { setSelectedCourse(item); setFormOpen(true); }}>
                  {t('common.edit')}
                </Button>
                {isAdminLike ? (
                  <Button size="sm" variant="danger" onClick={() => setDeleteCandidate(item)}>
                    {t('common.delete')}
                  </Button>
                ) : null}
              </div>
            ),
          },
        ]
      : []),
  ];

  return (
    <PageLayout
      eyebrow={t('course.eyebrow')}
      title={t('course.title')}
      description={
        isAdminLike
          ? t('course.description.admin')
          : isTeacher
            ? t('course.description.teacher')
            : t('course.description.student')
      }
      actions={canManage ? (
        <Button onClick={() => { setSelectedCourse(null); setFormOpen(true); }} disabled={supportLoading || supportUnavailable}>
          {supportLoading ? t('common.loading') : t('course.newCourse')}
        </Button>
      ) : undefined}
    >
      {supportUnavailable ? (
        <ErrorState
          title={t('course.supportLoadFailedTitle', 'Course form data could not be loaded')}
          description={usersQuery.error.message}
          onRetry={() => void usersQuery.refetch()}
        />
      ) : null}
      <div className="dashboard-grid">
        <Card className="metric-card">
          <span className="subtle">{t('course.visibleCourses')}</span>
          <strong>{filteredCourses.length}</strong>
          <span className="subtle">{t('course.afterFilters')}</span>
        </Card>
        <Card className="metric-card">
          <span className="subtle">{isStudent ? t('course.withTeacherAssigned') : t('course.linkedStudents')}</span>
          <strong>{isStudent ? coursesWithTeacher : totalStudents}</strong>
          <span className="subtle">{isStudent ? t('course.withTeacherAssignedMeta') : t('course.linkedStudentsMeta')}</span>
        </Card>
      </div>
      {visibleCourses.length === 0 ? (
        <EmptyState
          title={isStudent ? t('course.noCoursesAssigned') : t('course.noCoursesYet')}
          description={
            isAdminLike
              ? t('course.noCoursesDescription.admin')
              : isTeacher
                ? t('course.noCoursesDescription.teacher')
                : t('course.noCoursesDescription.student')
          }
        />
      ) : (
        <TableShell
          title={t('course.catalogTitle')}
          description={canManage ? t('course.catalogDescription.manage') : t('course.catalogDescription.view')}
          actions={<Pagination page={page} totalPages={totalPages} onChange={setPage} />}
        >
          <TableToolbar
            search={search}
            onSearchChange={value => {
              setSearch(value);
              setPage(1);
            }}
            searchPlaceholder={isStudent ? t('common.searchByCourseRoomTeacher') : t('common.searchByCourseRoomTeacherGroup')}
            resultsLabel={t('common.resultsLabel', { count: filteredCourses.length })}
            activeFilters={toolbarFilters}
            filters={
              <>
                {isAdminLike ? (
                  <Select
                    aria-label={t('course.filterTeacherLabel')}
                    value={teacherFilter}
                    onChange={event => {
                      setTeacherFilter(event.target.value);
                      setPage(1);
                    }}
                  >
                    <option value="all">{t('course.allTeachers')}</option>
                    {teachers.map(teacher => (
                      <option key={teacher.id} value={teacher.id}>
                        {getUserDisplayName(teacher)}
                      </option>
                    ))}
                  </Select>
                ) : null}
                <Select
                  aria-label={t('course.sortLabel')}
                  value={sortDirection}
                  onChange={event => {
                    setSortDirection(event.target.value as SortDirection);
                    setPage(1);
                  }}
                >
                  <option value="asc">{t('common.sortNameAsc')}</option>
                  <option value="desc">{t('common.sortNameDesc')}</option>
                </Select>
              </>
            }
          />
          <DataTable
            getRowKey={item => item.id}
            emptyTitle={t('course.emptyTitle')}
            emptyDescription={isAdminLike ? t('course.emptyDescription.manage') : t('course.emptyDescription.student')}
            columns={columns}
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
        teacherLocked={!isAdminLike}
        loading={createMutation.isPending || updateMutation.isPending || supportLoading}
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
        title={t('course.deleteCourseTitle')}
        description={
          deleteCandidate
            ? t('course.deleteCourseDescription', {
                course: deleteCandidate.name,
                teacher: deleteCandidate.teacherId ? getUserDisplayName(deleteCandidate.teacherId) : t('course.notAssigned'),
                price: formatMoney(deleteCandidate.price),
              })
            : ''
        }
        confirmLabel={t('course.deleteCourseConfirm')}
        cancelLabel={t('course.keepCourse')}
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
