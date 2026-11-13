import React from 'react';
import { AlertTriangle, RefreshCw, SearchX } from 'lucide-react';
import { Button } from './Button';

export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-xl bg-surface-container-high/80 ${className}`}
      aria-hidden="true"
    />
  );
}

export function BusinessCardSkeleton() {
  return (
    <div className="rounded-2xl bg-surface-container-lowest border border-outline-variant/30 p-4 space-y-3">
      <div className="flex gap-3">
        <Skeleton className="w-20 h-20 rounded-xl shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
          <Skeleton className="h-3 w-2/3" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 pt-1">
        <Skeleton className="h-10 rounded-xl" />
        <Skeleton className="h-10 rounded-xl" />
      </div>
    </div>
  );
}

export function EmptyState({
  title,
  titleUr,
  description,
  icon,
  action,
}: {
  title: string;
  titleUr?: string;
  description: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-surface-container-lowest border border-outline-variant/30 p-8 text-center flex flex-col items-center justify-center gap-3">
      <div className="w-12 h-12 rounded-2xl bg-surface-container text-primary flex items-center justify-center">
        {icon ?? <SearchX className="w-6 h-6" />}
      </div>
      <div>
        <h3 className="text-base font-bold text-on-surface">{title}</h3>
        {titleUr && (
          <p className="font-urdu text-sm text-primary mt-0.5" dir="rtl">
            {titleUr}
          </p>
        )}
        <p className="text-sm text-on-surface-variant max-w-md mt-1">{description}</p>
      </div>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

export function ErrorState({
  title = 'Unable to load right now',
  description = 'Please check your connection and try again.',
  onRetry,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="rounded-2xl bg-error-container/40 border border-error/25 p-6 text-center flex flex-col items-center gap-3">
      <AlertTriangle className="w-7 h-7 text-error" />
      <div>
        <h3 className="text-base font-bold text-on-surface">{title}</h3>
        <p className="text-sm text-on-surface-variant mt-1">{description}</p>
      </div>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry} leftIcon={<RefreshCw className="w-4 h-4" />}>
          Try Again
        </Button>
      )}
    </div>
  );
}

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false, errorMessage: '' };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, errorMessage: error?.message ?? 'Unexpected UI error' };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-surface flex items-center justify-center p-6">
          <div className="max-w-md w-full rounded-2xl bg-surface-container-lowest border border-outline-variant/40 p-6 text-center shadow-lg">
            <AlertTriangle className="w-10 h-10 text-error mx-auto mb-3" />
            <h1 className="text-lg font-bold text-on-surface">Something went wrong</h1>
            <p className="text-sm text-on-surface-variant mt-1 mb-4">{this.state.errorMessage}</p>
            <Button onClick={() => window.location.reload()}>Reload App</Button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
