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
        <div className="page-layout__lead">
          <div className="page-layout__copy">
            {eyebrow ? <span className="eyebrow">{eyebrow}</span> : null}
            <div className="page-layout__headline">
              <h1>{title}</h1>
              <p>{description}</p>
            </div>
          </div>
        </div>
        {actions ? (
          <div className="page-layout__action-dock">
            <div className="page-layout__actions">{actions}</div>
          </div>
        ) : null}
      </header>
      <div className="page-layout__body">{children}</div>
    </div>
  );
}
