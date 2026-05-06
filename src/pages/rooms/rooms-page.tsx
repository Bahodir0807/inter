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

export function RoomsPage() {
  const user = useAuthStore(state => state.user);
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
      toast.success(editingRoom ? 'Room updated' : 'Room created');
      setFormOpen(false);
      setEditingRoom(null);
    },
    onError: error => toast.error(error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (room: Room) => roomsApi.remove(room.id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['rooms'] });
      toast.success('Room deleted');
      setDeleteRoom(null);
    },
    onError: error => toast.error(error.message),
  });

  if (query.isLoading) {
    return <LoadingState label="Loading rooms..." />;
  }

  if (query.error) {
    return <ErrorState description={query.error.message} onRetry={() => void query.refetch()} />;
  }

  const rooms = query.data?.items ?? [];
  const pagination = query.data?.pagination;

  return (
    <PageLayout
      eyebrow="Infrastructure"
      title="Rooms"
      description="Rooms, type, capacity, and availability."
    >
      <div className="dashboard-grid">
        <Card className="metric-card">
          <span className="subtle">Visible rooms</span>
          <strong>{pagination?.total ?? rooms.length}</strong>
          <span className="subtle">Loaded from the backend</span>
        </Card>
        <Card className="metric-card">
          <span className="subtle">Available now</span>
          <strong>{rooms.filter(room => room.isAvailable).length}</strong>
          <span className="subtle">Marked as available</span>
        </Card>
      </div>
      {rooms.length === 0 ? (
        <EmptyState title="No rooms yet" description="Rooms will appear here when they are available." />
      ) : (
        <TableShell
          title="Room inventory"
          description="Type, capacity, and availability."
          actions={(
            <TableToolbar
              search={search}
              onSearchChange={(value) => {
                setSearch(value);
              }}
              searchPlaceholder="Search rooms"
              resultsLabel={`${pagination?.total ?? rooms.length} rooms`}
              activeFilters={[
                type ? `Type: ${getRoomTypeDisplayName(type as Room['type'])}` : '',
                availability ? `Availability: ${availability === 'true' ? 'Available' : 'Unavailable'}` : '',
              ].filter(Boolean)}
              filters={(
                <>
                  <Select value={type} onChange={event => setType(event.target.value as '' | Room['type'])} aria-label="Room type">
                    <option value="">All types</option>
                    <option value="classroom">Classroom</option>
                    <option value="lab">Lab</option>
                    <option value="office">Office</option>
                    <option value="meeting">Meeting</option>
                  </Select>
                  <Select value={availability} onChange={event => setAvailability(event.target.value)} aria-label="Availability">
                    <option value="">Any availability</option>
                    <option value="true">Available</option>
                    <option value="false">Unavailable</option>
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
                  Create room
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
                header: 'Room',
                className: 'data-table__cell--primary',
                cell: item => (
                  <div className="cell-stack cell-stack--primary cell-stack--relation">
                    <span className="cell-title">{item.name}</span>
                    <span className="cell-meta">{item.description || 'No room notes provided'}</span>
                  </div>
                ),
              },
              {
                key: 'type',
                header: 'Type',
                cell: item => <Badge tone="info">{getRoomTypeDisplayName(item.type)}</Badge>,
              },
              {
                key: 'capacity',
                header: 'Capacity',
                className: 'data-table__cell--relation',
                cell: item => (
                  <div className="cell-stack cell-stack--relation">
                    <span className="cell-title">{item.capacity}</span>
                    <span className="cell-meta">Seats available</span>
                  </div>
                ),
              },
              {
                key: 'availability',
                header: 'Availability',
                cell: item => (
                  <Badge tone={item.isAvailable ? 'success' : 'warning'}>
                    {item.isAvailable ? 'Available' : 'Unavailable'}
                  </Badge>
                ),
              },
              ...(capabilities.rooms.manage ? [{
                key: 'actions',
                header: 'Actions',
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
                      Edit
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="danger"
                      onClick={() => setDeleteRoom(item)}
                    >
                      Delete
                    </Button>
                  </div>
                ),
              }] : []),
            ]}
            rows={rooms}
            emptyTitle="No rooms found"
            emptyDescription="Try refreshing the list or clearing the current view."
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
        title="Delete room?"
        description={deleteRoom ? `${deleteRoom.name} will be removed from room inventory.` : ''}
        confirmLabel="Delete room"
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
