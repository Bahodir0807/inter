import { PropsWithChildren, ReactNode } from 'react';
import styles from './table-shell.module.css';

interface TableShellProps extends PropsWithChildren {
  title: string;
  description?: string;
  actions?: ReactNode;
}

export function TableShell({ title, description, actions, children }: TableShellProps) {
  return (
    <section className={styles.tableShell}>
      <header className={styles.tableShellHeader}>
        <div className={styles.tableShellTitle}>
          <h3 className={styles.tableShellTitleText}>{title}</h3>
          {description ? <p className={styles.tableShellDescription}>{description}</p> : null}
        </div>
        {actions}
      </header>
      <div className={styles.tableShellContent}>
        <div className={styles.tableShellScroller}>
          {children}
        </div>
      </div>
    </section>
  );
}
