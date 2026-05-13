import { ModalShell } from '../../shared/ui/overlay/modal-shell';
import { Badge } from '../../shared/ui/badges/badge';
import { AppUser } from '../../shared/types/auth';
import { formatDate } from '../../shared/lib/date';
import { getRoleDisplayName } from '../../shared/lib/entity-display';
import { useI18n } from '../../shared/i18n/i18n';

export function UserDetailModal({
  open,
  user,
  showAccountDetails = false,
  onClose,
}: {
  open: boolean;
  user?: AppUser | null;
  showAccountDetails?: boolean;
  onClose: () => void;
}) {
  const { t } = useI18n();
  if (!user) {
    return null;
  }
  const paymentMethodLabel =
    user.paymentMethod === 'cash'
      ? t('users.paymentMethod.cash')
      : user.paymentMethod === 'card'
        ? t('users.paymentMethod.card')
        : '-';

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      title={showAccountDetails ? t('users.profileTitle') : t('users.studentDetailsTitle')}
      description={
        showAccountDetails
          ? t('users.profileDescription')
          : t('users.studentDescription')
      }
    >
      <div className="detail-grid">
        <div className="stack">
          <span className="subtle">{t('users.detailName')}</span>
          <strong>{[user.firstName, user.lastName].filter(Boolean).join(' ') || '-'}</strong>
        </div>
        {showAccountDetails ? (
          <>
            <div className="stack">
              <span className="subtle">{t('users.detailUsername')}</span>
              <strong>{user.username}</strong>
            </div>
            <div className="stack">
              <span className="subtle">{t('users.detailRole')}</span>
              <Badge tone="info">{getRoleDisplayName(user.role)}</Badge>
            </div>
          </>
        ) : null}
        <div className="stack">
          <span className="subtle">{t('users.detailEmail')}</span>
          <strong>{user.email || '-'}</strong>
        </div>
        <div className="stack">
          <span className="subtle">{t('users.detailPhone')}</span>
          <strong>{user.phoneNumber || '-'}</strong>
        </div>
        <div className="stack">
          <span className="subtle">{t('users.detailStudentYear')}</span>
          <strong>{user.studentYear || '-'}</strong>
        </div>
        <div className="stack">
          <span className="subtle">{t('users.detailPaymentMethod')}</span>
          <strong>{paymentMethodLabel}</strong>
        </div>
        <div className="stack">
          <span className="subtle">{t('users.detailContactOwner')}</span>
          <strong>{user.contactOwner || '-'}</strong>
        </div>
        <div className="stack">
          <span className="subtle">{t('users.detailContactOwnerFullName')}</span>
          <strong>{user.contactOwnerFullName || '-'}</strong>
        </div>
        <div className="stack">
          <span className="subtle">{t('users.detailContactOwnerRelation')}</span>
          <strong>{user.contactOwnerRelation || '-'}</strong>
        </div>
        {showAccountDetails ? (
          <div className="stack">
            <span className="subtle">{t('users.detailCreated')}</span>
            <strong>{formatDate(user.createdAt)}</strong>
          </div>
        ) : null}
      </div>
    </ModalShell>
  );
}
