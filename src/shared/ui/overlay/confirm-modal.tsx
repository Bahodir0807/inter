import { Button } from '../buttons/button';
import { ModalShell } from './modal-shell';

interface ConfirmModalProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: 'primary' | 'danger';
  loading?: boolean;
  onConfirm: () => Promise<void> | void;
  onClose: () => void;
}

export function ConfirmModal({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  tone = 'primary',
  loading = false,
  onConfirm,
  onClose,
}: ConfirmModalProps) {
  return (
    <ModalShell
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      closeOnBackdrop={false}
      closeOnEscape={!loading}
      closeDisabled={loading}
    >
      <div className="stack">
        <div className="inline-actions">
          <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={tone === 'danger' ? 'danger' : 'primary'}
            onClick={() => void onConfirm()}
            disabled={loading}
          >
            {loading ? 'Working...' : confirmLabel}
          </Button>
        </div>
      </div>
    </ModalShell>
  );
}
