import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { groupsApi, Group, GroupFormValues } from '../../entities/group/api';
import { coursesApi } from '../../entities/course/api';
import { usersApi } from '../../entities/user/api';
import { adminLikeRoles } from '../../app/router/navigation';
import { useAuthStore } from '../../features/auth/model/auth-store';
import { useI18n } from '../../shared/i18n/i18n';
import { PageLayout } from '../../widgets/page/page-layout';
import { LoadingState } from '../../shared/ui/feedback/loading-state';
import { ErrorState } from '../../shared/ui/feedback/error-state';
import { EmptyState } from '../../shared/ui/feedback/empty-state';
import { TableShell } from '../../shared/ui/data-display/table-shell';
import { DataTable, type Column } from '../../shared/ui/data-display/data-table';
import { Card } from '../../shared/ui/surfaces/card';
import { TableToolbar } from '../../shared/ui/data-display/table-toolbar';
import { Pagination } from '../../shared/ui/data-display/pagination';
import { Button } from '../../shared/ui/buttons/button';
import { Select } from '../../shared/ui/forms/select';
import { Badge } from '../../shared/ui/badges/badge';
import { getCourseDisplayName, getUserDisplayName, getUserListSummary } from '../../shared/lib/entity-display';
import { paginate, sortBy, SortDirection } from '../../shared/lib/table';
import { toast } from '../../shared/ui/feedback/toaster';
import { GroupFormModal } from './group-form-modal';
import { ConfirmModal } from '../../shared/ui/overlay/confirm-modal';

const pageSize = 8;

export function GroupsPage() {
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
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteCandidate, setDeleteCandidate] = useState<Group | null>(null);

  const groupsQuery = useQuery({
    queryKey: ['groups', isTeacher ? sessionUser?.id : 'all'],
    queryFn: () => groupsApi.getAll(isTeacher && sessionUser ? { teacherId: sessionUser.id } : undefined),
    enabled: !!sessionUser,
  });

  const coursesQuery = useQuery({
    queryKey: ['groups-form-courses'],
    queryFn: () => coursesApi.getAll(),
    enabled: canManage,
  });

  const usersQuery = useQuery({
    queryKey: ['groups-form-users', isAdminLike ? 'all' : 'students'],
    queryFn: () => (isAdminLike ? usersApi.getAll() : usersApi.getStudents()),
    enabled: canManage,
  });

  const createMutation = useMutation({
    mutationFn: (payload: GroupFormValues) => groupsApi.create(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['groups'] });
      toast.success(t('common.saved'));
      setFormOpen(false);
    },
    onError: error => toast.error(error.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: GroupFormValues }) => groupsApi.update(id, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['groups'] });
      toast.success(t('common.updated'));
      setFormOpen(false);
    },
    onError: error => toast.error(error.message),
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => groupsApi.remove(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['groups'] });
      toast.success(t('common.deleted'));
    },
    onError: error => toast.error(error.message),
  });

  const groups = groupsQuery.data ?? [];
  const courses = coursesQuery.data ?? [];
  const users = usersQuery.data ?? [];
  const supportError = coursesQuery.error ?? usersQuery.error;
  const supportLoading = canManage && (coursesQuery.isLoading || usersQuery.isLoading);
  const supportUnavailable = canManage && !!supportError;
  const teachers = isAdminLike
    ? users.filter(user => user.role === 'teacher')
    : sessionUser
      ? [sessionUser]
      : [];
  const students = isAdminLike ? users.filter(user => user.role === 'student') : users;
  const visibleGroups = useMemo(() => {
    if (!sessionUser || isAdminLike) {
      return groups;
    }

    if (isTeacher) {
      return groups.filter(group => {
        const teacherId = typeof group.teacher === 'string' ? group.teacher : group.teacher.id;
        return teacherId === sessionUser.id;
      });
    }

    if (isStudent) {
      return groups.filter(group =>
        group.students.some(student => (typeof student === 'string' ? student : student.id) === sessionUser.id),
      );
    }

    return groups.filter(group => {
      const teacherId = typeof group.teacher === 'string' ? group.teacher : group.teacher.id;
      return teacherId === sessionUser.id;
    });
  }, [groups, isAdminLike, isStudent, isTeacher, sessionUser]);

  const filteredGroups = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    const filtered = visibleGroups.filter(group => {
      const teacherId = typeof group.teacher === 'string' ? group.teacher : group.teacher.id;
      const haystack = [
        group.name,
        getCourseDisplayName(group.course),
        getUserDisplayName(group.teacher),
      ]
        .join(' ')
        .toLowerCase();

      const matchesTeacher = !isAdminLike || teacherFilter === 'all' || teacherId === teacherFilter;
      return matchesTeacher && haystack.includes(normalizedSearch);
    });

    return sortBy(filtered, item => item.name.toLowerCase(), sortDirection);
  }, [isAdminLike, search, sortDirection, teacherFilter, visibleGroups]);

  const selectedTeacherLabel =
    teacherFilter === 'all' ? '' : getUserDisplayName(teachers.find(teacher => teacher.id === teacherFilter));

  const toolbarFilters = [
    ...(isAdminLike && teacherFilter !== 'all' ? [t('group.filterTeacherValue', { teacher: selectedTeacherLabel })] : []),
    ...(sortDirection === 'desc' ? [t('common.sortOrderDesc')] : []),
  ];

  if (groupsQuery.isLoading) {
    return <LoadingState label={t('common.loading')} />;
  }

  if (groupsQuery.error) {
    return <ErrorState description={groupsQuery.error.message} onRetry={() => void groupsQuery.refetch()} />;
  }

  const totalPages = Math.max(1, Math.ceil(filteredGroups.length / pageSize));
  const pagedGroups = paginate(filteredGroups, page, pageSize);
  const totalLinkedStudents = visibleGroups.reduce((sum, item) => sum + item.students.length, 0);
  const columns: Column<Group>[] = [
    {
      key: 'group',
      header: t('group.groupLabel'),
      className: 'data-table__cell--primary',
      cell: item => (
        <div className="cell-stack cell-stack--primary cell-stack--relation">
          <span className="cell-title">{item.name}</span>
          <span className="cell-meta">{getCourseDisplayName(item.course)}</span>
        </div>
      ),
    },
    {
      key: 'teacher',
      header: t('group.teacherLabel'),
      className: 'data-table__cell--relation',
      cell: item => (
        <div className="cell-stack cell-stack--relation">
          <span className="cell-title">{getUserDisplayName(item.teacher)}</span>
          <span className="cell-meta">{isAdminLike ? t('group.responsibleTeacher') : t('group.assignedRoster')}</span>
        </div>
      ),
    },
    {
      key: 'students',
      header: t('group.studentsLabelHeader'),
      className: 'data-table__cell--relation',
      cell: item => (
        <div className="cell-stack cell-stack--relation">
          <span className="cell-title">{t('group.studentsCount', { count: item.students.length })}</span>
          <span className="cell-meta">{getUserListSummary(item.students)}</span>
        </div>
      ),
    },
    {
      key: 'status',
      header: t('group.statusLabel'),
      cell: item => (
        <Badge tone={item.students.length > 0 ? 'success' : 'warning'}>
          {item.students.length > 0 ? t('group.activeRoster') : t('group.noStudentsYet')}
        </Badge>
      ),
    },
    ...(canManage ? [{
      key: 'actions',
      header: t('common.actions'),
      className: 'data-table__cell--actions',
      headClassName: 'data-table__head--actions',
      cell: (item: Group) => (
        <div className="row-actions">
          <Button size="sm" variant="secondary" disabled={supportLoading || supportUnavailable} onClick={() => { setSelectedGroup(item); setFormOpen(true); }}>
            {t('common.edit')}
          </Button>
          {isAdminLike ? (
            <Button size="sm" variant="danger" onClick={() => setDeleteCandidate(item)}>
              {t('common.delete')}
            </Button>
          ) : null}
        </div>
      ),
    }] : []),
  ];

  return (
    <PageLayout
      eyebrow={t('group.eyebrow')}
      title={t('group.title')}
      description={isAdminLike ? t('group.description.admin') : t('group.description.student')}
      actions={canManage ? (
        <Button onClick={() => { setSelectedGroup(null); setFormOpen(true); }} disabled={supportLoading || supportUnavailable}>
          {supportLoading ? t('common.loading') : t('group.newGroup')}
        </Button>
      ) : undefined}
    >
      {supportUnavailable ? (
        <ErrorState
          title={t('group.supportLoadFailedTitle', 'Group form data could not be loaded')}
          description={supportError.message}
          onRetry={() => {
            void coursesQuery.refetch();
            void usersQuery.refetch();
          }}
        />
      ) : null}
      <div className="dashboard-grid">
        <Card className="metric-card">
          <span className="subtle">{t('group.visibleGroups')}</span>
          <strong>{filteredGroups.length}</strong>
          <span className="subtle">{t('group.afterFilters')}</span>
        </Card>
        <Card className="metric-card">
          <span className="subtle">{t('group.linkedStudents')}</span>
          <strong>{totalLinkedStudents}</strong>
          <span className="subtle">{t('group.linkedStudentsMeta')}</span>
        </Card>
      </div>
      {visibleGroups.length === 0 ? (
        <EmptyState
          title={isTeacher ? t('group.noGroupsAssigned') : t('group.noGroupsYet')}
          description={
            isAdminLike
              ? t('group.noGroupsDescription.admin')
              : t('group.noGroupsDescription.student')
          }
        />
      ) : (
        <TableShell
          title={t('group.registryTitle')}
          description={isAdminLike ? t('group.registryDescription.admin') : t('group.registryDescription.student')}
          actions={<Pagination page={page} totalPages={totalPages} onChange={setPage} />}
        >
          <TableToolbar
            search={search}
            onSearchChange={value => {
              setSearch(value);
              setPage(1);
            }}
            searchPlaceholder={isAdminLike ? t('common.searchByCourseRoomTeacherGroup') : t('common.searchByCourseRoomTeacher')}
            resultsLabel={t('common.resultsLabel', { count: filteredGroups.length })}
            activeFilters={toolbarFilters}
            filters={
              <>
                {isAdminLike ? (
                  <Select
                    aria-label={t('group.filterTeacherLabel')}
                    value={teacherFilter}
                    onChange={event => {
                      setTeacherFilter(event.target.value);
                      setPage(1);
                    }}
                  >
                    <option value="all">{t('common.allTeachers')}</option>
                    {teachers.map(teacher => (
                      <option key={teacher.id} value={teacher.id}>
                        {getUserDisplayName(teacher)}
                      </option>
                    ))}
                  </Select>
                ) : null}
                <Select
                  aria-label={t('group.sortLabel')}
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
            emptyTitle={t('group.emptyTitle')}
            emptyDescription={isAdminLike ? t('group.emptyDescription.manage') : t('group.emptyDescription.student')}
            columns={columns}
            rows={pagedGroups}
          />
        </TableShell>
      )}

      <GroupFormModal
        open={formOpen}
        group={selectedGroup}
        courses={courses}
        teachers={teachers}
        students={students}
        defaultTeacherId={!isAdminLike ? sessionUser?.id : undefined}
        teacherLocked={!isAdminLike}
        loading={createMutation.isPending || updateMutation.isPending || supportLoading}
        onClose={() => setFormOpen(false)}
        onSubmit={async values => {
          if (selectedGroup) {
            await updateMutation.mutateAsync({ id: selectedGroup.id, payload: values });
            return;
          }

          await createMutation.mutateAsync(values);
        }}
      />
      <ConfirmModal
        open={!!deleteCandidate}
        title={t('group.deleteGroupTitle')}
        description={
          deleteCandidate
            ? t('group.deleteGroupDescription', {
                group: deleteCandidate.name,
                course: getCourseDisplayName(deleteCandidate.course),
                teacher: getUserDisplayName(deleteCandidate.teacher),
              })
            : ''
        }
        confirmLabel={t('group.deleteGroupConfirm')}
        cancelLabel={t('group.keepGroup')}
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
