import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { usersApi, UserFormValues } from '../../entities/user/api';
import { useAuthStore } from '../../features/auth/model/auth-store';
import { adminLikeRoles } from '../../app/router/navigation';
import { PageLayout } from '../../widgets/page/page-layout';
import { LoadingState } from '../../shared/ui/feedback/loading-state';
import { ErrorState } from '../../shared/ui/feedback/error-state';
import { EmptyState } from '../../shared/ui/feedback/empty-state';
import { TableShell } from '../../shared/ui/data-display/table-shell';
import { DataTable, type Column } from '../../shared/ui/data-display/data-table';
import { Badge } from '../../shared/ui/badges/badge';
import { Card } from '../../shared/ui/surfaces/card';
import { Button } from '../../shared/ui/buttons/button';
import { Select } from '../../shared/ui/forms/select';
import { TableToolbar } from '../../shared/ui/data-display/table-toolbar';
import { Pagination } from '../../shared/ui/data-display/pagination';
import { getRoleDisplayName, getUserDisplayName } from '../../shared/lib/entity-display';
import { paginate, sortBy, SortDirection } from '../../shared/lib/table';
import { roleOptions, Role, AppUser } from '../../shared/types/auth';
import { toast } from '../../shared/ui/feedback/toaster';
import { UserDetailModal } from './user-detail-modal';
import { UserFormInput, UserFormModal } from './user-form-modal';
import { ConfirmModal } from '../../shared/ui/overlay/confirm-modal';
import { useI18n } from '../../shared/i18n/i18n';

const pageSize = 8;

export function UsersPage() {
  const queryClient = useQueryClient();
  const sessionUser = useAuthStore(state => state.user);
  const { t } = useI18n();
  const isAdminLike = !!sessionUser && adminLikeRoles.includes(sessionUser.role);

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | Role>('all');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [page, setPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState<AppUser | null>(null);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [formOpen, setFormOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [deleteCandidate, setDeleteCandidate] = useState<AppUser | null>(null);

  const query = useQuery({
    queryKey: ['users', isAdminLike ? 'all' : 'students'],
    queryFn: () => (isAdminLike ? usersApi.getAll() : usersApi.getStudents()),
    enabled: !!sessionUser,
  });

  const createMutation = useMutation({
    mutationFn: (payload: UserFormValues & { password: string }) => usersApi.create(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success(t('common.saved'));
      setFormOpen(false);
    },
    onError: error => toast.error(error.message),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, values, previousRole }: { id: string; values: UserFormInput; previousRole: Role }) => {
      const { role, password, ...rest } = values;
      const payload: UserFormValues = { ...rest };

      if (password) {
        payload.password = password;
      }

      const updated = await usersApi.update(id, payload);

      if (role && role !== previousRole) {
        return usersApi.updateRole(id, role);
      }

      return updated;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success(t('common.updated'));
      setFormOpen(false);
    },
    onError: error => toast.error(error.message),
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => usersApi.remove(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success(t('common.deleted'));
    },
    onError: error => toast.error(error.message),
  });

  const users = query.data ?? [];
  const usersWithContact = users.filter(item => item.phoneNumber || item.email).length;

  const filteredUsers = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    const filtered = users.filter(item => {
      const matchesRole = !isAdminLike || roleFilter === 'all' || item.role === roleFilter;
      const haystack = [
        item.username,
        item.firstName,
        item.lastName,
        item.email,
        item.phoneNumber,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return matchesRole && haystack.includes(normalizedSearch);
    });

    return sortBy(filtered, item => getUserDisplayName(item).toLowerCase(), sortDirection);
  }, [isAdminLike, roleFilter, search, sortDirection, users]);

  const toolbarFilters = [
    ...(isAdminLike && roleFilter !== 'all'
      ? [t('users.filterRole', { role: roleOptions.find(option => option.value === roleFilter)?.label ?? roleFilter })]
      : []),
    ...(sortDirection === 'desc' ? [t('users.sortOrderDesc')] : []),
  ];

  if (query.isLoading) {
    return <LoadingState label={t('common.loading')} />;
  }

  if (query.error) {
    return <ErrorState description={query.error.message} onRetry={() => void query.refetch()} />;
  }

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / pageSize));
  const pagedUsers = paginate(filteredUsers, page, pageSize);
  const columns: Column<AppUser>[] = [
    {
      key: 'user',
      header: t('users.userLabel'),
      className: 'data-table__cell--primary',
      cell: item => (
        <div className="cell-stack cell-stack--primary cell-stack--relation">
          <span className="cell-title">{getUserDisplayName(item)}</span>
          {isAdminLike ? <span className="cell-meta cell-meta--strong">@{item.username}</span> : null}
          <span className="cell-meta">{item.phoneNumber || item.email || t('users.noContactDetailsLabel')}</span>
        </div>
      ),
    },
    ...(isAdminLike
      ? [
          {
            key: 'access',
            header: t('users.accessLabel'),
            className: 'data-table__cell--relation',
            cell: (item: AppUser) => (
              <div className="cell-stack cell-stack--relation">
                <div className="cell-badges">
                  <Badge tone="info">{getRoleDisplayName(item.role)}</Badge>
                  <Badge tone={item.isActive ? 'success' : 'warning'}>
                    {item.isActive ? t('common.active') : t('common.inactive')}
                  </Badge>
                </div>
                <span className="cell-meta">
                  {item.telegramId ? `${t('users.telegramLinked')}: ${item.telegramId}` : t('users.telegramNotLinked')}
                </span>
              </div>
            ),
          },
        ]
      : [
          {
            key: 'contact',
            header: t('users.contactLabel'),
            className: 'data-table__cell--relation',
            cell: (item: AppUser) => (
              <div className="cell-stack cell-stack--relation">
                <span className="cell-title">{item.email || item.phoneNumber || t('users.noContactDetailsLabel')}</span>
                <span className="cell-meta">
                  {item.email && item.phoneNumber
                    ? item.phoneNumber
                    : item.email
                      ? t('users.emailOnFile')
                      : item.phoneNumber
                        ? t('users.phoneOnFile')
                        : t('users.noEmailOrPhone')}
                </span>
              </div>
            ),
          },
        ]),
    {
      key: 'actions',
      header: t('common.actions'),
      className: 'data-table__cell--actions',
      headClassName: 'data-table__head--actions',
      cell: item => (
        <div className="row-actions">
          <Button size="sm" variant="ghost" onClick={() => openDetail(item)}>
            {t('users.viewButton')}
          </Button>
          {isAdminLike ? (
            <>
              <Button size="sm" variant="secondary" onClick={() => openEdit(item)}>
                {t('users.editButton')}
              </Button>
              <Button size="sm" variant="danger" onClick={() => setDeleteCandidate(item)}>
                {t('users.deleteButton')}
              </Button>
            </>
          ) : null}
        </div>
      ),
    },
  ];

  const openCreate = () => {
    setSelectedUser(null);
    setFormMode('create');
    setFormOpen(true);
  };

  const openEdit = (user: AppUser) => {
    setSelectedUser(user);
    setFormMode('edit');
    setFormOpen(true);
  };

  const openDetail = (user: AppUser) => {
    setSelectedUser(user);
    setDetailOpen(true);
  };

  return (
    <PageLayout
      eyebrow={t('users.eyebrow')}
      title={t('users.title')}
      description={
        isAdminLike
          ? t('users.description.admin')
          : t('users.description.student')
      }
      actions={isAdminLike ? <Button onClick={openCreate}>{t('users.newUser')}</Button> : undefined}
    >
      <div className="dashboard-grid">
        <Card className="metric-card">
          <span className="subtle">{t('users.visibleUsers')}</span>
          <strong>{filteredUsers.length}</strong>
          <span className="subtle">{t('users.afterFilters')}</span>
        </Card>
        <Card className="metric-card">
          <span className="subtle">{isAdminLike ? t('users.activeAccounts') : t('users.withContactInfo')}</span>
          <strong>{isAdminLike ? users.filter(item => item.isActive).length : usersWithContact}</strong>
          <span className="subtle">{isAdminLike ? t('users.activeAccountsMeta') : t('users.withContactInfoMeta')}</span>
        </Card>
      </div>

      {users.length === 0 ? (
        <EmptyState
          title={isAdminLike ? t('users.noUsersYet') : t('users.noStudentsYet')}
          description={
            isAdminLike
              ? t('users.noUsersFoundDescription.admin')
              : t('users.noUsersFoundDescription.student')
          }
        />
      ) : (
        <TableShell
          title={t('users.userDirectory')}
          description={isAdminLike ? t('users.directoryDescription.admin') : t('users.directoryDescription.student')}
          actions={<Pagination page={page} totalPages={totalPages} onChange={setPage} />}
        >
          <TableToolbar
            search={search}
            onSearchChange={value => {
              setSearch(value);
              setPage(1);
            }}
            searchPlaceholder={isAdminLike ? t('users.searchPlaceholder.admin') : t('users.searchPlaceholder.student')}
            resultsLabel={t('common.resultsLabel', { count: filteredUsers.length })}
            activeFilters={toolbarFilters}
            filters={
              <>
                {isAdminLike ? (
                  <Select
                    aria-label={t('users.filterByRoleLabel')}
                    value={roleFilter}
                    onChange={event => {
                      setRoleFilter(event.target.value as 'all' | Role);
                      setPage(1);
                    }}
                  >
                    <option value="all">{t('users.allRoles')}</option>
                    {roleOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Select>
                ) : null}
                <Select
                  aria-label={t('users.sortUsersLabel')}
                  value={sortDirection}
                  onChange={event => {
                    setSortDirection(event.target.value as SortDirection);
                    setPage(1);
                  }}
                >
                  <option value="asc">{t('users.sortNameAsc')}</option>
                  <option value="desc">{t('users.sortNameDesc')}</option>
                </Select>
              </>
            }
          />
          <DataTable
            getRowKey={item => item.id}
            emptyTitle={isAdminLike ? t('users.noUsersFound') : t('users.noStudentsFound')}
            emptyDescription={isAdminLike ? t('users.noUsersFoundDescription.admin') : t('users.noUsersFoundDescription.student')}
            columns={columns}
            rows={pagedUsers}
          />
        </TableShell>
      )}

      <UserFormModal
        open={formOpen}
        mode={formMode}
        user={selectedUser}
        loading={createMutation.isPending || updateMutation.isPending}
        onClose={() => setFormOpen(false)}
        onSubmit={async values => {
          if (formMode === 'create') {
            await createMutation.mutateAsync({
              ...values,
              password: values.password || '',
            });
            return;
          }

          if (!selectedUser) {
            return;
          }

          await updateMutation.mutateAsync({
            id: selectedUser.id,
            values,
            previousRole: selectedUser.role,
          });
        }}
      />

      <UserDetailModal
        open={detailOpen}
        user={selectedUser}
        showAccountDetails={isAdminLike}
        onClose={() => setDetailOpen(false)}
      />
      <ConfirmModal
        open={!!deleteCandidate}
        title={t('users.deleteUserTitle')}
        description={
          deleteCandidate
            ? `${t('users.deleteUserDescription')} ${getUserDisplayName(deleteCandidate)} (@${deleteCandidate.username}, ${getRoleDisplayName(deleteCandidate.role)})`
            : ''
        }
        confirmLabel={t('users.deleteUserConfirm')}
        cancelLabel={t('common.cancel')}
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
