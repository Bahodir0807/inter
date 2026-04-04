import { PropsWithChildren } from 'react';
import { Button } from '../buttons/button';

interface ModalShellProps extends PropsWithChildren {
  title: string;
  description?: string;
  open: boolean;
  onClose: () => void;
}

export function ModalShell({ title, description, open, onClose, children }: ModalShellProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="ui-modal-backdrop" role="presentation" onClick={onClose}>
      <div className="ui-modal" role="dialog" aria-modal="true" onClick={event => event.stopPropagation()}>
        <header className="ui-modal__header">
          <div className="stack">
            <h3>{title}</h3>
            {description ? <p className="subtle">{description}</p> : null}
          </div>
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
        </header>
        <div>{children}</div>
      </div>
    </div>
  );
}
