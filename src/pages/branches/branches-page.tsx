import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Branch, BranchFormValues, branchesApi } from '../../entities/branch/api';
import { useAuthStore } from '../../features/auth/model/auth-store';
import { getRoleCapabilities } from '../../shared/lib/capabilities';
import { useDebouncedValue } from '../../shared/hooks/use-debounced-value';
import { useUrlState } from '../../shared/hooks/use-url-state';
import { useI18n } from '../../shared/i18n/i18n';
import { Badge } from '../../shared/ui/badges/badge';
import { Button } from '../../shared/ui/buttons/button';
import { DataTable } from '../../shared/ui/data-display/data-table';
import { Pagination } from '../../shared/ui/data-display/pagination';
import { TableShell } from '../../shared/ui/data-display/table-shell';
import { TableToolbar } from '../../shared/ui/data-display/table-toolbar';
import { EmptyState } from '../../shared/ui/feedback/empty-state';
import { ErrorState } from '../../shared/ui/feedback/error-state';
import { LoadingState } from '../../shared/ui/feedback/loading-state';
import { toast } from '../../shared/ui/feedback/toaster';
import { Select } from '../../shared/ui/forms/select';
import { Card } from '../../shared/ui/surfaces/card';
import { PageLayout } from '../../widgets/page/page-layout';
import { BranchFormModal } from '../../features/branch-management/ui/branch-form-modal';

const pageSize = 10;

export function BranchesPage() {
  const user = useAuthStore(state => state.user);
  const capabilities = getRoleCapabilities(user?.role);
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const urlState = useUrlState();
  const [page, setPageState] = useState(urlState.getNumber('page', 1));
  const [search, setSearchState] = useState(urlState.getString('search'));
  const [active, setActiveState] = useState(urlState.getString('active'));
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const debouncedSearch = useDebouncedValue(search);

  const setPage = (value: number) => {
    setPageState(value);
    urlState.setValue('page', value > 1 ? value : undefined);
  };
  const setSearch = (value: string) => {
    setSearchState(value);
    setPageState(1);
    urlState.setValues({ search: value || undefined, page: undefined });
  };
  const setActive = (value: string) => {
    setActiveState(value);
    setPageState(1);
    urlState.setValues({ active: value || undefined, page: undefined });
  };

  const params = useMemo(() => ({
    page,
    limit: pageSize,
    search: debouncedSearch || undefined,
    active: active === '' ? undefined : active === 'true',
    sortBy: 'name',
    sortOrder: 'asc' as const,
  }), [active, debouncedSearch, page]);

  const query = useQuery({
    queryKey: ['branches', params],
    queryFn: () => branchesApi.getAllPage(params),
    enabled: capabilities.branches.view,
  });

  const updateMutation = useMutation({
    mutationFn: (values: BranchFormValues) => {
      if (!editingBranch) throw new Error('No branch selected');
      return branchesApi.update(editingBranch.id, values);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['branches'] });
      await queryClient.invalidateQueries({ queryKey: ['dashboard', 'finance-filter-options'] });
      toast.success(t('branches.saveSuccess'));
      setEditingBranch(null);
    },
    onError: error => toast.error(error.message || t('branches.saveFailed')),
  });

  if (!capabilities.branches.view) {
    return <ErrorState title={t('common.forbidden')} description={t('common.forbidden')} />;
  }

  if (query.isLoading) {
    return <LoadingState label={t('branches.loading')} />;
  }

  if (query.error) {
    return <ErrorState description={query.error.message} onRetry={() => void query.refetch()} />;
  }

  const branches = query.data?.items ?? [];
  const pagination = query.data?.pagination;

  return (
    <PageLayout
      eyebrow={t('branches.manage')}
      title={t('branches.title')}
      description={t('branches.description')}
    >
      <div className="dashboard-grid">
        <Card className="metric-card">
          <span className="subtle">{t('branches.title')}</span>
          <strong>{pagination?.total ?? branches.length}</strong>
          <span className="subtle">{t('branches.loadedFromBackend')}</span>
        </Card>
        <Card className="metric-card">
          <span className="subtle">{t('branches.active')}</span>
          <strong>{branches.filter(branch => branch.isActive !== false).length}</strong>
          <span className="subtle">{t('branches.visiblePage')}</span>
        </Card>
      </div>

      {branches.length === 0 ? (
        <EmptyState title={t('branches.noBranchesFound')} description={t('branches.noBranchesDescription')} />
      ) : (
        <TableShell
          title={t('branches.manage')}
          description={t('branches.tableDescription')}
          actions={(
            <TableToolbar
              search={search}
              onSearchChange={setSearch}
              searchPlaceholder={t('branches.searchPlaceholder')}
              resultsLabel={t('branches.resultsLabel', { count: pagination?.total ?? branches.length })}
              activeFilters={[
                active ? t('branches.filterStatus', { status: active === 'true' ? t('branches.active') : t('branches.inactive') }) : '',
              ].filter(Boolean)}
              filters={(
                <Select value={active} onChange={event => setActive(event.target.value)} aria-label={t('branches.status')}>
                  <option value="">{t('branches.anyStatus')}</option>
                  <option value="true">{t('branches.active')}</option>
                  <option value="false">{t('branches.inactive')}</option>
                </Select>
              )}
            />
          )}
        >
          <DataTable
            getRowKey={item => item.id}
            columns={[
              {
                key: 'name',
                header: t('branches.name'),
                className: 'data-table__cell--primary',
                cell: item => (
                  <div className="cell-stack cell-stack--primary">
                    <span className="cell-title">{item.name || item.id}</span>
                    <span className="cell-meta">{item.id}</span>
                  </div>
                ),
              },
              {
                key: 'address',
                header: t('branches.address'),
                cell: item => item.address || '-',
              },
              {
                key: 'phone',
                header: t('branches.phone'),
                cell: item => item.phone || '-',
              },
              {
                key: 'status',
                header: t('branches.status'),
                cell: item => (
                  <Badge tone={item.isActive === false ? 'warning' : 'success'}>
                    {item.isActive === false ? t('branches.inactive') : t('branches.active')}
                  </Badge>
                ),
              },
              ...(capabilities.branches.edit ? [{
                key: 'actions',
                header: t('common.actions'),
                className: 'data-table__cell--actions',
                cell: (item: Branch) => (
                  <Button type="button" size="sm" variant="ghost" onClick={() => setEditingBranch(item)}>
                    {t('branches.edit')}
                  </Button>
                ),
              }] : []),
            ]}
            rows={branches}
            emptyTitle={t('branches.noBranchesFound')}
            emptyDescription={t('branches.noBranchesDescription')}
          />
          <Pagination page={pagination?.page ?? page} totalPages={pagination?.totalPages ?? 1} onChange={setPage} />
        </TableShell>
      )}

      <BranchFormModal
        open={!!editingBranch}
        branch={editingBranch}
        loading={updateMutation.isPending}
        onClose={() => setEditingBranch(null)}
        onSubmit={async values => {
          await updateMutation.mutateAsync(values);
        }}
      />
    </PageLayout>
  );
}
