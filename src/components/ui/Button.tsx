import React from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'whatsapp' | 'danger' | 'outline' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    'bg-primary text-on-primary hover:bg-primary-container shadow-sm active:scale-[0.98]',
  secondary:
    'bg-secondary text-on-secondary hover:opacity-95 shadow-sm active:scale-[0.98]',
  whatsapp:
    'bg-whatsapp text-white hover:brightness-95 shadow-sm active:scale-[0.98]',
  danger:
    'bg-error text-on-error hover:opacity-95 shadow-sm active:scale-[0.98]',
  outline:
    'border border-outline-variant bg-surface-container-lowest text-on-surface hover:bg-surface-container-low active:scale-[0.98]',
  ghost:
    'bg-transparent text-on-surface-variant hover:bg-surface-container-low hover:text-primary',
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: 'min-h-[38px] px-3 py-1.5 text-xs rounded-lg',
  md: 'min-h-[44px] px-4 py-2 text-sm rounded-xl',
  lg: 'min-h-[48px] px-5 py-2.5 text-base rounded-xl',
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  leftIcon,
  rightIcon,
  className = '',
  disabled,
  children,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 font-semibold whitespace-nowrap shrink-0 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...rest}
    >
      {loading ? (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : (
        leftIcon
      )}
      <span>{children}</span>
      {!loading && rightIcon}
    </button>
  );
}

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  variant?: 'surface' | 'ghost' | 'primary';
}

export function IconButton({
  label,
  variant = 'ghost',
  className = '',
  children,
  type = 'button',
  ...rest
}: IconButtonProps) {
  const styles =
    variant === 'primary'
      ? 'bg-primary text-on-primary hover:bg-primary-container'
      : variant === 'surface'
      ? 'bg-surface-container-lowest text-on-surface border border-outline-variant/40 hover:bg-surface-container-low shadow-sm'
      : 'bg-transparent text-on-surface-variant hover:bg-surface-container-low hover:text-primary';

  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={`w-11 h-11 rounded-full inline-flex items-center justify-center shrink-0 transition-colors cursor-pointer disabled:opacity-50 ${styles} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
