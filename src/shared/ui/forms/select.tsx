import { forwardRef, SelectHTMLAttributes, useId } from 'react';
import { cn } from '../../lib/cn';

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
    <label className={cn('ui-field', fieldClassName)} htmlFor={selectId}>
      {label ? <span className="ui-field__label">{label}</span> : null}
      {hint ? <span id={`${selectId}-hint`} className="ui-field__hint">{hint}</span> : null}
      <select
        id={selectId}
        ref={ref}
        aria-invalid={!!error}
        aria-describedby={descriptionIds}
        className={cn('ui-select', error && 'ui-input--error', className)}
        {...props}
      >
        {children}
      </select>
      {error ? <span id={`${selectId}-error`} className="ui-field__error">{error}</span> : null}
    </label>
  );
});
