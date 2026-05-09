import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { coursesApi } from '../../entities/course/api';
import { groupsApi } from '../../entities/group/api';
import { roomsApi } from '../../entities/room/api';
import { scheduleApi, ScheduleFormValues, ScheduleItem } from '../../entities/schedule/api';
import { usersApi } from '../../entities/user/api';
import { adminLikeRoles } from '../../app/router/navigation';
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
import { useI18n } from '../../shared/i18n/i18n';

const pageSize = 8;

export function SchedulePage() {
  const queryClient = useQueryClient();
  const { t } = useI18n();
  const sessionUser = useAuthStore(state => state.user);
  const isAdminLike = !!sessionUser && adminLikeRoles.includes(sessionUser.role);
  const canManage = isAdminLike;
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
      toast.success(t('schedule.lessonCreated'));
      setFormOpen(false);
    },
    onError: error => toast.error(error.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: ScheduleFormValues }) => scheduleApi.update(id, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['schedule'] });
      toast.success(t('schedule.lessonUpdated'));
      setFormOpen(false);
    },
    onError: error => toast.error(error.message),
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => scheduleApi.remove(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['schedule'] });
      toast.success(t('schedule.lessonDeleted'));
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
    ...(isAdminLike && teacherFilter !== 'all' ? [t('schedule.filterTeacherValue', { teacher: selectedTeacherLabel })] : []),
    ...(canManage && groupFilter !== 'all' ? [t('schedule.filterGroupValue', { group: selectedGroupLabel })] : []),
    ...(sortDirection === 'desc' ? [t('schedule.sortOrderDesc')] : []),
  ];

  if (scheduleQuery.isLoading) {
    return <LoadingState label={t('schedule.loading')} />;
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
      header: t('schedule.session'),
      className: 'data-table__cell--primary',
      cell: item => (
        <div className="cell-stack cell-stack--primary cell-stack--relation">
          <span className="cell-title">{getCourseDisplayName(item.course)}</span>
          <span className="cell-meta cell-meta--strong">{formatDateTime(item.timeStart)}</span>
          <span className="cell-meta">{t('schedule.endsAt', { time: formatDateTime(item.timeEnd) })}</span>
        </div>
      ),
    },
    {
      key: 'assignment',
      header: t('schedule.assignment'),
      className: 'data-table__cell--relation',
      cell: item => (
        <div className="cell-stack cell-stack--relation">
          <span className="cell-title">{getRoomDisplayName(item.room)}</span>
          <span className="cell-meta">{item.group ? getGroupDisplayName(item.group) : t('schedule.noGroupLinked')}</span>
        </div>
      ),
    },
    {
      key: 'people',
      header: canManage ? t('schedule.people') : t('dashboard.table.teacher'),
      className: 'data-table__cell--relation',
      cell: item => (
        <div className="cell-stack cell-stack--relation">
          <span className="cell-title">{getUserDisplayName(item.teacher)}</span>
          {canManage ? (
            <>
              <span className="cell-meta">{t('schedule.studentsLinked', { count: item.students?.length ?? 0 })}</span>
              <span className="cell-meta">{getUserListSummary(item.students)}</span>
            </>
          ) : (
            <span className="cell-meta">{t('schedule.assignedTeacher')}</span>
          )}
        </div>
      ),
    },
    ...(canManage
      ? [
          {
            key: 'actions',
            header: t('common.actions'),
            className: 'data-table__cell--actions',
            headClassName: 'data-table__head--actions',
            cell: (item: ScheduleItem) => (
              <div className="row-actions">
                <Button size="sm" variant="secondary" onClick={() => { setSelectedItem(item); setFormOpen(true); }}>
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
      eyebrow={t('schedule.eyebrow')}
      title={t('schedule.title')}
      description={
        isAdminLike
          ? t('schedule.description.admin')
          : isTeacher
            ? t('schedule.description.teacher')
            : t('schedule.description.student')
      }
      actions={canManage ? <Button onClick={() => { setSelectedItem(null); setFormOpen(true); }}>{t('schedule.newLesson')}</Button> : undefined}
    >
      <div className="dashboard-grid">
        <Card className="metric-card">
          <span className="subtle">{t('schedule.visibleLessons')}</span>
          <strong>{filteredItems.length}</strong>
          <span className="subtle">{t('users.afterFilters')}</span>
        </Card>
        <Card className="metric-card">
          <span className="subtle">{canManage ? t('schedule.linkedGroups') : t('schedule.assignedRooms')}</span>
          <strong>{canManage ? linkedGroups : assignedRooms}</strong>
          <span className="subtle">
            {canManage ? t('schedule.linkedGroupsMeta') : t('schedule.assignedRoomsMeta')}
          </span>
        </Card>
      </div>
      {visibleItems.length === 0 ? (
        <EmptyState
          title={isStudent ? t('schedule.emptyTitle.student') : t('schedule.emptyTitle.manage')}
          description={canManage ? t('schedule.emptyDescription.manage') : t('schedule.emptyDescription.student')}
        />
      ) : (
        <TableShell
          title={t('schedule.lessonPlan')}
          description={canManage ? t('schedule.lessonPlanDescription.manage') : t('schedule.lessonPlanDescription.student')}
          actions={<Pagination page={page} totalPages={totalPages} onChange={setPage} />}
        >
          <TableToolbar
            search={search}
            onSearchChange={value => {
              setSearch(value);
              setPage(1);
            }}
            searchPlaceholder={canManage ? t('schedule.searchPlaceholder.manage') : t('schedule.searchPlaceholder.student')}
            resultsLabel={t('common.resultsLabel', { count: filteredItems.length })}
            activeFilters={toolbarFilters}
            filters={
              <>
                {isAdminLike ? (
                  <Select
                    aria-label={t('schedule.filterTeacher')}
                    value={teacherFilter}
                    onChange={event => {
                      setTeacherFilter(event.target.value);
                      setPage(1);
                    }}
                  >
                    <option value="all">{t('schedule.optionAllTeachers')}</option>
                    {teachers.map(teacher => (
                      <option key={teacher.id} value={teacher.id}>
                        {getUserDisplayName(teacher)}
                      </option>
                    ))}
                  </Select>
                ) : null}
                {canManage ? (
                  <Select
                    aria-label={t('schedule.filterGroup')}
                    value={groupFilter}
                    onChange={event => {
                      setGroupFilter(event.target.value);
                      setPage(1);
                    }}
                  >
                    <option value="all">{t('schedule.optionAllGroups')}</option>
                    {(support?.groups ?? []).map(group => (
                      <option key={group.id} value={group.id}>
                        {getGroupDisplayName(group)}
                      </option>
                    ))}
                  </Select>
                ) : null}
                <Select
                  aria-label={t('schedule.sortLabel')}
                  value={sortDirection}
                  onChange={event => {
                    setSortDirection(event.target.value as SortDirection);
                    setPage(1);
                  }}
                >
                  <option value="asc">{t('schedule.optionSoonestFirst')}</option>
                  <option value="desc">{t('schedule.optionLatestFirst')}</option>
                </Select>
              </>
            }
          />
          <DataTable
            getRowKey={item => item.id}
            emptyTitle={t('schedule.emptyTitle')}
            emptyDescription={canManage ? t('common.tryAnotherSearch') : t('common.trySearch')}
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
        title={t('schedule.deleteLessonTitle')}
        description={
          deleteCandidate
            ? t('schedule.deleteLessonDescriptionLong', {
                course: getCourseDisplayName(deleteCandidate.course),
                room: getRoomDisplayName(deleteCandidate.room),
                time: formatDateTime(deleteCandidate.timeStart),
                group: deleteCandidate.group ? getGroupDisplayName(deleteCandidate.group) : t('schedule.noGroupLinked'),
              })
            : ''
        }
        confirmLabel={t('schedule.deleteLessonConfirm')}
        cancelLabel={t('schedule.keepLesson')}
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
