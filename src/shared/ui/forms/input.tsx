import { forwardRef, InputHTMLAttributes } from 'react';
import { cn } from '../../lib/cn';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, className, ...props },
  ref,
) {
  return (
    <label className="ui-field">
      {label ? <span className="ui-field__label">{label}</span> : null}
      <input ref={ref} className={cn('ui-input', error && 'ui-input--error', className)} {...props} />
      {error ? <span className="ui-field__error">{error}</span> : null}
    </label>
  );
});
