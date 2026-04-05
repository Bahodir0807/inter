import { PropsWithChildren } from 'react';
import { cn } from '../../lib/cn';

interface FormSectionProps extends PropsWithChildren {
  title: string;
  description?: string;
  className?: string;
}

export function FormSection({ title, description, className, children }: FormSectionProps) {
  return (
    <section className={cn('form-section', className)}>
      <div className="form-section__header">
        <h3>{title}</h3>
        {description ? <p>{description}</p> : null}
      </div>
      <div className="form-section__body">{children}</div>
    </section>
  );
}
