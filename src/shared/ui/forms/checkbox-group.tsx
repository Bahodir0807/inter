import { useId } from 'react';
import { cn } from '../../lib/cn';

interface CheckboxOption {
  value: string;
  label: string;
  description?: string;
}

interface CheckboxGroupProps {
  label: string;
  hint?: string;
  options: CheckboxOption[];
  values: string[];
  onChange: (values: string[]) => void;
  className?: string;
}

export function CheckboxGroup({ label, hint, options, values, onChange, className }: CheckboxGroupProps) {
  const groupId = useId();
  const selectedOptions = options.filter(option => values.includes(option.value));
  const visibleSelected = selectedOptions.slice(0, 4);
  const remainingSelectedCount = selectedOptions.length - visibleSelected.length;
  const orderedOptions = [...selectedOptions, ...options.filter(option => !values.includes(option.value))];

  const toggle = (value: string) => {
    if (values.includes(value)) {
      onChange(values.filter(item => item !== value));
      return;
    }

    onChange([...values, value]);
  };

  return (
    <div
      className={cn('ui-field', className)}
      role="group"
      aria-labelledby={`${groupId}-label`}
      aria-describedby={hint ? `${groupId}-hint` : undefined}
    >
      <div className="choice-header">
        <div className="choice-header__copy">
          <span id={`${groupId}-label`} className="ui-field__label">{label}</span>
          {hint ? <span id={`${groupId}-hint`} className="ui-field__hint">{hint}</span> : null}
        </div>
        <span className="choice-header__meta">{values.length ? `${values.length} selected` : `${options.length} available`}</span>
      </div>
      {selectedOptions.length ? (
        <div className="choice-summary" aria-live="polite">
          {visibleSelected.map(option => (
            <span key={option.value} className="choice-summary__item">
              {option.label}
            </span>
          ))}
          {remainingSelectedCount > 0 ? (
            <span className="choice-summary__item choice-summary__item--muted">+{remainingSelectedCount} more</span>
          ) : null}
        </div>
      ) : null}
      <div className="choice-grid">
        {orderedOptions.map(option => {
          const checked = values.includes(option.value);
          return (
            <button
              key={option.value}
              type="button"
              className={cn('choice-card', checked && 'choice-card--active')}
              aria-pressed={checked}
              onClick={() => toggle(option.value)}
            >
              <div className="choice-card__head">
                <strong>{option.label}</strong>
                <span className={cn('choice-card__mark', checked && 'choice-card__mark--active')} aria-hidden="true" />
              </div>
              {option.description ? <span className="subtle">{option.description}</span> : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
