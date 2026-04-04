import { PropsWithChildren, ReactNode } from 'react';

interface TableShellProps extends PropsWithChildren {
  title: string;
  description?: string;
  actions?: ReactNode;
}

export function TableShell({ title, description, actions, children }: TableShellProps) {
  return (
    <section className="table-shell">
      <header className="table-shell__header">
        <div className="table-shell__title">
          <h3>{title}</h3>
          {description ? <p>{description}</p> : null}
        </div>
        {actions}
      </header>
      <div className="table-shell__content">{children}</div>
    </section>
  );
}
