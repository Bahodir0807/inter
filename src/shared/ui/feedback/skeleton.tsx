import { CSSProperties } from 'react';
import { cn } from '../../lib/cn';
import styles from './skeleton.module.css';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
  style?: CSSProperties;
}

export function Skeleton({ className, variant = 'rectangular', width, height }: SkeletonProps) {
  return (
    <div
      className={cn(styles.skeleton, styles[`skeleton--${variant}`], className)}
      style={{ width, height }}
      aria-hidden="true"
    />
  );
}

export function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn(styles.skeletonText, className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          variant="text"
          className={styles.skeletonTextLine}
          style={{ width: i === lines - 1 ? '70%' : '100%' }}
        />
      ))}
    </div>
  );
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn(styles.skeletonCard, className)}>
      <div className={styles.skeletonCardHeader}>
        <Skeleton variant="circular" width={40} height={40} />
        <div className={styles.skeletonCardHeaderContent}>
          <Skeleton variant="text" width="60%" height={16} />
          <Skeleton variant="text" width="40%" height={12} />
        </div>
      </div>
      <div className={styles.skeletonCardBody}>
        <SkeletonText lines={2} />
      </div>
    </div>
  );
}

export function SkeletonTable({ rows = 5, columns = 4, className }: { rows?: number; columns?: number; className?: string }) {
  return (
    <div className={cn(styles.skeletonTable, className)}>
      <div className={styles.skeletonTableHeader}>
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={`header-${i}`} variant="text" height={16} />
        ))}
      </div>
      <div className={styles.skeletonTableBody}>
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={`row-${rowIndex}`} className={styles.skeletonTableRow}>
            {Array.from({ length: columns }).map((_, colIndex) => (
              <Skeleton key={`cell-${rowIndex}-${colIndex}`} variant="text" height={14} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
