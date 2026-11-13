import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ChevronRight, Map as MapIcon, MapPin, PlusCircle } from 'lucide-react';
import { fetchAllAreas, fetchAllCategories, searchBusinesses } from '../lib/api';
import { useI18n } from '../lib/i18n';
import { bilingualText } from '../lib/format';
import { updatePageSeo } from '../lib/seo';
import { getFavorites, toggleFavoriteId } from '../lib/offlineStorage';
import type { AreaRow, CategoryRow } from '../types/database';
import type { BusinessPublicView } from '../types/directory';
import { AppShell } from '../components/layout/AppShell';
import { BusinessCard } from '../components/directory/BusinessCard';
import { BusinessCardSkeleton, EmptyState } from '../components/ui/Feedback';
import { Card, Container } from '../components/ui/Surface';

export function AreaDetail() {
  const { slug = '' } = useParams();
  const { lang, urduHints } = useI18n();
  const [area, setArea] = useState<AreaRow | null>(null);
  const [allAreas, setAllAreas] = useState<AreaRow[]>([]);
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [businesses, setBusinesses] = useState<BusinessPublicView[]>([]);
  const [favorites, setFavorites] = useState<string[]>(() => getFavorites());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setSelectedCategory('');
    Promise.all([fetchAllAreas(), fetchAllCategories()]).then(([ar, cats]) => {
      const found = ar.find((a) => a.slug === slug) ?? null;
      setArea(found);
      setAllAreas(ar);
      setCategories(cats);
      if (found) {
        updatePageSeo({
          title: `Businesses in ${found.name_en}, Sadiqabad — Hello Sadiqabad`,
          description: `Discover shops, doctors, and services located in ${found.name_en}, Sadiqabad.`,
          canonicalPath: `/area/${found.slug}`,
        });
      }
    });
  }, [slug]);

  useEffect(() => {
    setLoading(true);
    searchBusinesses({ area: slug, category: selectedCategory }, { limit: 30 })
      .then((res) => setBusinesses(res.items))
      .finally(() => setLoading(false));
  }, [slug, selectedCategory]);

  return (
    <AppShell>
      <Container className="py-6 space-y-5">
        <div className="space-y-3">
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-on-surface-variant">
            <Link to="/" className="hover:text-primary font-semibold">
              {lang === 'ur' ? 'ہوم' : 'Home'}
            </Link>
            <ChevronRight className="w-3.5 h-3.5 rtl:rotate-180" />
            <Link to="/map" className="hover:text-primary font-semibold inline-flex items-center gap-1">
              <ArrowLeft className="w-3 h-3 rtl:rotate-180" /> {lang === 'ur' ? 'شہر کا نقشہ' : 'City Map'}
            </Link>
            <ChevronRight className="w-3.5 h-3.5 rtl:rotate-180" />
            <span className="font-bold text-on-surface">
              {area ? bilingualText(lang, area.name_en, area.name_ur) : slug}
            </span>
          </nav>

          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-secondary-fixed text-secondary flex items-center justify-center shrink-0">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-2xl font-extrabold text-on-surface">
                  {area ? bilingualText(lang, area.name_en, area.name_ur) : slug}
                </h1>
                {area && lang === 'en' && urduHints && (
                  <p className="font-urdu text-sm text-primary" dir="rtl">
                    {area.name_ur} — صادق آباد
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                aria-label="Filter by category"
                className="h-10 px-3 rounded-xl border border-outline-variant bg-surface-container-lowest text-xs font-semibold"
              >
                <option value="">{lang === 'ur' ? 'تمام شعبہ جات' : 'All Categories'}</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.slug}>
                    {bilingualText(lang, c.name_en, c.name_ur)}
                  </option>
                ))}
              </select>
              <Link
                to={`/map?area=${encodeURIComponent(slug)}`}
                className="h-10 px-3.5 rounded-xl bg-surface-container text-primary text-xs font-bold inline-flex items-center gap-1.5 hover:bg-surface-container-high"
              >
                <MapIcon className="w-3.5 h-3.5" />
                <span>{lang === 'ur' ? 'نقشے پر دیکھیں' : 'View on Map'}</span>
              </Link>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <BusinessCardSkeleton key={i} />
            ))}
          </div>
        ) : businesses.length === 0 ? (
          <EmptyState
            title={lang === 'ur' ? 'اس علاقے میں ابھی کوئی کاروبار نہیں' : 'No listings in this neighborhood yet'}
            description={
              lang === 'ur'
                ? 'تمام شعبہ جات منتخب کریں یا صادق آباد کے دیگر علاقے دیکھیں۔'
                : 'Select All Categories or explore other Sadiqabad neighborhoods.'
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {businesses.map((biz) => (
              <BusinessCard
                key={biz.id}
                business={biz}
                isSaved={favorites.includes(biz.id)}
                onToggleSave={(id) => setFavorites(toggleFavoriteId(id))}
              />
            ))}
          </div>
        )}

        {/* Neighboring Sadiqabad Areas + Add CTA */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 pt-2">
          <Card className="p-4 lg:col-span-2 space-y-2.5">
            <h2 className="text-sm font-bold text-on-surface">
              {lang === 'ur' ? 'صادق آباد کے دیگر علاقے' : 'Other Sadiqabad Neighborhoods'}
            </h2>
            <div className="flex flex-wrap gap-2">
              {allAreas
                .filter((a) => a.slug !== slug)
                .map((a) => (
                  <Link
                    key={a.id}
                    to={`/area/${a.slug}`}
                    className="px-3 py-1.5 rounded-full bg-surface-container-low hover:bg-surface-container text-xs font-semibold text-on-surface transition-colors"
                  >
                    {bilingualText(lang, a.name_en, a.name_ur)}
                  </Link>
                ))}
            </div>
          </Card>

          <Card className="p-4 bg-primary/10 border-primary/25 flex flex-col justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-on-surface">
                {lang === 'ur'
                  ? `${area?.name_ur ?? 'اس علاقے'} میں آپ کی دکان ہے؟`
                  : `Have a shop in ${area?.name_en ?? 'this area'}?`}
              </h2>
              <p className="text-xs text-on-surface-variant mt-0.5">
                {lang === 'ur'
                  ? 'مفت لسٹنگ شامل کریں تاکہ قریبی صارفین آسانی سے رابطہ کر سکیں۔'
                  : 'Get listed for free so nearby residents can call or navigate to your shop.'}
              </p>
            </div>
            <Link
              to="/add-business"
              className="min-h-[40px] px-4 rounded-xl bg-primary text-on-primary text-xs font-bold inline-flex items-center justify-center gap-1.5"
            >
              <PlusCircle className="w-4 h-4" />{' '}
              {lang === 'ur' ? 'کاروبار رجسٹر کریں' : 'Register Business'}
            </Link>
          </Card>
        </div>
      </Container>
    </AppShell>
  );
}
