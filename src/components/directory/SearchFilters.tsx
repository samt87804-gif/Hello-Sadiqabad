import React from 'react';
import { Filter, RotateCcw, X } from 'lucide-react';
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

      <Select
        label={lang === 'ur' ? 'علاقہ' : 'Neighborhood / Area'}
        labelUr={urduHints ? 'علاقہ' : undefined}
        value={filters.area}
        onChange={(e) => onChange({ area: e.target.value })}
      >
        <option value="">{lang === 'ur' ? 'تمام علاقے' : 'All Sadiqabad Areas'}</option>
        {areas.map((area) => (
          <option key={area.id} value={area.slug}>
            {bilingualText(lang, area.name_en, area.name_ur)}
          </option>
        ))}
      </Select>

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
