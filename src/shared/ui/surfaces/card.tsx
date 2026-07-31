import { HTMLAttributes } from 'react';
import { cn } from '../../lib/cn';
import styles from './card.module.css';

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  const raw = typeof className === 'string' ? className : '';
  const isMetricCard = raw.includes('metric-card');
  const remaining = raw
    .split(' ')
    .filter(Boolean)
    .filter(c => c !== 'metric-card')
    .join(' ');

  return (
    <section
      className={cn(styles.uiCard || 'ui-card', styles.sectionCard || 'section-card', isMetricCard ? styles.statCard : undefined, remaining)}
      {...props}
    />
  );
}
