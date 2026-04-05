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
import { DataTable } from '../../shared/ui/data-display/data-table';
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

const pageSize = 8;

export function UsersPage() {
  const queryClient = useQueryClient();
  const sessionUser = useAuthStore(state => state.user);
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
      toast.success('User created');
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
      toast.success('User updated');
      setFormOpen(false);
    },
    onError: error => toast.error(error.message),
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => usersApi.remove(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('User deleted');
    },
    onError: error => toast.error(error.message),
  });

  const users = query.data ?? [];

  const filteredUsers = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    const filtered = users.filter(item => {
      const matchesRole = roleFilter === 'all' || item.role === roleFilter;
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
  }, [roleFilter, search, sortDirection, users]);

  const toolbarFilters = [
    ...(roleFilter !== 'all'
      ? [`Role: ${roleOptions.find(option => option.value === roleFilter)?.label ?? roleFilter}`]
      : []),
    ...(sortDirection === 'desc' ? ['Order: Name Z-A'] : []),
  ];

  if (query.isLoading) {
    return <LoadingState label="Loading users..." />;
  }

  if (query.error) {
    return <ErrorState description={query.error.message} onRetry={() => void query.refetch()} />;
  }

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / pageSize));
  const pagedUsers = paginate(filteredUsers, page, pageSize);

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
      eyebrow="People"
      title="Users"
      description={
        isAdminLike
          ? 'Manage accounts, roles, and contact details from one working directory.'
          : 'Teachers can use this directory to review student accounts and contact details.'
      }
      actions={isAdminLike ? <Button onClick={openCreate}>New user</Button> : undefined}
    >
      <div className="dashboard-grid">
        <Card className="metric-card">
          <span className="subtle">Visible users</span>
          <strong>{filteredUsers.length}</strong>
          <span className="subtle">After filters and search</span>
        </Card>
        <Card className="metric-card">
          <span className="subtle">Active accounts</span>
          <strong>{users.filter(item => item.isActive).length}</strong>
          <span className="subtle">Marked as active</span>
        </Card>
      </div>

      {users.length === 0 ? (
        <EmptyState title="No people yet" description="No user records are visible in this workspace yet. New accounts will appear here as soon as they are available." />
      ) : (
        <TableShell
          title="User directory"
          description="Roles, status, and contact details for daily operations."
          actions={<Pagination page={page} totalPages={totalPages} onChange={setPage} />}
        >
          <TableToolbar
            search={search}
            onSearchChange={value => {
              setSearch(value);
              setPage(1);
            }}
            searchPlaceholder="Search by name, username, email, or phone"
            resultsLabel={`${filteredUsers.length} result${filteredUsers.length === 1 ? '' : 's'}`}
            activeFilters={toolbarFilters}
            filters={
              <>
                <Select
                  aria-label="Filter users by role"
                  value={roleFilter}
                  onChange={event => {
                    setRoleFilter(event.target.value as 'all' | Role);
                    setPage(1);
                  }}
                >
                  <option value="all">All roles</option>
                  {roleOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
                <Select
                  aria-label="Sort users"
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
            emptyTitle="No people match this view"
            emptyDescription="Try a different search or clear the current role filter."
            columns={[
              {
                key: 'user',
                header: 'User',
                className: 'data-table__cell--primary',
                cell: item => (
                  <div className="cell-stack cell-stack--primary cell-stack--relation">
                    <span className="cell-title">{getUserDisplayName(item)}</span>
                    <span className="cell-meta cell-meta--strong">@{item.username}</span>
                    <span className="cell-meta">{item.phoneNumber || item.email || 'No contact details yet'}</span>
                  </div>
                ),
              },
              {
                key: 'access',
                header: 'Access',
                className: 'data-table__cell--relation',
                cell: item => (
                  <div className="cell-stack cell-stack--relation">
                    <div className="cell-badges">
                      <Badge tone="info">{getRoleDisplayName(item.role)}</Badge>
                      <Badge tone={item.isActive ? 'success' : 'warning'}>
                        {item.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <span className="cell-meta">
                      {item.telegramId ? `Telegram linked: ${item.telegramId}` : 'Telegram not linked'}
                    </span>
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
                    <Button size="sm" variant="ghost" onClick={() => openDetail(item)}>
                      View
                    </Button>
                    {isAdminLike ? (
                      <>
                        <Button size="sm" variant="secondary" onClick={() => openEdit(item)}>
                          Edit
                        </Button>
                        <Button size="sm" variant="danger" onClick={() => setDeleteCandidate(item)}>
                          Delete
                        </Button>
                      </>
                    ) : null}
                  </div>
                ),
              },
            ]}
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

      <UserDetailModal open={detailOpen} user={selectedUser} onClose={() => setDetailOpen(false)} />
      <ConfirmModal
        open={!!deleteCandidate}
        title="Delete user?"
        description={
          deleteCandidate
            ? `This will permanently remove ${getUserDisplayName(deleteCandidate)} (@${deleteCandidate.username}, ${getRoleDisplayName(deleteCandidate.role)}) from the CRM. This action cannot be undone.`
            : ''
        }
        confirmLabel="Delete user"
        cancelLabel="Keep user"
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
