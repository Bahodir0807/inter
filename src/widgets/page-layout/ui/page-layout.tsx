import { PropsWithChildren, ReactNode } from 'react';
import { cn } from '../../../shared/lib/cn';
import styles from './page-layout.module.css';

interface PageLayoutProps extends PropsWithChildren {
  title: string;
  description: string;
  actions?: ReactNode;
  eyebrow?: string;
  variant?: 'default' | 'feature';
}

export function PageLayout({ title, description, actions, eyebrow, variant = 'default', children }: PageLayoutProps) {
  return (
    <div className={cn(styles.pageLayout, variant === 'feature' && styles.pageLayoutFeature)}>
      <header className={styles.pageLayoutHeader}>
        <div className={styles.pageLayoutLead}>
          <div className={styles.pageLayoutCopy}>
            {eyebrow ? <span className="eyebrow">{eyebrow}</span> : null}
            <div className={styles.pageLayoutHeadline}>
              <h1>{title}</h1>
              <p>{description}</p>
            </div>
          </div>
        </div>
        {actions ? (
          <div className={styles.pageLayoutActionDock}>
            <div className={styles.pageLayoutActions}>{actions}</div>
          </div>
        ) : null}
      </header>
      <div className={styles.pageLayoutBody}>{children}</div>
    </div>
  );
}