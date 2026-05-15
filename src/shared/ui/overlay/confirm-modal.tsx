import { useState } from 'react';
import { Button } from '../buttons/button';
import { ModalShell } from './modal-shell';
import { translate } from '../../i18n/i18n';

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
  confirmLabel = translate('common.confirm'),
  cancelLabel = translate('common.cancel'),
  tone = 'primary',
  loading = false,
  onConfirm,
  onClose,
}: ConfirmModalProps) {
  const [pending, setPending] = useState(false);
  const busy = loading || pending;

  async function handleConfirm() {
    if (busy) {
      return;
    }

    setPending(true);
    try {
      await onConfirm();
    } finally {
      setPending(false);
    }
  }

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      closeOnBackdrop={false}
      closeOnEscape={!busy}
      closeDisabled={busy}
    >
      <div className="stack">
        <div className="inline-actions">
          <Button type="button" variant="ghost" onClick={onClose} disabled={busy}>
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={tone === 'danger' ? 'danger' : 'primary'}
            onClick={() => void handleConfirm()}
            disabled={busy}
          >
            {busy ? translate('common.working') : confirmLabel}
          </Button>
        </div>
      </div>
    </ModalShell>
  );
}
