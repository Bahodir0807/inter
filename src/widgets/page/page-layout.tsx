import { PropsWithChildren, ReactNode } from 'react';

interface PageLayoutProps extends PropsWithChildren {
  title: string;
  description: string;
  actions?: ReactNode;
  eyebrow?: string;
}

export function PageLayout({ title, description, actions, eyebrow, children }: PageLayoutProps) {
  return (
    <div className="page-layout">
      <header className="page-layout__header">
        <div className="page-layout__copy">
          {eyebrow ? <span className="eyebrow">{eyebrow}</span> : null}
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
        {actions ? <div className="page-layout__actions">{actions}</div> : null}
      </header>
      <div className="page-layout__body">{children}</div>
    </div>
  );
}
