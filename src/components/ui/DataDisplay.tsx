import React, { useEffect, useState } from 'react';
import {
  BadgeCheck,
  ChevronLeft,
  ChevronRight,
  Download,
  MessageCircle,
  Phone,
  Share2,
  Star,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { buildTelUrl, buildWhatsAppUrl } from '../../lib/phone';

export function StarRating({
  rating,
  count,
  interactive = false,
  onChange,
  size = 'sm',
}: {
  rating: number | null;
  count?: number;
  interactive?: boolean;
  onChange?: (val: number) => void;
  size?: 'sm' | 'md';
}) {
  const val = rating ?? 0;
  const starDim = size === 'md' ? 'w-5 h-5' : 'w-4 h-4';

  if (interactive && onChange) {
    return (
      <div className="inline-flex items-center gap-1" role="radiogroup" aria-label="Rating">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            aria-label={`${n} stars`}
            className="p-1 cursor-pointer hover:scale-110 transition-transform"
          >
            <Star
              className={`${starDim} ${
                n <= val
                  ? 'fill-secondary-container text-secondary-container'
                  : 'text-outline-variant'
              }`}
            />
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-1.5 tabular-nums">
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-secondary-container text-on-secondary-container text-xs font-extrabold">
        <Star className="w-3.5 h-3.5 fill-current" />
        <span>{val > 0 ? val.toFixed(1) : 'New'}</span>
      </span>
      {typeof count === 'number' && (
        <span className="text-xs text-on-surface-variant">({count})</span>
      )}
    </div>
  );
}

export function Tabs<T extends string>({
  tabs,
  active,
  onChange,
}: {
  tabs: Array<{ id: T; label: string; count?: number }>;
  active: T;
  onChange: (id: T) => void;
}) {
  return (
    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar border-b border-outline-variant/40 pb-2">
      {tabs.map((tab) => {
        const isActive = tab.id === active;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
              isActive
                ? 'bg-primary text-on-primary shadow-xs'
                : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface'
            }`}
          >
            <span>{tab.label}</span>
            {typeof tab.count === 'number' && (
              <span
                className={`ms-1.5 px-1.5 py-0.5 rounded-md text-[11px] tabular-nums ${
                  isActive ? 'bg-white/20 text-on-primary' : 'bg-surface-container text-on-surface-variant'
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export function Pagination({
  page,
  totalPages,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  onPageChange: (next: number) => void;
}) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-2 pt-4">
      <button
        type="button"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
        className="min-h-[40px] px-3 rounded-xl border border-outline-variant/60 text-xs font-semibold disabled:opacity-40 cursor-pointer flex items-center gap-1"
      >
        <ChevronLeft className="w-4 h-4 rtl:rotate-180" /> Prev
      </button>
      <span className="text-xs font-semibold text-on-surface-variant tabular-nums px-2">
        Page {page} of {totalPages}
      </span>
      <button
        type="button"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
        className="min-h-[40px] px-3 rounded-xl border border-outline-variant/60 text-xs font-semibold disabled:opacity-40 cursor-pointer flex items-center gap-1"
      >
        Next <ChevronRight className="w-4 h-4 rtl:rotate-180" />
      </button>
    </div>
  );
}

export function Lightbox({
  images,
  index,
  onClose,
  onIndexChange,
  title,
  phone,
  whatsapp,
  onShare,
}: {
  images: string[];
  index: number | null;
  onClose: () => void;
  onIndexChange: (next: number) => void;
  title?: string;
  phone?: string;
  whatsapp?: string | null;
  onShare?: () => void;
}) {
  const [zoomed, setZoomed] = useState(false);

  useEffect(() => {
    setZoomed(false);
  }, [index]);

  useEffect(() => {
    if (index === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') onIndexChange((index + 1) % images.length);
      if (e.key === 'ArrowLeft') onIndexChange((index - 1 + images.length) % images.length);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [index, images.length, onClose, onIndexChange]);

  if (index === null || !images[index]) return null;

  return (
    <div
      className="fixed inset-0 z-[70] bg-black/95 flex flex-col justify-between p-3 sm:p-5 text-white"
      role="dialog"
      aria-modal="true"
      aria-label="Photo gallery viewer"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Top Bar */}
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 space-y-0.5">
          <div className="flex items-center gap-2 flex-wrap">
            {title && <p className="text-sm font-bold truncate">{title}</p>}
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 text-[10px] font-bold uppercase tracking-wider">
              <BadgeCheck className="w-3 h-3" /> Verified Store Photo
            </span>
          </div>
          <p className="text-xs text-white/75 tabular-nums flex items-center gap-2">
            <span>Photo {index + 1} of {images.length}</span>
            <span className="font-urdu" dir="rtl">تصویر {index + 1} از {images.length}</span>
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            aria-label={zoomed ? 'Reset zoom' : 'Zoom in'}
            onClick={() => setZoomed((z) => !z)}
            className="w-10 h-10 rounded-full bg-white/15 text-white flex items-center justify-center hover:bg-white/25 cursor-pointer"
          >
            {zoomed ? <ZoomOut className="w-5 h-5" /> : <ZoomIn className="w-5 h-5" />}
          </button>
          <a
            href={images[index]}
            target="_blank"
            rel="noopener noreferrer"
            download
            aria-label="Open or download full image"
            className="w-10 h-10 rounded-full bg-white/15 text-white flex items-center justify-center hover:bg-white/25"
          >
            <Download className="w-5 h-5" />
          </a>
          {onShare && (
            <button
              type="button"
              aria-label="Share"
              onClick={onShare}
              className="w-10 h-10 rounded-full bg-white/15 text-white flex items-center justify-center hover:bg-white/25 cursor-pointer"
            >
              <Share2 className="w-5 h-5" />
            </button>
          )}
          <button
            type="button"
            aria-label="Close gallery"
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/15 text-white flex items-center justify-center hover:bg-white/25 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Center Stage */}
      <div className="relative flex-1 flex items-center justify-center overflow-hidden my-2">
        {images.length > 1 && (
          <button
            type="button"
            aria-label="Previous photo"
            onClick={() => onIndexChange((index - 1 + images.length) % images.length)}
            className="absolute start-2 z-10 w-11 h-11 rounded-full bg-white/15 text-white flex items-center justify-center hover:bg-white/25 cursor-pointer"
          >
            <ChevronLeft className="w-6 h-6 rtl:rotate-180" />
          </button>
        )}

        <img
          src={images[index]}
          alt={`Gallery item ${index + 1}`}
          referrerPolicy="no-referrer"
          onClick={() => setZoomed((z) => !z)}
          className={`max-h-[68vh] max-w-[90vw] object-contain rounded-xl shadow-2xl transition-transform duration-200 cursor-zoom-in ${
            zoomed ? 'scale-125 cursor-zoom-out' : 'scale-100'
          }`}
        />

        <span className="pointer-events-none absolute bottom-3 px-3 py-1 rounded-full bg-black/55 backdrop-blur-xs text-[11px] text-white/85">
          {zoomed ? 'Tap photo to reset zoom' : 'Tap photo to zoom in'}
        </span>

        {images.length > 1 && (
          <button
            type="button"
            aria-label="Next photo"
            onClick={() => onIndexChange((index + 1) % images.length)}
            className="absolute end-2 z-10 w-11 h-11 rounded-full bg-white/15 text-white flex items-center justify-center hover:bg-white/25 cursor-pointer"
          >
            <ChevronRight className="w-6 h-6 rtl:rotate-180" />
          </button>
        )}
      </div>

      {/* Bottom Thumbnail Carousel + Quick Store Actions */}
      <div className="space-y-3 max-w-2xl mx-auto w-full">
        {images.length > 1 && (
          <div className="flex items-center justify-center gap-2 overflow-x-auto no-scrollbar py-1">
            {images.map((url, idx) => (
              <button
                key={`${url}-${idx}`}
                type="button"
                aria-label={`View photo ${idx + 1}`}
                onClick={() => onIndexChange(idx)}
                className={`w-14 h-14 rounded-lg overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${
                  idx === index ? 'border-primary-fixed scale-105' : 'border-transparent opacity-60 hover:opacity-100'
                }`}
              >
                <img src={url} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              </button>
            ))}
          </div>
        )}

        {phone && (
          <div className="flex items-center justify-center gap-2 pt-1">
            <a
              href={buildTelUrl(phone)}
              className="h-10 px-4 rounded-xl bg-primary text-on-primary text-xs font-bold inline-flex items-center gap-1.5"
            >
              <Phone className="w-4 h-4" /> Call Store
            </a>
            {whatsapp && (
              <a
                href={buildWhatsAppUrl(whatsapp, title ? `Assalam o Alaikum! Regarding ${title}` : undefined)}
                target="_blank"
                rel="noopener noreferrer"
                className="h-10 px-4 rounded-xl bg-whatsapp text-white text-xs font-bold inline-flex items-center gap-1.5"
              >
                <MessageCircle className="w-4 h-4" /> WhatsApp
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Renders safe structured markdown (headings, bullet lists, bold) as React elements
 * with zero raw HTML injection.
 */
export function MarkdownSafe({ content }: { content: string }) {
  const lines = content.split('\n');

  const renderInline = (text: string) => {
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((p, idx) =>
      p.startsWith('**') && p.endsWith('**') ? (
        <strong key={idx} className="font-bold text-on-surface">
          {p.slice(2, -2)}
        </strong>
      ) : (
        <React.Fragment key={idx}>{p}</React.Fragment>
      )
    );
  };

  return (
    <div className="space-y-2.5 text-sm text-on-surface-variant leading-relaxed">
      {lines.map((rawLine, idx) => {
        const line = rawLine.trim();
        if (!line) return <div key={idx} className="h-1" />;
        if (line.startsWith('### ')) {
          return (
            <h3 key={idx} className="text-base font-bold text-on-surface pt-2">
              {renderInline(line.slice(4))}
            </h3>
          );
        }
        if (line.startsWith('## ')) {
          return (
            <h2 key={idx} className="text-lg font-bold text-on-surface pt-3">
              {renderInline(line.slice(3))}
            </h2>
          );
        }
        if (line.startsWith('- ')) {
          return (
            <div key={idx} className="flex items-start gap-2 ps-2">
              <span className="text-primary font-bold mt-0.5">•</span>
              <span>{renderInline(line.slice(2))}</span>
            </div>
          );
        }
        return <p key={idx}>{renderInline(line)}</p>;
      })}
    </div>
  );
}
