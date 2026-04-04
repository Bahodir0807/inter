import { useQuery } from '@tanstack/react-query';
import { usersApi } from '../../entities/user/api';
import { PageLayout } from '../../widgets/page/page-layout';
import { LoadingState } from '../../shared/ui/feedback/loading-state';
import { ErrorState } from '../../shared/ui/feedback/error-state';
import { Card } from '../../shared/ui/surfaces/card';
import { Badge } from '../../shared/ui/badges/badge';
import { formatDate } from '../../shared/lib/date';
import { getRoleDisplayName, getUserDisplayName } from '../../shared/lib/entity-display';

export function ProfilePage() {
  const query = useQuery({
    queryKey: ['profile', 'me'],
    queryFn: () => usersApi.me(),
  });

  if (query.isLoading) {
    return <LoadingState label="Loading profile..." />;
  }

  if (query.error) {
    return <ErrorState description={query.error.message} onRetry={() => void query.refetch()} />;
  }

  const profile = query.data;

  if (!profile) {
    return null;
  }

  return (
    <PageLayout
      eyebrow="Account"
      title="Profile"
      description="Current session details and user profile information loaded from the live backend."
    >
      <div className="content-grid">
        <Card className="content-grid__side">
          <div className="stack">
            <span className="eyebrow">Current session</span>
            <h3>{getUserDisplayName(profile)}</h3>
            <div className="cell-badges">
              <Badge tone="info">{getRoleDisplayName(profile.role)}</Badge>
              <Badge tone={profile.isActive ? 'success' : 'warning'}>
                {profile.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </div>
          </div>
        </Card>
        <Card className="content-grid__wide">
          <div className="stats-grid">
            <div className="cell-stack">
              <span className="subtle">Username</span>
              <span className="cell-title">{profile.username}</span>
            </div>
            <div className="cell-stack">
              <span className="subtle">Phone</span>
              <span className="cell-title">{profile.phoneNumber || '-'}</span>
            </div>
            <div className="cell-stack">
              <span className="subtle">Email</span>
              <span className="cell-title">{profile.email || '-'}</span>
            </div>
            <div className="cell-stack">
              <span className="subtle">Telegram</span>
              <span className="cell-title">{profile.telegramId || '-'}</span>
            </div>
            <div className="cell-stack">
              <span className="subtle">Created</span>
              <span className="cell-title">{formatDate(profile.createdAt)}</span>
            </div>
            <div className="cell-stack">
              <span className="subtle">Updated</span>
              <span className="cell-title">{formatDate(profile.updatedAt)}</span>
            </div>
          </div>
        </Card>
      </div>
    </PageLayout>
  );
}
