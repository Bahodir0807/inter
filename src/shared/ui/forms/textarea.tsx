import { forwardRef, TextareaHTMLAttributes, useId } from 'react';
import { cn } from '../../lib/cn';

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
    <label className={cn('ui-field', fieldClassName)} htmlFor={textareaId}>
      {label ? <span className="ui-field__label">{label}</span> : null}
      {hint ? <span id={`${textareaId}-hint`} className="ui-field__hint">{hint}</span> : null}
      <textarea
        id={textareaId}
        ref={ref}
        aria-invalid={!!error}
        aria-describedby={descriptionIds}
        className={cn('ui-input', error && 'ui-input--error', className)}
        {...props}
      />
      {error ? <span id={`${textareaId}-error`} className="ui-field__error">{error}</span> : null}
    </label>
  );
});
