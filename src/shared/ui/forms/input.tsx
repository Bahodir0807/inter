import { forwardRef, InputHTMLAttributes, useId } from 'react';
import { cn } from '../../lib/cn';

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
    <label className={cn('ui-field', fieldClassName)} htmlFor={inputId}>
      {label ? <span className="ui-field__label">{label}</span> : null}
      {hint ? <span id={`${inputId}-hint`} className="ui-field__hint">{hint}</span> : null}
      <input
        id={inputId}
        ref={ref}
        aria-invalid={!!error}
        aria-describedby={descriptionIds}
        className={cn('ui-input', error && 'ui-input--error', className)}
        {...props}
      />
      {error ? <span id={`${inputId}-error`} className="ui-field__error">{error}</span> : null}
    </label>
  );
});
