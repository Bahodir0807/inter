import { HTMLAttributes } from 'react';
import { cn } from '../../lib/cn';
import styles from './badge.module.css';

type BadgeTone = 'neutral' | 'success' | 'warning' | 'danger' | 'info';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
}

export function Badge({ tone = 'neutral', className, ...props }: BadgeProps) {
  return <span className={cn(styles.uiBadge, tone === 'neutral' && styles.uiBadgeNeutral, tone === 'success' && styles.uiBadgeSuccess, tone === 'warning' && styles.uiBadgeWarning, tone === 'danger' && styles.uiBadgeDanger, tone === 'info' && styles.uiBadgeInfo, className)} {...props} />;
}
