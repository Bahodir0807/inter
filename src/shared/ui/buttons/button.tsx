import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '../../lib/cn';
import styles from './button.module.css';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'md' | 'sm';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = 'primary', size = 'md', fullWidth = false, isLoading = false, disabled, children, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || isLoading}
      className={cn(
        styles.uiButton,
        variant === 'primary' && styles.uiButtonPrimary,
        variant === 'secondary' && styles.uiButtonSecondary,
        variant === 'ghost' && styles.uiButtonGhost,
        variant === 'danger' && styles.uiButtonDanger,
        size === 'sm' && styles.uiButtonSm,
        fullWidth && styles.uiButtonFull,
        isLoading && styles.uiButtonLoading,
        className,
      )}
      {...props}
    >
      {isLoading ? (
        <span className={styles.uiButtonSpinner} aria-hidden="true">
          <span className={styles.uiButtonSpinnerDot} />
          <span className={styles.uiButtonSpinnerDot} />
          <span className={styles.uiButtonSpinnerDot} />
        </span>
      ) : (
        children
      )}
    </button>
  );
});
