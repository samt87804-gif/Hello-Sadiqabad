import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ChevronRight, PhoneCall } from 'lucide-react';
import {
  fetchActiveAds,
  fetchAllAreas,
  fetchAllCategories,
  searchBusinesses,
} from '../lib/api';
import { useI18n } from '../lib/i18n';
import { bilingualText } from '../lib/format';
import { updatePageSeo } from '../lib/seo';
import { getFavorites, toggleFavoriteId } from '../lib/offlineStorage';
import type { AdRow, AreaRow, CategoryRow } from '../types/database';
import type { BusinessPublicView } from '../types/directory';
import { AppShell } from '../components/layout/AppShell';
import { AdBanner } from '../components/directory/AdBanner';
import { BusinessCard } from '../components/directory/BusinessCard';
import { Button } from '../components/ui/Button';
import { BusinessCardSkeleton, EmptyState } from '../components/ui/Feedback';
import { Container } from '../components/ui/Surface';

export function CategoryDetail() {
  const { slug = '' } = useParams();
  const { lang, urduHints } = useI18n();
  const [category, setCategory] = useState<CategoryRow | null>(null);
  const [subcategories, setSubcategories] = useState<CategoryRow[]>([]);
  const [metaLoaded, setMetaLoaded] = useState(false);
  const [areas, setAreas] = useState<AreaRow[]>([]);
  const [selectedArea, setSelectedArea] = useState('');
  const [openOnly, setOpenOnly] = useState(false);
  const [businesses, setBusinesses] = useState<BusinessPublicView[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [ads, setAds] = useState<AdRow[]>([]);
  const [favorites, setFavorites] = useState<string[]>(() => getFavorites());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setPage(1);
    setSelectedArea('');
    Promise.all([
      fetchAllCategories(),
      fetchAllAreas(),
      fetchActiveAds('category_banner'),
    ]).then(([cats, ar, catAds]) => {
      const found = cats.find((c) => c.slug === slug) ?? null;
      setCategory(found);
      setSubcategories(found ? cats.filter((c) => c.parent_id === found.id) : []);
      setAreas(ar);
      setAds(catAds);
      setMetaLoaded(true);
      if (found) {
        updatePageSeo({
          title: `${found.name_en} in Sadiqabad — Hello Sadiqabad`,
          description: `Verified ${found.name_en} (${found.name_ur}) businesses in Sadiqabad, Punjab.`,
          canonicalPath: `/category/${found.slug}`,
        });
      }
    });
  }, [slug]);

  useEffect(() => {
    setLoading(true);
    searchBusinesses(
      {
        category: slug,
        area: selectedArea,
        open: openOnly,
      },
      { page, limit: 20 }
    )
      .then((res) => {
        setBusinesses((prev) =>
          page === 1
            ? res.items
            : [...prev, ...res.items.filter((item) => !prev.some((p) => p.id === item.id))]
        );
        setTotal(res.total);
      })
      .finally(() => setLoading(false));
  }, [slug, selectedArea, openOnly, page]);

  const isMedical = /health|hospital|clinic|pharmac|doctor|medical/i.test(slug);

  if (metaLoaded && !category) {
    return (
      <AppShell>
        <Container className="py-10">
          <EmptyState
            title="Category not found"
            description="This business category does not exist in Sadiqabad directory."
            action={
              <Link
                to="/categories"
                className="px-4 py-2.5 rounded-xl bg-primary text-on-primary text-xs font-bold"
              >
                Browse All Categories
              </Link>
            }
          />
        </Container>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <Container className="py-6 space-y-5">
        <div className="space-y-2.5">
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-on-surface-variant">
            <Link to="/" className="hover:text-primary font-semibold">
              {lang === 'ur' ? 'ہوم' : 'Home'}
            </Link>
            <ChevronRight className="w-3.5 h-3.5 rtl:rotate-180" />
            <Link to="/categories" className="hover:text-primary font-semibold inline-flex items-center gap-1">
              <ArrowLeft className="w-3 h-3 rtl:rotate-180" /> {lang === 'ur' ? 'شعبہ جات' : 'Categories'}
            </Link>
            <ChevronRight className="w-3.5 h-3.5 rtl:rotate-180" />
            <span className="font-bold text-on-surface truncate">
              {category ? bilingualText(lang, category.name_en, category.name_ur) : slug}
            </span>
          </nav>

          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="text-2xl font-extrabold text-on-surface">
                {category ? bilingualText(lang, category.name_en, category.name_ur) : slug}
              </h1>
              {category && lang === 'en' && urduHints && (
                <p className="font-urdu text-base text-primary" dir="rtl">
                  {category.name_ur}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <select
                value={selectedArea}
                onChange={(e) => {
                  setPage(1);
                  setSelectedArea(e.target.value);
                }}
                aria-label="Filter by area"
                className="h-10 px-3 rounded-xl border border-outline-variant bg-surface-container-lowest text-xs font-semibold"
              >
                <option value="">{lang === 'ur' ? 'صادق آباد کے تمام علاقے' : 'All Sadiqabad Areas'}</option>
                {areas.map((a) => (
                  <option key={a.id} value={a.slug}>
                    {bilingualText(lang, a.name_en, a.name_ur)}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => {
                  setPage(1);
                  setOpenOnly((o) => !o);
                }}
                className={`h-10 px-3.5 rounded-xl text-xs font-bold border cursor-pointer ${
                  openOnly
                    ? 'bg-primary text-on-primary border-primary'
                    : 'bg-surface-container-lowest text-on-surface border-outline-variant/60'
                }`}
              >
                {lang === 'ur' ? 'ابھی کھلا ہے' : 'Open Now'}
              </button>
            </div>
          </div>

          {subcategories.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-1">
              {subcategories.map((sub) => (
                <Link
                  key={sub.id}
                  to={`/category/${sub.slug}`}
                  className="px-3 py-1.5 rounded-full bg-surface-container-lowest border border-outline-variant/40 text-xs font-semibold text-on-surface hover:border-primary/50 shrink-0"
                >
                  {bilingualText(lang, sub.name_en, sub.name_ur)}
                </Link>
              ))}
            </div>
          )}
        </div>

        {isMedical && (
          <div className="rounded-2xl bg-[#ba1a1a]/10 border border-[#ba1a1a]/30 p-3.5 flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs sm:text-sm font-semibold text-on-surface">
              {lang === 'ur' ? (
                <>صادق آباد میں میڈیکل ایمرجنسی؟ ریسکیو 1122 اور ایدھی 115 24/7 دستیاب ہیں۔</>
              ) : (
                <>
                  Medical Emergency in Sadiqabad? Rescue <strong className="text-error">1122</strong> &amp; Edhi <strong className="text-error">115</strong> are available 24/7.
                </>
              )}
            </div>
            <div className="flex items-center gap-2">
              <a
                href="tel:1122"
                className="px-3 py-1.5 rounded-xl bg-[#ba1a1a] text-white text-xs font-bold inline-flex items-center gap-1"
              >
                <PhoneCall className="w-3.5 h-3.5" /> {lang === 'ur' ? '1122 پر کال کریں' : 'Call 1122'}
              </a>
              <Link to="/emergency" className="text-xs font-bold text-primary hover:underline">
                {lang === 'ur' ? 'تمام ہیلپ لائنز ←' : 'All Helplines →'}
              </Link>
            </div>
          </div>
        )}

        {ads[0] && <AdBanner ad={ads[0]} />}

        {loading && page === 1 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <BusinessCardSkeleton key={i} />
            ))}
          </div>
        ) : businesses.length === 0 ? (
          <EmptyState
            title={lang === 'ur' ? 'اس شعبے میں ابھی کوئی کاروبار موجود نہیں' : 'No listings in this category yet'}
            description={
              lang === 'ur'
                ? 'اس شعبے کی کوئی دکان یا کلینک شامل کرنے کے لیے مفت رجسٹریشن استعمال کریں۔'
                : 'Know a trusted shop or clinic in this sector? Add it to the Sadiqabad directory.'
            }
          />
        ) : (
          <div className="space-y-5">
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
            {businesses.length < total && (
              <div className="flex justify-center">
                <Button variant="outline" onClick={() => setPage((p) => p + 1)}>
                  {lang === 'ur'
                    ? `مزید دیکھیں (${total - businesses.length} باقی)`
                    : `Load More (${total - businesses.length} remaining)`}
                </Button>
              </div>
            )}
          </div>
        )}
      </Container>
    </AppShell>
  );
}
