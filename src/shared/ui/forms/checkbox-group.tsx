interface CheckboxOption {
  value: string;
  label: string;
  description?: string;
}

interface CheckboxGroupProps {
  label: string;
  options: CheckboxOption[];
  values: string[];
  onChange: (values: string[]) => void;
}

export function CheckboxGroup({ label, options, values, onChange }: CheckboxGroupProps) {
  const toggle = (value: string) => {
    if (values.includes(value)) {
      onChange(values.filter(item => item !== value));
      return;
    }

    onChange([...values, value]);
  };

  return (
    <div className="ui-field">
      <span className="ui-field__label">{label}</span>
      <div className="choice-grid">
        {options.map(option => {
          const checked = values.includes(option.value);
          return (
            <button
              key={option.value}
              type="button"
              className={`choice-card ${checked ? 'choice-card--active' : ''}`}
              onClick={() => toggle(option.value)}
            >
              <strong>{option.label}</strong>
              {option.description ? <span className="subtle">{option.description}</span> : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
