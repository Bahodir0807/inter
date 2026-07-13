import { forwardRef, InputHTMLAttributes, useId } from 'react';
import { cn } from '../../lib/cn';
import styles from './field.module.css';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  fieldClassName?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, hint, className, fieldClassName, id, ...props },
  ref,
) {
  const fallbackId = useId();
  const inputId = id ?? fallbackId;
  const descriptionIds = [hint ? `${inputId}-hint` : null, error ? `${inputId}-error` : null]
    .filter(Boolean)
    .join(' ') || undefined;

  return (
    <label className={cn(styles.uiField, fieldClassName)} htmlFor={inputId}>
      {label ? <span className={styles.uiFieldLabel}>{label}</span> : null}
      {hint ? <span id={`${inputId}-hint`} className={styles.uiFieldHint}>{hint}</span> : null}
      <input
        id={inputId}
        ref={ref}
        aria-invalid={!!error}
        aria-describedby={descriptionIds}
        className={cn(styles.uiInput, error && styles.uiInputError, className)}
        {...props}
      />
      {error ? <span id={`${inputId}-error`} className={styles.uiFieldError}>{error}</span> : null}
    </label>
  );
});
