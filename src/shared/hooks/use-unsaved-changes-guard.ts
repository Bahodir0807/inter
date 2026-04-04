import { useEffect, useState } from 'react';

interface UseUnsavedChangesGuardParams {
  open: boolean;
  isDirty: boolean;
  onDiscard: () => void;
}

export function useUnsavedChangesGuard({
  open,
  isDirty,
  onDiscard,
}: UseUnsavedChangesGuardParams) {
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    if (!open || !isDirty) {
      return;
    }

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty, open]);

  useEffect(() => {
    if (!open) {
      setConfirmOpen(false);
    }
  }, [open]);

  const requestClose = () => {
    if (isDirty) {
      setConfirmOpen(true);
      return;
    }

    onDiscard();
  };

  const cancelDiscard = () => setConfirmOpen(false);

  const confirmDiscard = () => {
    setConfirmOpen(false);
    onDiscard();
  };

  return {
    confirmOpen,
    requestClose,
    cancelDiscard,
    confirmDiscard,
  };
}
