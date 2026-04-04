import { ModalShell } from '../../shared/ui/overlay/modal-shell';
import { Badge } from '../../shared/ui/badges/badge';
import { AppUser } from '../../shared/types/auth';
import { formatDate } from '../../shared/lib/date';
import { getRoleDisplayName } from '../../shared/lib/entity-display';

export function UserDetailModal({
  open,
  user,
  onClose,
}: {
  open: boolean;
  user?: AppUser | null;
  onClose: () => void;
}) {
  if (!user) {
    return null;
  }

  return (
    <ModalShell open={open} onClose={onClose} title="User profile" description="Quick view of the selected user record">
      <div className="detail-grid">
        <div className="stack">
          <span className="subtle">Username</span>
          <strong>{user.username}</strong>
        </div>
        <div className="stack">
          <span className="subtle">Role</span>
          <Badge tone="info">{getRoleDisplayName(user.role)}</Badge>
        </div>
        <div className="stack">
          <span className="subtle">Name</span>
          <strong>{[user.firstName, user.lastName].filter(Boolean).join(' ') || '-'}</strong>
        </div>
        <div className="stack">
          <span className="subtle">Email</span>
          <strong>{user.email || '-'}</strong>
        </div>
        <div className="stack">
          <span className="subtle">Phone</span>
          <strong>{user.phoneNumber || '-'}</strong>
        </div>
        <div className="stack">
          <span className="subtle">Created</span>
          <strong>{formatDate(user.createdAt)}</strong>
        </div>
      </div>
    </ModalShell>
  );
}
