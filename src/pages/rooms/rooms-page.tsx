import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Room, roomsApi, RoomFormValues } from '../../entities/room/api';
import { PageLayout } from '../../widgets/page/page-layout';
import { LoadingState } from '../../shared/ui/feedback/loading-state';
import { ErrorState } from '../../shared/ui/feedback/error-state';
import { EmptyState } from '../../shared/ui/feedback/empty-state';
import { TableShell } from '../../shared/ui/data-display/table-shell';
import { DataTable } from '../../shared/ui/data-display/data-table';
import { TableToolbar } from '../../shared/ui/data-display/table-toolbar';
import { Pagination } from '../../shared/ui/data-display/pagination';
import { Badge } from '../../shared/ui/badges/badge';
import { Card } from '../../shared/ui/surfaces/card';
import { getRoomTypeDisplayName } from '../../shared/lib/entity-display';
import { Button } from '../../shared/ui/buttons/button';
import { Select } from '../../shared/ui/forms/select';
import { ConfirmModal } from '../../shared/ui/overlay/confirm-modal';
import { RoomFormModal } from './room-form-modal';
import { getRoleCapabilities } from '../../shared/lib/capabilities';
import { useAuthStore } from '../../features/auth/model/auth-store';
import { toast } from '../../shared/ui/feedback/toaster';
import { useDebouncedValue } from '../../shared/hooks/use-debounced-value';
import { useUrlState } from '../../shared/hooks/use-url-state';
import { useI18n } from '../../shared/i18n/i18n';

export function RoomsPage() {
  const user = useAuthStore(state => state.user);
  const { t } = useI18n();
  const capabilities = getRoleCapabilities(user?.role);
  const queryClient = useQueryClient();
  const urlState = useUrlState();
  const [page, setPageState] = useState(urlState.getNumber('page', 1));
  const [search, setSearchState] = useState(urlState.getString('search'));
  const [type, setTypeState] = useState<'' | Room['type']>(urlState.getString('type') as '' | Room['type']);
  const [availability, setAvailabilityState] = useState(urlState.getString('available'));
  const debouncedSearch = useDebouncedValue(search);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [deleteRoom, setDeleteRoom] = useState<Room | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  const setPage = (value: number) => {
    setPageState(value);
    urlState.setValue('page', value > 1 ? value : undefined);
  };
  const setSearch = (value: string) => {
    setSearchState(value);
    setPageState(1);
    urlState.setValues({ search: value || undefined, page: undefined });
  };
  const setType = (value: '' | Room['type']) => {
    setTypeState(value);
    setPageState(1);
    urlState.setValues({ type: value || undefined, page: undefined });
  };
  const setAvailability = (value: string) => {
    setAvailabilityState(value);
    setPageState(1);
    urlState.setValues({ available: value || undefined, page: undefined });
  };

  const params = useMemo(() => ({
    page,
    limit: 10,
    search: debouncedSearch || undefined,
    type: type || undefined,
    isAvailable: availability === '' ? undefined : availability === 'true',
    sortBy: 'name',
    sortOrder: 'asc' as const,
  }), [availability, debouncedSearch, page, type]);

  const query = useQuery({
    queryKey: ['rooms', params],
    queryFn: () => roomsApi.getAllPage(params),
  });

  const saveMutation = useMutation({
    mutationFn: (values: RoomFormValues) => (
      editingRoom ? roomsApi.update(editingRoom.id, values) : roomsApi.create(values)
    ),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['rooms'] });
      toast.success(editingRoom ? t('rooms.updated') : t('rooms.created'));
      setFormOpen(false);
      setEditingRoom(null);
    },
    onError: error => toast.error(error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (room: Room) => roomsApi.remove(room.id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['rooms'] });
      toast.success(t('rooms.deleted'));
      setDeleteRoom(null);
    },
    onError: error => toast.error(error.message),
  });

  if (query.isLoading) {
    return <LoadingState label={t('rooms.loading')} />;
  }

  if (query.error) {
    return <ErrorState description={query.error.message} onRetry={() => void query.refetch()} />;
  }

  const rooms = query.data?.items ?? [];
  const pagination = query.data?.pagination;

  return (
    <PageLayout
      eyebrow={t('rooms.eyebrow')}
      title={t('rooms.title')}
      description={t('rooms.description')}
    >
      <div className="dashboard-grid">
        <Card className="metric-card">
          <span className="subtle">{t('rooms.visibleRooms')}</span>
          <strong>{pagination?.total ?? rooms.length}</strong>
          <span className="subtle">{t('rooms.loadedFromBackend')}</span>
        </Card>
        <Card className="metric-card">
          <span className="subtle">{t('rooms.availableNow')}</span>
          <strong>{rooms.filter(room => room.isAvailable).length}</strong>
          <span className="subtle">{t('rooms.markedAvailable')}</span>
        </Card>
      </div>
      {rooms.length === 0 ? (
        <EmptyState title={t('rooms.noRoomsYet')} description={t('rooms.noRoomsDescription')} />
      ) : (
        <TableShell
          title={t('rooms.inventoryTitle')}
          description={t('rooms.inventoryDescription')}
          actions={(
            <TableToolbar
              search={search}
              onSearchChange={(value) => {
                setSearch(value);
              }}
              searchPlaceholder={t('rooms.searchPlaceholder')}
              resultsLabel={t('rooms.resultsLabel', { count: pagination?.total ?? rooms.length })}
              activeFilters={[
                type ? t('rooms.filterType', { type: getRoomTypeDisplayName(type as Room['type']) }) : '',
                availability ? t('rooms.filterAvailability', { availability: availability === 'true' ? t('common.available') : t('common.unavailable') }) : '',
              ].filter(Boolean)}
              filters={(
                <>
                  <Select value={type} onChange={event => setType(event.target.value as '' | Room['type'])} aria-label={t('rooms.roomType')}>
                    <option value="">{t('rooms.allTypes')}</option>
                    <option value="classroom">{t('roomType.classroom')}</option>
                    <option value="lab">{t('roomType.lab')}</option>
                    <option value="office">{t('roomType.office')}</option>
                    <option value="meeting">{t('roomType.meeting')}</option>
                  </Select>
                  <Select value={availability} onChange={event => setAvailability(event.target.value)} aria-label={t('rooms.availability')}>
                    <option value="">{t('rooms.anyAvailability')}</option>
                    <option value="true">{t('common.available')}</option>
                    <option value="false">{t('common.unavailable')}</option>
                  </Select>
                </>
              )}
              actions={capabilities.rooms.manage ? (
                <Button
                  type="button"
                  size="sm"
                  onClick={() => {
                    setEditingRoom(null);
                    setFormOpen(true);
                  }}
                >
                  {t('rooms.createRoom')}
                </Button>
              ) : null}
            />
          )}
        >
          <DataTable
            getRowKey={item => item.id}
            columns={[
              {
                key: 'room',
                header: t('rooms.room'),
                className: 'data-table__cell--primary',
                cell: item => (
                  <div className="cell-stack cell-stack--primary cell-stack--relation">
                    <span className="cell-title">{item.name}</span>
                    <span className="cell-meta">{item.description || t('rooms.noNotes')}</span>
                  </div>
                ),
              },
              {
                key: 'type',
                header: t('rooms.type'),
                cell: item => <Badge tone="info">{getRoomTypeDisplayName(item.type)}</Badge>,
              },
              {
                key: 'capacity',
                header: t('rooms.capacity'),
                className: 'data-table__cell--relation',
                cell: item => (
                  <div className="cell-stack cell-stack--relation">
                    <span className="cell-title">{item.capacity}</span>
                    <span className="cell-meta">{t('rooms.seatsAvailable')}</span>
                  </div>
                ),
              },
              {
                key: 'availability',
                header: t('rooms.availability'),
                cell: item => (
                  <Badge tone={item.isAvailable ? 'success' : 'warning'}>
                    {item.isAvailable ? t('common.available') : t('common.unavailable')}
                  </Badge>
                ),
              },
              ...(capabilities.rooms.manage ? [{
                key: 'actions',
                header: t('common.actions'),
                className: 'data-table__cell--actions',
                cell: (item: Room) => (
                  <div className="inline-actions">
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setEditingRoom(item);
                        setFormOpen(true);
                      }}
                    >
                      {t('common.edit')}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="danger"
                      onClick={() => setDeleteRoom(item)}
                    >
                      {t('common.delete')}
                    </Button>
                  </div>
                ),
              }] : []),
            ]}
            rows={rooms}
            emptyTitle={t('rooms.noRoomsFound')}
            emptyDescription={t('rooms.noRoomsFoundDescription')}
          />
          <Pagination
            page={pagination?.page ?? page}
            totalPages={pagination?.totalPages ?? 1}
            onChange={setPage}
          />
        </TableShell>
      )}
      <RoomFormModal
        open={formOpen}
        room={editingRoom}
        loading={saveMutation.isPending}
        onClose={() => {
          setFormOpen(false);
          setEditingRoom(null);
        }}
        onSubmit={async values => {
          await saveMutation.mutateAsync(values);
        }}
      />
      <ConfirmModal
        open={!!deleteRoom}
        title={t('rooms.deleteRoomTitle')}
        description={deleteRoom ? t('rooms.deleteRoomDescription', { room: deleteRoom.name }) : ''}
        confirmLabel={t('rooms.deleteRoomConfirm')}
        tone="danger"
        loading={deleteMutation.isPending}
        onClose={() => setDeleteRoom(null)}
        onConfirm={async () => {
          if (deleteRoom) {
            await deleteMutation.mutateAsync(deleteRoom);
          }
        }}
      />
    </PageLayout>
  );
}
