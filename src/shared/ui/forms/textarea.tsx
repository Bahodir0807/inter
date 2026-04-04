import { forwardRef, TextareaHTMLAttributes } from 'react';
import { cn } from '../../lib/cn';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, error, className, ...props },
  ref,
) {
  return (
    <label className="ui-field">
      {label ? <span className="ui-field__label">{label}</span> : null}
      <textarea ref={ref} className={cn('ui-input', error && 'ui-input--error', className)} {...props} />
      {error ? <span className="ui-field__error">{error}</span> : null}
    </label>
  );
});
