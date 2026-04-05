import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { coursesApi } from '../../entities/course/api';
import { groupsApi } from '../../entities/group/api';
import { roomsApi } from '../../entities/room/api';
import { scheduleApi, ScheduleFormValues, ScheduleItem } from '../../entities/schedule/api';
import { usersApi } from '../../entities/user/api';
import { teachingRoles, adminLikeRoles } from '../../app/router/navigation';
import { useAuthStore } from '../../features/auth/model/auth-store';
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
import { formatDateTime } from '../../shared/lib/date';
import {
  getCourseDisplayName,
  getGroupDisplayName,
  getRoomDisplayName,
  getUserDisplayName,
  getUserListSummary,
} from '../../shared/lib/entity-display';
import { paginate, sortBy, SortDirection } from '../../shared/lib/table';
import { toast } from '../../shared/ui/feedback/toaster';
import { ScheduleFormModal } from './schedule-form-modal';
import { ConfirmModal } from '../../shared/ui/overlay/confirm-modal';

const pageSize = 8;

export function SchedulePage() {
  const queryClient = useQueryClient();
  const sessionUser = useAuthStore(state => state.user);
  const canManage = !!sessionUser && teachingRoles.includes(sessionUser.role);
  const isAdminLike = !!sessionUser && adminLikeRoles.includes(sessionUser.role);
  const isTeacher = sessionUser?.role === 'teacher';
  const isStudent = sessionUser?.role === 'student';
  const canSeeFull = canManage;

  const [search, setSearch] = useState('');
  const [teacherFilter, setTeacherFilter] = useState<'all' | string>('all');
  const [groupFilter, setGroupFilter] = useState<'all' | string>('all');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [page, setPage] = useState(1);
  const [selectedItem, setSelectedItem] = useState<ScheduleItem | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteCandidate, setDeleteCandidate] = useState<ScheduleItem | null>(null);

  const scheduleQuery = useQuery({
    queryKey: ['schedule', canSeeFull ? 'all' : 'me'],
    queryFn: () => (canSeeFull ? scheduleApi.getAll() : scheduleApi.getMine()),
    enabled: !!sessionUser,
  });

  const supportQuery = useQuery({
    queryKey: ['schedule-support', isAdminLike ? 'all' : 'students'],
    queryFn: async () => {
      const [courses, rooms, groups, users] = await Promise.all([
        coursesApi.getAll(),
        roomsApi.getAll(),
        groupsApi.getAll(),
        isAdminLike ? usersApi.getAll() : usersApi.getStudents(),
      ]);
      return { courses, rooms, groups, users };
    },
    enabled: canManage,
  });

  const createMutation = useMutation({
    mutationFn: (payload: ScheduleFormValues) => scheduleApi.create(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['schedule'] });
      toast.success('Lesson created');
      setFormOpen(false);
    },
    onError: error => toast.error(error.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: ScheduleFormValues }) => scheduleApi.update(id, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['schedule'] });
      toast.success('Lesson updated');
      setFormOpen(false);
    },
    onError: error => toast.error(error.message),
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => scheduleApi.remove(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['schedule'] });
      toast.success('Lesson deleted');
    },
    onError: error => toast.error(error.message),
  });

  const items = scheduleQuery.data ?? [];
  const support = supportQuery.data;
  const teachers = canManage
    ? isAdminLike
      ? (support?.users ?? []).filter(user => user.role === 'teacher')
      : sessionUser
        ? [sessionUser]
        : []
    : [];
  const students = canManage ? (isAdminLike ? (support?.users ?? []).filter(user => user.role === 'student') : support?.users ?? []) : [];
  const visibleItems = useMemo(() => {
    if (!sessionUser || isAdminLike) {
      return items;
    }

    if (isTeacher) {
      return items.filter(item => {
        const teacherId = typeof item.teacher === 'string' ? item.teacher : item.teacher.id;
        return teacherId === sessionUser.id;
      });
    }

    return items;
  }, [isAdminLike, isTeacher, items, sessionUser]);

  const filteredItems = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    const filtered = visibleItems.filter(item => {
      const teacherId = typeof item.teacher === 'string' ? item.teacher : item.teacher.id;
      const groupId = typeof item.group === 'string' ? item.group : item.group?.id;
      const haystack = [
        getCourseDisplayName(item.course),
        getRoomDisplayName(item.room),
        getUserDisplayName(item.teacher),
        getGroupDisplayName(item.group),
      ]
        .join(' ')
        .toLowerCase();

      const matchesTeacher = !isAdminLike || teacherFilter === 'all' || teacherId === teacherFilter;
      const matchesGroup = !canManage || groupFilter === 'all' || groupId === groupFilter;
      return matchesTeacher && matchesGroup && haystack.includes(normalizedSearch);
    });

    return sortBy(filtered, item => item.timeStart, sortDirection);
  }, [canManage, groupFilter, isAdminLike, search, sortDirection, teacherFilter, visibleItems]);

  const selectedTeacherLabel =
    teacherFilter === 'all' ? '' : getUserDisplayName(teachers.find(teacher => teacher.id === teacherFilter));
  const selectedGroupLabel =
    groupFilter === 'all' ? '' : getGroupDisplayName((support?.groups ?? []).find(group => group.id === groupFilter));

  const toolbarFilters = [
    ...(isAdminLike && teacherFilter !== 'all' ? [`Teacher: ${selectedTeacherLabel}`] : []),
    ...(canManage && groupFilter !== 'all' ? [`Group: ${selectedGroupLabel}`] : []),
    ...(sortDirection === 'desc' ? ['Order: Latest first'] : []),
  ];

  if (scheduleQuery.isLoading) {
    return <LoadingState label="Loading schedule..." />;
  }

  if (scheduleQuery.error) {
    return <ErrorState description={scheduleQuery.error.message} onRetry={() => void scheduleQuery.refetch()} />;
  }

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / pageSize));
  const pagedItems = paginate(filteredItems, page, pageSize);
  const linkedGroups = visibleItems.filter(item => item.group).length;
  const assignedRooms = visibleItems.filter(item => item.room).length;
  const columns: Column<ScheduleItem>[] = [
    {
      key: 'session',
      header: 'Session',
      className: 'data-table__cell--primary',
      cell: item => (
        <div className="cell-stack cell-stack--primary cell-stack--relation">
          <span className="cell-title">{getCourseDisplayName(item.course)}</span>
          <span className="cell-meta cell-meta--strong">{formatDateTime(item.timeStart)}</span>
          <span className="cell-meta">Ends {formatDateTime(item.timeEnd)}</span>
        </div>
      ),
    },
    {
      key: 'assignment',
      header: 'Assignment',
      className: 'data-table__cell--relation',
      cell: item => (
        <div className="cell-stack cell-stack--relation">
          <span className="cell-title">{getRoomDisplayName(item.room)}</span>
          <span className="cell-meta">{item.group ? getGroupDisplayName(item.group) : 'No group linked'}</span>
        </div>
      ),
    },
    {
      key: 'people',
      header: canManage ? 'People' : 'Teacher',
      className: 'data-table__cell--relation',
      cell: item => (
        <div className="cell-stack cell-stack--relation">
          <span className="cell-title">{getUserDisplayName(item.teacher)}</span>
          {canManage ? (
            <>
              <span className="cell-meta">{item.students?.length ?? 0} students linked</span>
              <span className="cell-meta">{getUserListSummary(item.students)}</span>
            </>
          ) : (
            <span className="cell-meta">Assigned teacher</span>
          )}
        </div>
      ),
    },
    ...(canManage
      ? [
          {
            key: 'actions',
            header: 'Actions',
            className: 'data-table__cell--actions',
            headClassName: 'data-table__head--actions',
            cell: (item: ScheduleItem) => (
              <div className="row-actions">
                <Button size="sm" variant="secondary" onClick={() => { setSelectedItem(item); setFormOpen(true); }}>
                  Edit
                </Button>
                {isAdminLike ? (
                  <Button size="sm" variant="danger" onClick={() => setDeleteCandidate(item)}>
                    Delete
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
      eyebrow="Operations"
      title="Schedule"
      description={
        isAdminLike
          ? 'Lessons, rooms, groups, teachers, and students.'
          : isTeacher
            ? 'Your lessons, rooms, groups, and attendance.'
            : 'Your lesson schedule.'
      }
      actions={canManage ? <Button onClick={() => { setSelectedItem(null); setFormOpen(true); }}>New lesson</Button> : undefined}
    >
      <div className="dashboard-grid">
        <Card className="metric-card">
          <span className="subtle">Visible lessons</span>
          <strong>{filteredItems.length}</strong>
          <span className="subtle">After filters and search</span>
        </Card>
        <Card className="metric-card">
          <span className="subtle">{canManage ? 'Linked groups' : 'Assigned rooms'}</span>
          <strong>{canManage ? linkedGroups : assignedRooms}</strong>
          <span className="subtle">
            {canManage ? 'Lessons already attached to a cohort' : 'Lessons with a room assigned'}
          </span>
        </Card>
      </div>
      {visibleItems.length === 0 ? (
        <EmptyState
          title={isStudent ? 'No lessons scheduled' : 'No lessons yet'}
          description={canManage ? 'Planned lessons will appear here.' : 'Your upcoming lessons will appear here.'}
        />
      ) : (
        <TableShell
          title="Lesson plan"
          description={canManage ? 'Time, room, group, teacher, and students.' : 'Time, room, and teacher.'}
          actions={<Pagination page={page} totalPages={totalPages} onChange={setPage} />}
        >
          <TableToolbar
            search={search}
            onSearchChange={value => {
              setSearch(value);
              setPage(1);
            }}
            searchPlaceholder={canManage ? 'Search by course, room, teacher, or group' : 'Search by course, room, or teacher'}
            resultsLabel={`${filteredItems.length} result${filteredItems.length === 1 ? '' : 's'}`}
            activeFilters={toolbarFilters}
            filters={
              <>
                {isAdminLike ? (
                  <Select
                    aria-label="Filter lessons by teacher"
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
                ) : null}
                {canManage ? (
                  <Select
                    aria-label="Filter lessons by group"
                    value={groupFilter}
                    onChange={event => {
                      setGroupFilter(event.target.value);
                      setPage(1);
                    }}
                  >
                    <option value="all">All groups</option>
                    {(support?.groups ?? []).map(group => (
                      <option key={group.id} value={group.id}>
                        {getGroupDisplayName(group)}
                      </option>
                    ))}
                  </Select>
                ) : null}
                <Select
                  aria-label="Sort lessons"
                  value={sortDirection}
                  onChange={event => {
                    setSortDirection(event.target.value as SortDirection);
                    setPage(1);
                  }}
                >
                  <option value="asc">Soonest first</option>
                  <option value="desc">Latest first</option>
                </Select>
              </>
            }
          />
          <DataTable
            getRowKey={item => item.id}
            emptyTitle="No lessons found"
            emptyDescription={canManage ? 'Try another search or clear a filter.' : 'Try another search.'}
            columns={columns}
            rows={pagedItems}
          />
        </TableShell>
      )}

      <ScheduleFormModal
        open={formOpen}
        item={selectedItem}
        courses={support?.courses ?? []}
        rooms={support?.rooms ?? []}
        groups={support?.groups ?? []}
        teachers={teachers}
        students={students}
        defaultTeacherId={!isAdminLike ? sessionUser?.id : undefined}
        teacherLocked={!isAdminLike}
        loading={createMutation.isPending || updateMutation.isPending}
        onClose={() => setFormOpen(false)}
        onSubmit={async values => {
          if (selectedItem) {
            await updateMutation.mutateAsync({ id: selectedItem.id, payload: values });
            return;
          }

          await createMutation.mutateAsync(values);
        }}
      />
      <ConfirmModal
        open={!!deleteCandidate}
        title="Delete lesson?"
        description={
          deleteCandidate
            ? `This will permanently remove the lesson for ${getCourseDisplayName(deleteCandidate.course)} in ${getRoomDisplayName(deleteCandidate.room)} on ${formatDateTime(deleteCandidate.timeStart)}${deleteCandidate.group ? ` for group ${getGroupDisplayName(deleteCandidate.group)}` : ''}. This action cannot be undone.`
            : ''
        }
        confirmLabel="Delete lesson"
        cancelLabel="Keep lesson"
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
