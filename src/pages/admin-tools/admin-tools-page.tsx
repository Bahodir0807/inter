import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { rolesApi } from '../../entities/role/api';
import { statisticsApi } from '../../entities/statistics/api';
import { phoneRequestsApi, PhoneRequestStatus } from '../../entities/phone-request/api';
import { PageLayout } from '../../widgets/page/page-layout';
import { Card } from '../../shared/ui/surfaces/card';
import { TableShell } from '../../shared/ui/data-display/table-shell';
import { DataTable } from '../../shared/ui/data-display/data-table';
import { TableToolbar } from '../../shared/ui/data-display/table-toolbar';
import { Pagination } from '../../shared/ui/data-display/pagination';
import { Button } from '../../shared/ui/buttons/button';
import { Input } from '../../shared/ui/forms/input';
import { Select } from '../../shared/ui/forms/select';
import { Textarea } from '../../shared/ui/forms/textarea';
import { Badge } from '../../shared/ui/badges/badge';
import { LoadingState } from '../../shared/ui/feedback/loading-state';
import { ErrorState } from '../../shared/ui/feedback/error-state';
import { formatDate } from '../../shared/lib/date';
import { toast } from '../../shared/ui/feedback/toaster';
import { useI18n } from '../../shared/i18n/i18n';

const pageSize = 10;

function parseMetadata(value: string) {
  if (!value.trim()) {
    return undefined;
  }
  return JSON.parse(value) as Record<string, unknown>;
}

export function AdminToolsPage() {
  const queryClient = useQueryClient();
  const { t } = useI18n();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [roleName, setRoleName] = useState('');
  const [permissions, setPermissions] = useState('');
  const [statType, setStatType] = useState('');
  const [statValue, setStatValue] = useState(0);
  const [statMetadata, setStatMetadata] = useState('');
  const [phoneStatus, setPhoneStatus] = useState<'all' | PhoneRequestStatus>('pending');

  const listParams = { page, limit: pageSize, search: search || undefined, sortBy: 'createdAt', sortOrder: 'desc' as const };
  const rolesQuery = useQuery({
    queryKey: ['roles', listParams],
    queryFn: () => rolesApi.getAllPage(listParams),
  });
  const statisticsQuery = useQuery({
    queryKey: ['statistics', listParams, statType],
    queryFn: () => statisticsApi.getAllPage({ ...listParams, type: statType || undefined }),
  });
  const phoneQuery = useQuery({
    queryKey: ['phone-requests', listParams, phoneStatus],
    queryFn: () => phoneRequestsApi.getPending({ ...listParams, status: phoneStatus === 'all' ? undefined : phoneStatus }),
  });

  const createRole = useMutation({
    mutationFn: () => rolesApi.create({
      name: roleName,
      permissions: permissions.split('\n').map(item => item.trim()).filter(Boolean),
    }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['roles'] });
      setRoleName('');
      setPermissions('');
      toast.success(t('adminTools.roleCreated'));
    },
    onError: error => toast.error(error.message),
  });

  const createStatistic = useMutation({
    mutationFn: () => statisticsApi.create({
      date: new Date().toISOString(),
      type: statType,
      value: statValue,
      metadata: parseMetadata(statMetadata),
    }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['statistics'] });
      setStatMetadata('');
      toast.success(t('adminTools.statisticCreated'));
    },
    onError: error => toast.error(error.message),
  });

  const handlePhone = useMutation({
    mutationFn: ({ id, status }: { id: string; status: Exclude<PhoneRequestStatus, 'pending'> }) => phoneRequestsApi.handle(id, status),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['phone-requests'] });
      toast.success(t('adminTools.phoneRequestUpdated'));
    },
    onError: error => toast.error(error.message),
  });

  if (rolesQuery.isLoading || statisticsQuery.isLoading || phoneQuery.isLoading) {
    return <LoadingState label={t('adminTools.loading')} />;
  }

  const error = rolesQuery.error ?? statisticsQuery.error ?? phoneQuery.error;
  if (error) {
    return <ErrorState description={error.message} onRetry={() => {
      void rolesQuery.refetch();
      void statisticsQuery.refetch();
      void phoneQuery.refetch();
    }} />;
  }

  return (
    <PageLayout
      eyebrow={t('nav.adminTools')}
      title={t('adminTools.title')}
      description={t('adminTools.description')}
    >
      <TableToolbar
        search={search}
        onSearchChange={(value) => {
          setSearch(value);
          setPage(1);
        }}
        searchPlaceholder={t('adminTools.searchPlaceholder')}
        resultsLabel={t('adminTools.serverSideSearch')}
        filters={(
          <Select value={phoneStatus} onChange={event => setPhoneStatus(event.target.value as 'all' | PhoneRequestStatus)}>
            <option value="pending">{t('adminTools.pendingPhones')}</option>
            <option value="approved">{t('adminTools.approvedPhones')}</option>
            <option value="rejected">{t('adminTools.rejectedPhones')}</option>
            <option value="all">{t('adminTools.anyPhoneStatus')}</option>
          </Select>
        )}
      />

      <Card>
        <div className="detail-grid">
          <Input label={t('adminTools.roleName')} value={roleName} onChange={event => setRoleName(event.target.value)} />
          <Textarea label={t('adminTools.permissions')} value={permissions} onChange={event => setPermissions(event.target.value)} placeholder={t('adminTools.permissionsPlaceholder')} />
          <Button disabled={!roleName || !permissions.trim() || createRole.isPending} onClick={() => createRole.mutate()}>
            {t('adminTools.createRole')}
          </Button>
        </div>
      </Card>

      <TableShell title={t('adminTools.roles')} description={t('adminTools.rolesDescription')}>
        <DataTable
          rows={rolesQuery.data?.items ?? []}
          getRowKey={item => item.name}
          columns={[
            { key: 'name', header: t('users.detailName'), cell: item => item.name },
            { key: 'permissions', header: t('adminTools.permissions'), cell: item => item.permissions.join(', ') },
            {
              key: 'actions',
              header: t('common.actions'),
              cell: item => (
                <div className="inline-actions">
                  <Button size="sm" variant="secondary" onClick={() => rolesApi.getOne(item.name).then(() => toast.info(t('adminTools.roleLoaded')))}>{t('adminTools.getByName')}</Button>
                  <Button size="sm" variant="danger" onClick={() => rolesApi.remove(item.name).then(() => queryClient.invalidateQueries({ queryKey: ['roles'] }))}>{t('common.delete')}</Button>
                </div>
              ),
            },
          ]}
        />
        <Pagination page={rolesQuery.data?.pagination?.page ?? page} totalPages={rolesQuery.data?.pagination?.totalPages ?? 1} onChange={setPage} />
      </TableShell>

      <Card>
        <div className="detail-grid">
          <Input label={t('adminTools.statisticType')} value={statType} onChange={event => setStatType(event.target.value)} />
          <Input label={t('adminTools.value')} type="number" value={statValue} onChange={event => setStatValue(Number(event.target.value))} />
          <Textarea label={t('adminTools.metadataJson')} value={statMetadata} onChange={event => setStatMetadata(event.target.value)} placeholder={t('adminTools.metadataPlaceholder')} />
          <Button disabled={!statType || createStatistic.isPending} onClick={() => createStatistic.mutate()}>
            {t('adminTools.createStatistic')}
          </Button>
        </div>
      </Card>

      <TableShell title={t('adminTools.statistics')} description={t('adminTools.statisticsDescription')}>
        <DataTable
          rows={statisticsQuery.data?.items ?? []}
          getRowKey={item => item.id}
          columns={[
            { key: 'date', header: t('common.date'), cell: item => formatDate(item.date) },
            { key: 'type', header: t('adminTools.type'), cell: item => item.type },
            { key: 'value', header: t('adminTools.value'), cell: item => item.value },
            { key: 'metadata', header: t('adminTools.metadata'), cell: item => JSON.stringify(item.metadata ?? {}) },
            {
              key: 'actions',
              header: t('common.actions'),
              cell: item => (
                <div className="inline-actions">
                  <Button size="sm" variant="secondary" onClick={() => statisticsApi.update(item.id, { value: item.value }).then(() => toast.success(t('adminTools.statisticUpdated')))}>{t('adminTools.patch')}</Button>
                  <Button size="sm" variant="danger" onClick={() => statisticsApi.remove(item.id).then(() => queryClient.invalidateQueries({ queryKey: ['statistics'] }))}>{t('common.delete')}</Button>
                </div>
              ),
            },
          ]}
        />
      </TableShell>

      <TableShell title={t('adminTools.phoneRequests')} description={t('adminTools.phoneRequestsDescription')}>
        <DataTable
          rows={phoneQuery.data?.items ?? []}
          getRowKey={item => item.id}
          columns={[
            { key: 'name', header: t('users.detailName'), cell: item => item.name },
            { key: 'phone', header: t('profile.phone'), cell: item => item.phone },
            { key: 'telegram', header: 'Telegram', cell: item => item.telegramId },
            { key: 'status', header: t('common.status'), cell: item => <Badge tone={item.status === 'approved' ? 'success' : item.status === 'rejected' ? 'danger' : 'warning'}>{t(`phoneStatus.${item.status}`)}</Badge> },
            {
              key: 'actions',
              header: t('common.actions'),
              cell: item => item.status === 'pending' ? (
                <div className="inline-actions">
                  <Button size="sm" variant="secondary" onClick={() => handlePhone.mutate({ id: item.id, status: 'approved' })}>{t('adminTools.approve')}</Button>
                  <Button size="sm" variant="danger" onClick={() => handlePhone.mutate({ id: item.id, status: 'rejected' })}>{t('adminTools.reject')}</Button>
                </div>
              ) : null,
            },
          ]}
        />
      </TableShell>
    </PageLayout>
  );
}
