import { forwardRef, TextareaHTMLAttributes, useId } from 'react';
import { cn } from '../../lib/cn';
import styles from './field.module.css';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
  fieldClassName?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, error, hint, className, fieldClassName, id, ...props },
  ref,
) {
  const fallbackId = useId();
  const textareaId = id ?? fallbackId;
  const descriptionIds = [hint ? `${textareaId}-hint` : null, error ? `${textareaId}-error` : null]
    .filter(Boolean)
    .join(' ') || undefined;

  return (
    <label className={cn(styles.uiField, fieldClassName)} htmlFor={textareaId}>
      {label ? <span className={styles.uiFieldLabel}>{label}</span> : null}
      {hint ? <span id={`${textareaId}-hint`} className={styles.uiFieldHint}>{hint}</span> : null}
      <textarea
        id={textareaId}
        ref={ref}
        aria-invalid={!!error}
        aria-describedby={descriptionIds}
        className={cn(styles.uiTextarea, error && styles.uiInputError, className)}
        {...props}
      />
      {error ? <span id={`${textareaId}-error`} className={styles.uiFieldError}>{error}</span> : null}
    </label>
  );
});
