import { forwardRef, SelectHTMLAttributes, useId } from 'react';
import { cn } from '../../lib/cn';
import styles from './field.module.css';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
  fieldClassName?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, error, hint, className, fieldClassName, children, id, ...props },
  ref,
) {
  const fallbackId = useId();
  const selectId = id ?? fallbackId;
  const descriptionIds = [hint ? `${selectId}-hint` : null, error ? `${selectId}-error` : null]
    .filter(Boolean)
    .join(' ') || undefined;

  return (
    <label className={cn(styles.uiField, fieldClassName)} htmlFor={selectId}>
      {label ? <span className={styles.uiFieldLabel}>{label}</span> : null}
      {hint ? <span id={`${selectId}-hint`} className={styles.uiFieldHint}>{hint}</span> : null}
      <select
        id={selectId}
        ref={ref}
        aria-invalid={!!error}
        aria-describedby={descriptionIds}
        className={cn(styles.uiSelect, error && styles.uiInputError, className)}
        {...props}
      >
        {children}
      </select>
      {error ? <span id={`${selectId}-error`} className={styles.uiFieldError}>{error}</span> : null}
    </label>
  );
});
