import { useQuery } from '@tanstack/react-query';
import { roomsApi } from '../../entities/room/api';
import { PageLayout } from '../../widgets/page/page-layout';
import { LoadingState } from '../../shared/ui/feedback/loading-state';
import { ErrorState } from '../../shared/ui/feedback/error-state';
import { EmptyState } from '../../shared/ui/feedback/empty-state';
import { TableShell } from '../../shared/ui/data-display/table-shell';
import { DataTable } from '../../shared/ui/data-display/data-table';
import { Badge } from '../../shared/ui/badges/badge';
import { Card } from '../../shared/ui/surfaces/card';
import { getRoomTypeDisplayName } from '../../shared/lib/entity-display';

export function RoomsPage() {
  const query = useQuery({
    queryKey: ['rooms'],
    queryFn: () => roomsApi.getAll(),
  });

  if (query.isLoading) {
    return <LoadingState label="Loading rooms..." />;
  }

  if (query.error) {
    return <ErrorState description={query.error.message} onRetry={() => void query.refetch()} />;
  }

  const rooms = query.data ?? [];

  return (
    <PageLayout
      eyebrow="Infrastructure"
      title="Rooms"
      description="A clean inventory of teaching spaces with availability, type, and capacity visible at a glance."
    >
      <div className="dashboard-grid">
        <Card className="metric-card">
          <span className="subtle">Visible rooms</span>
          <strong>{rooms.length}</strong>
          <span className="subtle">Loaded from the backend</span>
        </Card>
        <Card className="metric-card">
          <span className="subtle">Available now</span>
          <strong>{rooms.filter(room => room.isAvailable).length}</strong>
          <span className="subtle">Marked as available</span>
        </Card>
      </div>
      {rooms.length === 0 ? (
        <EmptyState title="No rooms yet" description="No teaching spaces are available in this workspace yet. Rooms will appear here once the backend returns them." />
      ) : (
        <TableShell
          title="Room inventory"
          description="Teaching spaces are shown with room type, capacity, and current availability."
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
            ]}
            rows={rooms}
            emptyTitle="No rooms found"
            emptyDescription="Try refreshing the inventory or clearing the current view."
          />
        </TableShell>
      )}
    </PageLayout>
  );
}
