import { KeyboardEvent, PropsWithChildren, useEffect, useId, useRef } from 'react';
import { Button } from '../buttons/button';

interface ModalShellProps extends PropsWithChildren {
  title: string;
  description?: string;
  open: boolean;
  onClose: () => void;
  closeOnBackdrop?: boolean;
  closeOnEscape?: boolean;
  closeDisabled?: boolean;
}

const focusableSelector = [
  'a[href]',
  'area[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
  '[contenteditable="true"]',
].join(', ');

let activeModalCount = 0;
let previousBodyOverflow = '';

function getFocusableElements(container: HTMLElement) {
  return Array.from(container.querySelectorAll<HTMLElement>(focusableSelector)).filter(
    element => !element.hasAttribute('disabled') && element.getAttribute('aria-hidden') !== 'true',
  );
}

export function ModalShell({
  title,
  description,
  open,
  onClose,
  closeOnBackdrop = true,
  closeOnEscape = true,
  closeDisabled = false,
  children,
}: ModalShellProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousActiveElementRef = useRef<HTMLElement | null>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    if (!open) {
      return;
    }

    previousActiveElementRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;

    if (activeModalCount === 0) {
      previousBodyOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
    }

    activeModalCount += 1;

    const frame = window.requestAnimationFrame(() => {
      const dialog = dialogRef.current;

      if (!dialog) {
        return;
      }

      const focusableElements = getFocusableElements(dialog);
      const firstFocusable = focusableElements[0] ?? dialog;
      firstFocusable.focus();
    });

    return () => {
      window.cancelAnimationFrame(frame);
      activeModalCount = Math.max(0, activeModalCount - 1);

      if (activeModalCount === 0) {
        document.body.style.overflow = previousBodyOverflow;
      }

      if (previousActiveElementRef.current && document.contains(previousActiveElementRef.current)) {
        previousActiveElementRef.current.focus();
      }
    };
  }, [open]);

  const handleBackdropClick = () => {
    if (!closeOnBackdrop || closeDisabled) {
      return;
    }

    onClose();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      if (!closeOnEscape || closeDisabled) {
        return;
      }

      event.stopPropagation();
      onClose();
      return;
    }

    if (event.key !== 'Tab') {
      return;
    }

    const dialog = dialogRef.current;

    if (!dialog) {
      return;
    }

    const focusableElements = getFocusableElements(dialog);

    if (focusableElements.length === 0) {
      event.preventDefault();
      dialog.focus();
      return;
    }

    const firstFocusable = focusableElements[0];
    const lastFocusable = focusableElements[focusableElements.length - 1];
    const activeElement = document.activeElement;

    if (event.shiftKey && activeElement === firstFocusable) {
      event.preventDefault();
      lastFocusable.focus();
      return;
    }

    if (!event.shiftKey && activeElement === lastFocusable) {
      event.preventDefault();
      firstFocusable.focus();
    }
  };

  if (!open) {
    return null;
  }

  return (
    <div className="ui-modal-backdrop" role="presentation" onClick={handleBackdropClick}>
      <div
        ref={dialogRef}
        className="ui-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
        onClick={event => event.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        <header className="ui-modal__header">
          <div className="stack">
            <h3 id={titleId}>{title}</h3>
            {description ? (
              <p id={descriptionId} className="subtle">
                {description}
              </p>
            ) : null}
          </div>
          <Button type="button" variant="ghost" onClick={onClose} disabled={closeDisabled}>
            Close
          </Button>
        </header>
        <div className="ui-modal__content">{children}</div>
      </div>
    </div>
  );
}
