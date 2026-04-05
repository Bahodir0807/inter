import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { groupsApi, Group, GroupFormValues } from '../../entities/group/api';
import { coursesApi } from '../../entities/course/api';
import { usersApi } from '../../entities/user/api';
import { adminLikeRoles, teachingRoles } from '../../app/router/navigation';
import { useAuthStore } from '../../features/auth/model/auth-store';
import { PageLayout } from '../../widgets/page/page-layout';
import { LoadingState } from '../../shared/ui/feedback/loading-state';
import { ErrorState } from '../../shared/ui/feedback/error-state';
import { EmptyState } from '../../shared/ui/feedback/empty-state';
import { TableShell } from '../../shared/ui/data-display/table-shell';
import { DataTable } from '../../shared/ui/data-display/data-table';
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
  const canManage = !!sessionUser && teachingRoles.includes(sessionUser.role);
  const isAdminLike = !!sessionUser && adminLikeRoles.includes(sessionUser.role);

  const [search, setSearch] = useState('');
  const [teacherFilter, setTeacherFilter] = useState<'all' | string>('all');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [page, setPage] = useState(1);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteCandidate, setDeleteCandidate] = useState<Group | null>(null);

  const groupsQuery = useQuery({
    queryKey: ['groups'],
    queryFn: () => groupsApi.getAll(),
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
      toast.success('Group created');
      setFormOpen(false);
    },
    onError: error => toast.error(error.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: GroupFormValues }) => groupsApi.update(id, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['groups'] });
      toast.success('Group updated');
      setFormOpen(false);
    },
    onError: error => toast.error(error.message),
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => groupsApi.remove(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['groups'] });
      toast.success('Group deleted');
    },
    onError: error => toast.error(error.message),
  });

  const groups = groupsQuery.data ?? [];
  const courses = coursesQuery.data ?? [];
  const users = usersQuery.data ?? [];
  const teachers = isAdminLike
    ? users.filter(user => user.role === 'teacher')
    : sessionUser
      ? [sessionUser]
      : [];
  const students = isAdminLike ? users.filter(user => user.role === 'student') : users;

  const filteredGroups = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    const filtered = groups.filter(group => {
      const teacherId = typeof group.teacher === 'string' ? group.teacher : group.teacher.id;
      const haystack = [
        group.name,
        getCourseDisplayName(group.course),
        getUserDisplayName(group.teacher),
      ]
        .join(' ')
        .toLowerCase();

      const matchesTeacher = teacherFilter === 'all' || teacherId === teacherFilter;
      return matchesTeacher && haystack.includes(normalizedSearch);
    });

    return sortBy(filtered, item => item.name.toLowerCase(), sortDirection);
  }, [groups, search, sortDirection, teacherFilter]);

  if (groupsQuery.isLoading) {
    return <LoadingState label="Loading groups..." />;
  }

  if (groupsQuery.error) {
    return <ErrorState description={groupsQuery.error.message} onRetry={() => void groupsQuery.refetch()} />;
  }

  const totalPages = Math.max(1, Math.ceil(filteredGroups.length / pageSize));
  const pagedGroups = paginate(filteredGroups, page, pageSize);
  const totalLinkedStudents = groups.reduce((sum, item) => sum + item.students.length, 0);

  return (
    <PageLayout
      eyebrow="Cohorts"
      title="Groups"
      description="Organize cohorts, assign responsible teachers, and keep the student roster visible at a glance."
      actions={canManage ? <Button onClick={() => { setSelectedGroup(null); setFormOpen(true); }}>New group</Button> : undefined}
    >
      <div className="dashboard-grid">
        <Card className="metric-card">
          <span className="subtle">Visible groups</span>
          <strong>{filteredGroups.length}</strong>
          <span className="subtle">After filters and search</span>
        </Card>
        <Card className="metric-card">
          <span className="subtle">Linked students</span>
          <strong>{totalLinkedStudents}</strong>
          <span className="subtle">Across all loaded groups</span>
        </Card>
      </div>
      {groups.length === 0 ? (
        <EmptyState title="No groups yet" description="Create the first cohort to start assigning students and teachers." />
      ) : (
        <TableShell
          title="Group registry"
          description="Each row shows the course context, teacher owner, and current student roster."
          actions={<Pagination page={page} totalPages={totalPages} onChange={setPage} />}
        >
          <TableToolbar
            search={search}
            onSearchChange={value => {
              setSearch(value);
              setPage(1);
            }}
            searchPlaceholder="Search by group, course, or teacher"
            resultsLabel={`${filteredGroups.length} result${filteredGroups.length === 1 ? '' : 's'}`}
            filters={
              <>
                <Select value={teacherFilter} onChange={event => setTeacherFilter(event.target.value)}>
                  <option value="all">All teachers</option>
                  {teachers.map(teacher => (
                    <option key={teacher.id} value={teacher.id}>
                      {getUserDisplayName(teacher)}
                    </option>
                  ))}
                </Select>
                <Select value={sortDirection} onChange={event => setSortDirection(event.target.value as SortDirection)}>
                  <option value="asc">Name A-Z</option>
                  <option value="desc">Name Z-A</option>
                </Select>
              </>
            }
          />
          <DataTable
            getRowKey={item => item.id}
            columns={[
              {
                key: 'group',
                header: 'Group',
                cell: item => (
                  <div className="cell-stack">
                    <span className="cell-title">{item.name}</span>
                    <span className="cell-meta">{getCourseDisplayName(item.course)}</span>
                  </div>
                ),
              },
              {
                key: 'teacher',
                header: 'Teacher',
                cell: item => (
                  <div className="cell-stack">
                    <span className="cell-title">{getUserDisplayName(item.teacher)}</span>
                    <span className="cell-meta">Responsible teacher</span>
                  </div>
                ),
              },
              {
                key: 'students',
                header: 'Students',
                cell: item => (
                  <div className="cell-stack">
                    <span className="cell-title">{item.students.length} students</span>
                    <span className="cell-meta">{getUserListSummary(item.students)}</span>
                  </div>
                ),
              },
              {
                key: 'status',
                header: 'Status',
                cell: item => (
                  <Badge tone={item.students.length > 0 ? 'success' : 'warning'}>
                    {item.students.length > 0 ? 'Active roster' : 'No students yet'}
                  </Badge>
                ),
              },
              {
                key: 'actions',
                header: 'Actions',
                cell: item => (
                  <div className="inline-actions">
                    {canManage ? (
                      <>
                        <Button size="sm" variant="secondary" onClick={() => { setSelectedGroup(item); setFormOpen(true); }}>
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
            rows={pagedGroups}
            emptyTitle="No matching groups"
            emptyDescription="Adjust the teacher filter or broaden the search query."
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
        loading={createMutation.isPending || updateMutation.isPending}
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
        title="Delete group?"
        description={
          deleteCandidate
            ? `This will permanently remove group "${deleteCandidate.name}" from the cohort registry. Course: ${getCourseDisplayName(deleteCandidate.course)}. Teacher: ${getUserDisplayName(deleteCandidate.teacher)}. This action cannot be undone.`
            : ''
        }
        confirmLabel="Delete group"
        cancelLabel="Keep group"
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
