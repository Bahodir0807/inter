import { forwardRef, SelectHTMLAttributes } from 'react';
import { cn } from '../../lib/cn';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, error, className, children, ...props },
  ref,
) {
  return (
    <label className="ui-field">
      {label ? <span className="ui-field__label">{label}</span> : null}
      <select ref={ref} className={cn('ui-select', error && 'ui-input--error', className)} {...props}>
        {children}
      </select>
      {error ? <span className="ui-field__error">{error}</span> : null}
    </label>
  );
});
