import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown, Languages } from 'lucide-react';
import { useI18n } from '../../lib/i18n';

export function LanguageMenu() {
  const { lang, setLang, urduHints, setUrduHints } = useI18n();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener('mousedown', onOutside);
    return () => window.removeEventListener('mousedown', onOutside);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        aria-label="Switch Language"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="h-9 sm:h-10 px-2 sm:px-3 rounded-full bg-surface-container-low hover:bg-surface-container text-on-surface flex items-center gap-1 sm:gap-1.5 border border-outline-variant/40 transition-colors cursor-pointer shrink-0 whitespace-nowrap"
      >
        <Languages className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary shrink-0" />
        <span className="font-urdu text-[11px] font-bold text-secondary leading-none">اردو</span>
        <span className="text-[10px] text-outline">/</span>
        <span className="text-[11px] sm:text-xs font-bold text-primary">EN</span>
        <ChevronDown className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-on-surface-variant shrink-0" />
      </button>

      {open && (
        <div className="absolute end-0 mt-2 w-56 rounded-2xl bg-surface-container-lowest border border-outline-variant/40 shadow-xl p-2 z-50">
          <button
            type="button"
            onClick={() => {
              setLang('en');
              setOpen(false);
            }}
            className={`w-full px-3 py-2.5 rounded-xl text-left text-sm font-semibold flex items-center justify-between cursor-pointer ${
              lang === 'en' ? 'bg-primary text-on-primary' : 'text-on-surface hover:bg-surface-container-low'
            }`}
          >
            <span>English (LTR)</span>
            {lang === 'en' && <span className="text-xs">✓</span>}
          </button>
          <button
            type="button"
            onClick={() => {
              setLang('ur');
              setOpen(false);
            }}
            className={`w-full px-3 py-2.5 rounded-xl text-right font-urdu text-sm font-semibold flex items-center justify-between cursor-pointer mt-1 ${
              lang === 'ur' ? 'bg-primary text-on-primary' : 'text-on-surface hover:bg-surface-container-low'
            }`}
          >
            <span>اردو (RTL)</span>
            {lang === 'ur' && <span className="text-xs font-sans">✓</span>}
          </button>

          {lang === 'en' && (
            <label className="mt-2 pt-2 border-t border-outline-variant/30 px-2 py-1.5 flex items-center justify-between gap-2 text-xs text-on-surface-variant cursor-pointer">
              <span>Show Urdu hints</span>
              <input
                type="checkbox"
                checked={urduHints}
                onChange={(e) => setUrduHints(e.target.checked)}
                className="w-4 h-4 accent-primary cursor-pointer"
              />
            </label>
          )}
        </div>
      )}
    </div>
  );
}
