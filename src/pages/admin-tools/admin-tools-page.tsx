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

const pageSize = 10;

function parseMetadata(value: string) {
  if (!value.trim()) {
    return undefined;
  }
  return JSON.parse(value) as Record<string, unknown>;
}

export function AdminToolsPage() {
  const queryClient = useQueryClient();
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
      toast.success('Role created');
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
      toast.success('Statistic created');
    },
    onError: error => toast.error(error.message),
  });

  const handlePhone = useMutation({
    mutationFn: ({ id, status }: { id: string; status: Exclude<PhoneRequestStatus, 'pending'> }) => phoneRequestsApi.handle(id, status),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['phone-requests'] });
      toast.success('Phone request updated');
    },
    onError: error => toast.error(error.message),
  });

  if (rolesQuery.isLoading || statisticsQuery.isLoading || phoneQuery.isLoading) {
    return <LoadingState label="Loading admin tools..." />;
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
      eyebrow="Admin"
      title="Backend tools"
      description="Roles, permissions, statistics, and phone requests backed by admin-only endpoints."
    >
      <TableToolbar
        search={search}
        onSearchChange={(value) => {
          setSearch(value);
          setPage(1);
        }}
        searchPlaceholder="Search admin records"
        resultsLabel="Server-side search"
        filters={(
          <Select value={phoneStatus} onChange={event => setPhoneStatus(event.target.value as 'all' | PhoneRequestStatus)}>
            <option value="pending">Pending phones</option>
            <option value="approved">Approved phones</option>
            <option value="rejected">Rejected phones</option>
            <option value="all">Any phone status</option>
          </Select>
        )}
      />

      <Card>
        <div className="detail-grid">
          <Input label="Role name" value={roleName} onChange={event => setRoleName(event.target.value)} />
          <Textarea label="Permissions" value={permissions} onChange={event => setPermissions(event.target.value)} placeholder="One permission per line" />
          <Button disabled={!roleName || !permissions.trim() || createRole.isPending} onClick={() => createRole.mutate()}>
            Create role
          </Button>
        </div>
      </Card>

      <TableShell title="Roles" description="Uses `/roles`, `/roles/:name`, and role permission arrays from backend.">
        <DataTable
          rows={rolesQuery.data?.items ?? []}
          getRowKey={item => item.name}
          columns={[
            { key: 'name', header: 'Name', cell: item => item.name },
            { key: 'permissions', header: 'Permissions', cell: item => item.permissions.join(', ') },
            {
              key: 'actions',
              header: 'Actions',
              cell: item => (
                <div className="inline-actions">
                  <Button size="sm" variant="secondary" onClick={() => rolesApi.getOne(item.name).then(() => toast.info('Role loaded'))}>Get by name</Button>
                  <Button size="sm" variant="danger" onClick={() => rolesApi.remove(item.name).then(() => queryClient.invalidateQueries({ queryKey: ['roles'] }))}>Delete</Button>
                </div>
              ),
            },
          ]}
        />
        <Pagination page={rolesQuery.data?.pagination?.page ?? page} totalPages={rolesQuery.data?.pagination?.totalPages ?? 1} onChange={setPage} />
      </TableShell>

      <Card>
        <div className="detail-grid">
          <Input label="Statistic type" value={statType} onChange={event => setStatType(event.target.value)} />
          <Input label="Value" type="number" value={statValue} onChange={event => setStatValue(Number(event.target.value))} />
          <Textarea label="Metadata JSON" value={statMetadata} onChange={event => setStatMetadata(event.target.value)} placeholder='{"source":"manual"}' />
          <Button disabled={!statType || createStatistic.isPending} onClick={() => createStatistic.mutate()}>
            Create statistic
          </Button>
        </div>
      </Card>

      <TableShell title="Statistics" description="Uses `/statistics`, `/statistics/:type`, patch and delete endpoints.">
        <DataTable
          rows={statisticsQuery.data?.items ?? []}
          getRowKey={item => item.id}
          columns={[
            { key: 'date', header: 'Date', cell: item => formatDate(item.date) },
            { key: 'type', header: 'Type', cell: item => item.type },
            { key: 'value', header: 'Value', cell: item => item.value },
            { key: 'metadata', header: 'Metadata', cell: item => JSON.stringify(item.metadata ?? {}) },
            {
              key: 'actions',
              header: 'Actions',
              cell: item => (
                <div className="inline-actions">
                  <Button size="sm" variant="secondary" onClick={() => statisticsApi.update(item.id, { value: item.value }).then(() => toast.success('Statistic updated'))}>Patch</Button>
                  <Button size="sm" variant="danger" onClick={() => statisticsApi.remove(item.id).then(() => queryClient.invalidateQueries({ queryKey: ['statistics'] }))}>Delete</Button>
                </div>
              ),
            },
          ]}
        />
      </TableShell>

      <TableShell title="Phone requests" description="Admin handling for pending public phone requests.">
        <DataTable
          rows={phoneQuery.data?.items ?? []}
          getRowKey={item => item.id}
          columns={[
            { key: 'name', header: 'Name', cell: item => item.name },
            { key: 'phone', header: 'Phone', cell: item => item.phone },
            { key: 'telegram', header: 'Telegram', cell: item => item.telegramId },
            { key: 'status', header: 'Status', cell: item => <Badge tone={item.status === 'approved' ? 'success' : item.status === 'rejected' ? 'danger' : 'warning'}>{item.status}</Badge> },
            {
              key: 'actions',
              header: 'Actions',
              cell: item => item.status === 'pending' ? (
                <div className="inline-actions">
                  <Button size="sm" variant="secondary" onClick={() => handlePhone.mutate({ id: item.id, status: 'approved' })}>Approve</Button>
                  <Button size="sm" variant="danger" onClick={() => handlePhone.mutate({ id: item.id, status: 'rejected' })}>Reject</Button>
                </div>
              ) : null,
            },
          ]}
        />
      </TableShell>
    </PageLayout>
  );
}
