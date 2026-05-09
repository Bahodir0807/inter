import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { usersApi } from '../../entities/user/api';
import { authApi } from '../../entities/auth/api';
import { PageLayout } from '../../widgets/page/page-layout';
import { LoadingState } from '../../shared/ui/feedback/loading-state';
import { ErrorState } from '../../shared/ui/feedback/error-state';
import { Card } from '../../shared/ui/surfaces/card';
import { Badge } from '../../shared/ui/badges/badge';
import { formatDate } from '../../shared/lib/date';
import { getRoleDisplayName, getUserDisplayName } from '../../shared/lib/entity-display';
import { Button } from '../../shared/ui/buttons/button';
import { Input } from '../../shared/ui/forms/input';
import { toast } from '../../shared/ui/feedback/toaster';
import { ProfileFormModal } from './profile-form-modal';
import { useI18n } from '../../shared/i18n/i18n';

export function ProfilePage() {
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const { t } = useI18n();

  const query = useQuery({
    queryKey: ['profile', 'me'],
    queryFn: () => usersApi.me(),
  });

  const profileMutation = useMutation({
    mutationFn: usersApi.updateMyProfile,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['profile'] });
      await queryClient.invalidateQueries({ queryKey: ['auth'] });
      setFormOpen(false);
      toast.success(t('common.updated'));
    },
    onError: error => toast.error(error.message),
  });

  const passwordMutation = useMutation({
    mutationFn: () => authApi.changePassword({ currentPassword, newPassword }),
    onSuccess: () => {
      setCurrentPassword('');
      setNewPassword('');
      toast.success(t('profile.passwordChangeSuccess'));
    },
    onError: error => toast.error(error.message),
  });

  if (query.isLoading) {
    return <LoadingState label={t('common.loading')} />;
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
      eyebrow={t('profile.eyebrow')}
      title={t('profile.title')}
      description={t('profile.description')}
      variant="feature"
      actions={<Button onClick={() => setFormOpen(true)}>{t('profile.editButton')}</Button>}
    >
      <div className="content-grid">
        <Card className="content-grid__side">
          <div className="stack">
            <span className="eyebrow">{t('profile.currentSession')}</span>
            <h3>{getUserDisplayName(profile)}</h3>
            <div className="cell-badges">
              <Badge tone="info">{getRoleDisplayName(profile.role)}</Badge>
              <Badge tone={profile.isActive ? 'success' : 'warning'}>
                {profile.isActive ? t('common.active') : t('common.inactive')}
              </Badge>
            </div>
          </div>
        </Card>
        <Card className="content-grid__wide">
          <div className="stats-grid">
            <div className="cell-stack">
              <span className="subtle">{t('profile.username')}</span>
              <span className="cell-title">{profile.username}</span>
            </div>
            <div className="cell-stack">
              <span className="subtle">{t('profile.phone')}</span>
              <span className="cell-title">{profile.phoneNumber || '-'}</span>
            </div>
            <div className="cell-stack">
              <span className="subtle">{t('profile.email')}</span>
              <span className="cell-title">{profile.email || '-'}</span>
            </div>
            <div className="cell-stack">
              <span className="subtle">{t('profile.telegram')}</span>
              <span className="cell-title">{profile.telegramId || '-'}</span>
            </div>
            <div className="cell-stack">
              <span className="subtle">{t('profile.created')}</span>
              <span className="cell-title">{formatDate(profile.createdAt)}</span>
            </div>
            <div className="cell-stack">
              <span className="subtle">{t('profile.updated')}</span>
              <span className="cell-title">{formatDate(profile.updatedAt)}</span>
            </div>
          </div>
        </Card>
      </div>
      <Card>
        <div className="detail-grid">
          <Input
            label={t('profile.currentPassword')}
            type="password"
            value={currentPassword}
            onChange={event => setCurrentPassword(event.target.value)}
          />
          <Input
            label={t('profile.newPassword')}
            type="password"
            value={newPassword}
            onChange={event => setNewPassword(event.target.value)}
          />
          <Button
            disabled={currentPassword.length < 8 || newPassword.length < 8 || passwordMutation.isPending}
            onClick={() => passwordMutation.mutate()}
          >
            {t('profile.changePassword')}
          </Button>
        </div>
      </Card>
      <ProfileFormModal
        open={formOpen}
        profile={profile}
        loading={profileMutation.isPending}
        onClose={() => setFormOpen(false)}
        onSubmit={async values => {
          await profileMutation.mutateAsync(values);
        }}
      />
    </PageLayout>
  );
}
