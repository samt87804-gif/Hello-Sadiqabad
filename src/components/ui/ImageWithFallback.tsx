import React, { useState } from 'react';
import { Store } from 'lucide-react';

interface ImageWithFallbackProps {
  src?: string | null;
  alt: string;
  className?: string;
  fallbackIcon?: React.ReactNode;
  fallbackLabel?: string;
  onReportBroken?: () => void;
}

export function ImageWithFallback({
  src,
  alt,
  className = '',
  fallbackIcon,
  fallbackLabel,
  onReportBroken,
}: ImageWithFallbackProps) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-surface-container text-primary/70 select-none ${className}`}
        aria-label={alt}
      >
        {fallbackIcon ?? <Store className="w-7 h-7" />}
        {fallbackLabel && (
          <span className="text-[10px] font-bold uppercase tracking-wider mt-1 px-1 text-center truncate max-w-full">
            {fallbackLabel}
          </span>
        )}
        {failed && onReportBroken && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onReportBroken();
            }}
            className="mt-1.5 px-2 py-0.5 rounded bg-surface-container-lowest/90 text-[10px] font-bold text-error hover:underline cursor-pointer"
          >
            Report broken photo
          </button>
        )}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={`object-cover ${className}`}
    />
  );
}
