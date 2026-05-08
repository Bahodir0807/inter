import { HTMLAttributes } from 'react';
import { cn } from '../../lib/cn';

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  const isMetricCard = typeof className === 'string' && className.includes('metric-card');
  return <section className={cn('ui-card section-card', isMetricCard && 'stat-card', className)} {...props} />;
}
