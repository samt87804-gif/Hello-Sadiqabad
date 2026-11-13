import React from 'react';
import { useI18n } from '../../lib/i18n';

export function Card({
  className = '',
  children,
  ...rest
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-2xl bg-surface-container-lowest border border-outline-variant/30 shadow-sm ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}

type BadgeVariant =
  | 'neutral'
  | 'primary'
  | 'secondary'
  | 'success'
  | 'warning'
  | 'danger'
  | 'gold';

const BADGE_CLASSES: Record<BadgeVariant, string> = {
  neutral: 'bg-surface-container text-on-surface-variant',
  primary: 'bg-primary-fixed text-on-primary-fixed-variant',
  secondary: 'bg-secondary-fixed text-on-secondary-fixed',
  success: 'bg-tertiary-fixed text-on-tertiary-fixed-variant',
  warning: 'bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-200',
  danger: 'bg-error-container text-on-error-container',
  gold: 'bg-secondary-container text-on-secondary-container font-bold',
};

export function Badge({
  variant = 'neutral',
  className = '',
  children,
}: {
  variant?: BadgeVariant;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap ${BADGE_CLASSES[variant]} ${className}`}
    >
      {children}
    </span>
  );
}

export function Container({
  size = 'lg',
  className = '',
  children,
}: {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  children: React.ReactNode;
}) {
  const maxWidth =
    size === 'sm'
      ? 'max-w-2xl'
      : size === 'md'
      ? 'max-w-4xl'
      : size === 'xl'
      ? 'max-w-7xl'
      : 'max-w-6xl';
  return <div className={`w-full ${maxWidth} mx-auto px-4 sm:px-6 ${className}`}>{children}</div>;
}

export function SectionHeading({
  title,
  titleUr,
  subtitle,
  action,
  className = '',
}: {
  title: string;
  titleUr?: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  const { lang, urduHints } = useI18n();
  const showUr = Boolean(titleUr && titleUr.trim() !== title.trim() && (lang === 'en' ? urduHints : false));

  return (
    <div className={`flex items-end justify-between gap-4 ${className}`}>
      <div className="min-w-0">
        <div className="flex items-center gap-2.5 flex-wrap">
          <h2 className="text-lg sm:text-xl font-bold text-on-surface tracking-tight">{title}</h2>
          {showUr && (
            <span className="font-urdu text-sm font-semibold text-primary" dir="rtl">
              {titleUr}
            </span>
          )}
        </div>
        {subtitle && <p className="text-xs sm:text-sm text-on-surface-variant mt-0.5">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
