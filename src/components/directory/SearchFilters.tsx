import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, Filter, MapPin, RotateCcw, Search, X } from 'lucide-react';
import type { AreaRow, CategoryRow } from '../../types/database';
import type { SearchFiltersState, SortOption } from '../../types/directory';
import { Button } from '../ui/Button';
import { Select } from '../ui/FormFields';
import { useI18n } from '../../lib/i18n';
import { bilingualText } from '../../lib/format';

export function SearchFiltersPanel({
  filters,
  categories,
  areas,
  onChange,
  onReset,
}: {
  filters: SearchFiltersState;
  categories: CategoryRow[];
  areas: AreaRow[];
  onChange: (patch: Partial<SearchFiltersState>) => void;
  onReset: () => void;
}) {
  const { lang, urduHints } = useI18n();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-on-surface flex items-center gap-1.5">
          <Filter className="w-4 h-4 text-primary" />
          <span>{lang === 'ur' ? 'فلٹرز' : 'Filters'}</span>
        </h3>
        <button
          type="button"
          onClick={onReset}
          className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1 cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" /> {lang === 'ur' ? 'صاف کریں' : 'Reset'}
        </button>
      </div>

      <Select
        label={lang === 'ur' ? 'شعبہ' : 'Category'}
        labelUr={urduHints ? 'شعبہ' : undefined}
        value={filters.category}
        onChange={(e) => onChange({ category: e.target.value })}
      >
        <option value="">{lang === 'ur' ? 'تمام شعبے' : 'All Categories'}</option>
        {categories.map((cat) => (
          <option key={cat.id} value={cat.slug}>
            {bilingualText(lang, cat.name_en, cat.name_ur)}
          </option>
        ))}
      </Select>

      <AreaPicker
        areas={areas}
        value={filters.area}
        onChange={(value) => onChange({ area: value })}
        lang={lang}
        urduHints={urduHints}
      />

      <div className="space-y-1.5">
        <span className="text-xs font-semibold text-on-surface block">
          {lang === 'ur' ? 'کم از کم ریٹنگ' : 'Minimum Rating'}
        </span>
        <div className="grid grid-cols-3 gap-1.5">
          {[
            { val: null, label: lang === 'ur' ? 'تمام' : 'Any' },
            { val: 4, label: '4.0★+' },
            { val: 4.5, label: '4.5★+' },
          ].map((opt) => {
            const active = filters.rating === opt.val;
            return (
              <button
                key={String(opt.val)}
                type="button"
                onClick={() => onChange({ rating: opt.val })}
                className={`min-h-[38px] rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                  active
                    ? 'bg-primary text-on-primary border-primary shadow-xs'
                    : 'bg-surface-container-low text-on-surface border-outline-variant/30 hover:bg-surface-container'
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      <Select
        label={lang === 'ur' ? 'ترتیب' : 'Sort By'}
        labelUr={urduHints ? 'ترتیب' : undefined}
        value={filters.sort}
        onChange={(e) => onChange({ sort: e.target.value as SortOption })}
      >
        <option value="relevance">{lang === 'ur' ? 'موزوں ترین اور تصدیق شدہ' : 'Relevance & Verified First'}</option>
        <option value="rating">{lang === 'ur' ? 'بہترین ریٹنگ' : 'Highest Rated'}</option>
        <option value="nearest">{lang === 'ur' ? 'قریب ترین' : 'Nearest to Me'}</option>
        <option value="newest">{lang === 'ur' ? 'تازہ ترین' : 'Newest Added'}</option>
      </Select>

      <div className="space-y-2 pt-1">
        {[
          { key: 'open' as const, label: 'Open Now (PKT)', ur: 'ابھی کھلا ہے' },
          { key: 'verified' as const, label: 'Verified Only', ur: 'تصدیق شدہ' },
          { key: 'offer' as const, label: 'Has Active Offer', ur: 'خصوصی رعایت' },
          { key: 'delivery' as const, label: 'Home Delivery', ur: 'ہوم ڈیلیوری' },
        ].map((item) => {
          const checked = Boolean(filters[item.key]);
          return (
            <button
              key={item.key}
              type="button"
              role="switch"
              aria-checked={checked}
              onClick={() => onChange({ [item.key]: !checked })}
              className="w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl bg-surface-container-low text-sm cursor-pointer hover:bg-surface-container transition-colors text-start"
            >
              <span className="flex flex-col">
                <span className="font-semibold text-on-surface text-xs sm:text-sm">
                  {lang === 'ur' ? item.ur : item.label}
                </span>
                {lang === 'en' && urduHints && (
                  <span className="font-urdu text-[10px] text-on-surface-variant leading-[1.6]" dir="rtl">
                    {item.ur}
                  </span>
                )}
              </span>
              <span
                className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
                  checked ? 'bg-primary' : 'bg-outline-variant/60'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
                    checked
                      ? 'ltr:translate-x-6 rtl:-translate-x-6'
                      : 'ltr:translate-x-1 rtl:-translate-x-1'
                  }`}
                />
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}


function AreaPicker({
  areas,
  value,
  onChange,
  lang,
  urduHints,
}: {
  areas: AreaRow[];
  value: string;
  onChange: (value: string) => void;
  lang: 'en' | 'ur';
  urduHints: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const rootRef = useRef<HTMLDivElement>(null);
  const selected = areas.find((area) => area.slug === value || area.id === value);
  const visibleAreas = useMemo(() => {
    const term = query.trim().normalize('NFKC').toLocaleLowerCase('en');
    return areas.filter((area) => !term || [area.name_en, area.name_ur].some((name) =>
      name.normalize('NFKC').toLocaleLowerCase('en').includes(term)
    ));
  }, [areas, query]);

  useEffect(() => {
    if (!open) return;
    const closeOnOutside = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', closeOnOutside);
    return () => document.removeEventListener('mousedown', closeOnOutside);
  }, [open]);

  const choose = (slug: string) => {
    onChange(slug);
    setQuery('');
    setOpen(false);
  };

  return (
    <div ref={rootRef} className="space-y-1.5 relative">
      <label className="flex items-center justify-between gap-2 text-xs font-semibold text-on-surface">
        <span>{lang === 'ur' ? 'علاقہ' : 'Neighborhood / Area'}</span>
        {urduHints && lang === 'en' && <span className="font-urdu text-[11px] text-on-surface-variant" dir="rtl">علاقہ</span>}
      </label>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className={`w-full min-h-[48px] rounded-2xl border px-3.5 py-2.5 flex items-center gap-2.5 text-start transition-all cursor-pointer shadow-xs ${
          open ? 'border-primary ring-2 ring-primary/15 bg-surface-container-lowest' : 'border-outline-variant/70 bg-surface-container-lowest hover:border-primary/60 hover:bg-surface-container-low'
        }`}
      >
        <span className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0"><MapPin className="w-4 h-4" /></span>
        <span className="flex-1 min-w-0">
          <span className="block text-sm font-bold text-on-surface truncate">{selected ? bilingualText(lang, selected.name_en, selected.name_ur) : (lang === 'ur' ? 'تمام علاقے' : 'All Sadiqabad Areas')}</span>
          <span className="block text-[10px] text-on-surface-variant">{selected ? (lang === 'ur' ? 'منتخب علاقہ' : 'Selected area') : `${areas.length} ${lang === 'ur' ? 'علاقے دستیاب' : 'areas available'}`}</span>
        </span>
        <ChevronDown className={`w-4 h-4 text-on-surface-variant shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute z-40 top-full mt-2 inset-x-0 rounded-2xl border border-outline-variant/60 bg-surface-container-lowest shadow-xl p-2.5 space-y-2">
          <div className="flex items-center gap-2 rounded-xl bg-surface-container-low px-3 h-10">
            <Search className="w-4 h-4 text-outline shrink-0" />
            <input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => { if (event.key === 'Escape') setOpen(false); }} placeholder={lang === 'ur' ? 'علاقہ تلاش کریں…' : 'Search an area…'} className="min-w-0 flex-1 bg-transparent outline-none text-xs text-on-surface placeholder:text-outline" />
            {query && <button type="button" onClick={() => setQuery('')} aria-label="Clear area search" className="text-outline hover:text-on-surface"><X className="w-3.5 h-3.5" /></button>}
          </div>
          <div role="listbox" aria-label="Sadiqabad areas" className="max-h-64 overflow-y-auto overscroll-contain space-y-0.5">
            <button type="button" role="option" aria-selected={!value} onClick={() => choose('')} className={`w-full px-3 py-2.5 rounded-xl flex items-center justify-between text-xs text-start transition-colors ${!value ? 'bg-primary/10 text-primary font-bold' : 'hover:bg-surface-container-low text-on-surface'}`}>
              <span>{lang === 'ur' ? 'تمام علاقے' : 'All Sadiqabad Areas'}</span>{!value && <Check className="w-4 h-4" />}
            </button>
            {visibleAreas.map((area) => {
              const active = value === area.slug || value === area.id;
              return <button key={area.id} type="button" role="option" aria-selected={active} onClick={() => choose(area.slug)} className={`w-full px-3 py-2.5 rounded-xl flex items-center justify-between gap-2 text-xs text-start transition-colors ${active ? 'bg-primary/10 text-primary font-bold' : 'hover:bg-surface-container-low text-on-surface'}`}>
                <span className="min-w-0 truncate">{bilingualText(lang, area.name_en, area.name_ur)}</span>{active && <Check className="w-4 h-4 shrink-0" />}
              </button>;
            })}
            {visibleAreas.length === 0 && <p className="px-3 py-5 text-center text-xs text-on-surface-variant">{lang === 'ur' ? 'کوئی علاقہ نہیں ملا' : 'No areas match your search'}</p>}
          </div>
          <div className="pt-1 border-t border-outline-variant/30 text-[10px] text-on-surface-variant flex justify-between"><span>{lang === 'ur' ? 'صادق آباد کے علاقے' : 'Sadiqabad neighbourhoods'}</span><span className="tabular-nums">{visibleAreas.length}/{areas.length}</span></div>
        </div>
      )}
    </div>
  );
}

export function SearchFiltersModal({
  open,
  onClose,
  filters,
  categories,
  areas,
  onChange,
  onReset,
}: {
  open: boolean;
  onClose: () => void;
  filters: SearchFiltersState;
  categories: CategoryRow[];
  areas: AreaRow[];
  onChange: (patch: Partial<SearchFiltersState>) => void;
  onReset: () => void;
}) {
  const { lang } = useI18n();
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/55 backdrop-blur-xs md:hidden"
      role="dialog"
      aria-modal="true"
      aria-label="Search filters"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-lg bg-surface-container-lowest rounded-t-3xl p-5 max-h-[85dvh] overflow-y-auto space-y-4 shadow-2xl">
        <div className="flex items-center justify-between pb-2 border-b border-outline-variant/30">
          <h3 className="text-base font-bold text-on-surface">
            {lang === 'ur' ? 'تلاش فلٹر کریں' : 'Refine Search'}
          </h3>
          <button
            type="button"
            aria-label="Close filters"
            onClick={onClose}
            className="w-10 h-10 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container-low cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <SearchFiltersPanel
          filters={filters}
          categories={categories}
          areas={areas}
          onChange={onChange}
          onReset={onReset}
        />

        <Button fullWidth onClick={onClose}>
          {lang === 'ur' ? 'فلٹرز لاگو کریں' : 'Apply Filters'}
        </Button>
      </div>
    </div>
  );
}
