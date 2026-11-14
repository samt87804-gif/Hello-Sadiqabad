import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Search, X } from 'lucide-react';
import { fetchCategoriesWithCounts } from '../lib/api';
import { useI18n } from '../lib/i18n';
import { bilingualText } from '../lib/format';
import { updatePageSeo } from '../lib/seo';
import type { CategoryWithChildren } from '../types/directory';
import { AppShell } from '../components/layout/AppShell';
import { CategoryIcon } from '../components/ui/CategoryIcon';
import { EmptyState } from '../components/ui/Feedback';
import { Card, Container, SectionHeading } from '../components/ui/Surface';

export function Categories() {
  const { lang, urduHints } = useI18n();
  const [categories, setCategories] = useState<CategoryWithChildren[]>([]);
  const [filterText, setFilterText] = useState('');

  useEffect(() => {
    updatePageSeo({
      title: 'All Categories — Hello Sadiqabad',
      description: 'Browse every business category and local service sector in Sadiqabad.',
      canonicalPath: '/categories',
    });
    fetchCategoriesWithCounts().then(setCategories);
  }, []);

  const q = filterText.trim().toLowerCase();
  const filtered = q
    ? categories.filter(
        (cat) =>
          cat.name_en.toLowerCase().includes(q) ||
          cat.name_ur.toLowerCase().includes(q) ||
          cat.children.some(
            (ch) => ch.name_en.toLowerCase().includes(q) || ch.name_ur.toLowerCase().includes(q)
          )
      )
    : categories;

  return (
    <AppShell>
      <Container className="py-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <SectionHeading
            title={lang === 'ur' ? 'تمام کاروباری شعبہ جات' : 'All Directory Categories'}
            titleUr="تمام کاروباری شعبہ جات"
            subtitle={
              lang === 'ur'
                ? 'صادق آباد کی تصدیق شدہ دکانیں اور سروسز دیکھنے کے لیے شعبہ منتخب کریں'
                : 'Select a sector to view verified shops, clinics, and providers in Sadiqabad'
            }
          />
          <div className="flex items-center bg-surface-container-lowest rounded-xl border border-outline-variant/60 px-3 h-10 w-full sm:w-64 shrink-0">
            <Search className="w-4 h-4 text-outline shrink-0" />
            <input
              type="text"
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              placeholder={lang === 'ur' ? 'شعبہ تلاش کریں...' : 'Filter categories...'}
              aria-label="Filter categories"
              className="flex-1 bg-transparent border-0 outline-none px-2 text-xs text-on-surface"
            />
            {filterText && (
              <button
                type="button"
                aria-label="Clear category filter"
                onClick={() => setFilterText('')}
                className="text-outline hover:text-on-surface cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            title={lang === 'ur' ? 'کوئی متعلقہ شعبہ نہیں ملا' : 'No matching categories'}
            description={
              lang === 'ur'
                ? 'کوئی دوسرا لفظ آزمائیں یا فلٹر صاف کریں۔'
                : 'Try a different keyword or clear the category filter.'
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((cat) => (
              <Card key={cat.id} className="p-0 gap-0 overflow-hidden">
                <Link
                  to={`/category/${cat.slug}`}
                  className="min-h-[116px] flex items-stretch group"
                >
                  <div
                    className="w-[30%] min-w-[92px] sm:min-w-[112px] bg-primary-fixed/70 flex items-center justify-center shrink-0"
                    style={{ color: cat.color }}
                  >
                    <CategoryIcon name={cat.icon} categoryKey={cat.slug} categoryLabel={cat.name_en} className="w-16 h-16 sm:w-[4.5rem] sm:h-[4.5rem]" />
                  </div>
                  <div className="flex-1 min-w-0 p-3 sm:p-4 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <h2 className="text-sm sm:text-base font-bold text-on-surface group-hover:text-primary transition-colors line-clamp-2">
                        {bilingualText(lang, cat.name_en, cat.name_ur)}
                      </h2>
                      {lang === 'en' && urduHints && (
                        <p className="font-urdu text-xs text-outline mt-1" dir="rtl">
                          {cat.name_ur}
                        </p>
                      )}
                      <p className="text-[11px] text-on-surface-variant mt-1">
                        {cat.listing_count ?? 0} {lang === 'ur' ? 'کاروبار' : 'listings'}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-outline group-hover:text-primary shrink-0 rtl:rotate-180" />
                  </div>
                </Link>
                {cat.children.length > 0 && (
                  <div className="px-3 pb-3 pt-2 border-t border-outline-variant/25 flex flex-wrap gap-2">
                    {cat.children.map((ch) => (
                      <Link
                        key={ch.id}
                        to={`/category/${ch.slug}`}
                        className="px-2.5 py-1 rounded-lg bg-surface-container-low hover:bg-surface-container text-xs font-semibold text-on-surface-variant inline-flex items-center gap-1"
                      >
                        <span>{bilingualText(lang, ch.name_en, ch.name_ur)}</span>
                        <ChevronRight className="w-3 h-3 rtl:rotate-180" />
                      </Link>
                    ))}
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </Container>
    </AppShell>
  );
}
