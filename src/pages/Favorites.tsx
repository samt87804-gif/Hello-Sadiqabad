import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bookmark, Trash2 } from 'lucide-react';
import { fetchBusinessesByIds } from '../lib/api';
import { bilingualText } from '../lib/format';
import { useI18n } from '../lib/i18n';
import { updatePageSeo } from '../lib/seo';
import {
  clearAllFavorites,
  clearRecentlyViewed,
  getFavorites,
  getRecentlyViewed,
  toggleFavoriteId,
  type RecentViewedItem,
} from '../lib/offlineStorage';
import type { BusinessPublicView } from '../types/directory';
import { AppShell } from '../components/layout/AppShell';
import { BusinessCard } from '../components/directory/BusinessCard';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/Feedback';
import { ImageWithFallback } from '../components/ui/ImageWithFallback';
import { Container, SectionHeading } from '../components/ui/Surface';

export function Favorites() {
  const { lang } = useI18n();
  const [favIds, setFavIds] = useState<string[]>(() => getFavorites());
  const [savedBusinesses, setSavedBusinesses] = useState<BusinessPublicView[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [confirmClear, setConfirmClear] = useState(false);
  const [recent, setRecent] = useState<RecentViewedItem[]>(() => getRecentlyViewed());

  useEffect(() => {
    updatePageSeo({
      title: 'Saved & Recently Viewed — Hello Sadiqabad',
      description: 'Your saved Sadiqabad businesses and recently viewed listings stored locally on your device.',
      canonicalPath: '/favorites',
    });
  }, []);

  useEffect(() => {
    fetchBusinessesByIds(favIds).then(setSavedBusinesses);
  }, [favIds]);

  const savedCategories = useMemo(() => {
    const map = new Map<string, string>();
    savedBusinesses.forEach((b) => {
      if (b.category) {
        map.set(b.category.slug, bilingualText(lang, b.category.name_en, b.category.name_ur));
      }
    });
    return Array.from(map.entries());
  }, [savedBusinesses, lang]);

  const visibleSaved =
    selectedCategory === 'all'
      ? savedBusinesses
      : savedBusinesses.filter((b) => b.category?.slug === selectedCategory);

  const handleToggle = (id: string) => {
    setFavIds(toggleFavoriteId(id));
  };

  return (
    <AppShell>
      <Container className="py-6 space-y-8">
        <section className="space-y-4">
          <SectionHeading
            title={
              lang === 'ur'
                ? `محفوظ شدہ کاروبار (${savedBusinesses.length})`
                : `Saved Businesses (${savedBusinesses.length})`
            }
            titleUr={lang === 'en' ? 'محفوظ شدہ کاروبار' : undefined}
            subtitle={
              lang === 'ur'
                ? 'آپ کے آلے پر نجی طور پر محفوظ — کسی اکاؤنٹ کی ضرورت نہیں'
                : 'Stored privately on your device — no account required'
            }
            action={
              favIds.length > 0 &&
              (confirmClear ? (
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => {
                      clearAllFavorites();
                      setFavIds([]);
                      setConfirmClear(false);
                    }}
                  >
                    {lang === 'ur' ? 'تصدیق کریں' : 'Confirm Clear'}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setConfirmClear(false)}>
                    {lang === 'ur' ? 'منسوخ' : 'Cancel'}
                  </Button>
                </div>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setConfirmClear(true)}
                  leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                >
                  {lang === 'ur' ? 'سب حذف کریں' : 'Clear Saved'}
                </Button>
              ))
            }
          />

          {savedCategories.length > 1 && (
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
              <button
                type="button"
                onClick={() => setSelectedCategory('all')}
                className={`px-3 py-1.5 rounded-full text-xs font-bold border shrink-0 cursor-pointer ${
                  selectedCategory === 'all'
                    ? 'bg-primary text-on-primary border-primary'
                    : 'bg-surface-container-lowest text-on-surface border-outline-variant/50'
                }`}
              >
                {lang === 'ur' ? `تمام (${savedBusinesses.length})` : `All (${savedBusinesses.length})`}
              </button>
              {savedCategories.map(([slug, label]) => (
                <button
                  key={slug}
                  type="button"
                  onClick={() => setSelectedCategory(slug)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold border shrink-0 cursor-pointer ${
                    selectedCategory === slug
                      ? 'bg-primary text-on-primary border-primary'
                      : 'bg-surface-container-lowest text-on-surface border-outline-variant/50'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          )}

          {visibleSaved.length === 0 ? (
            <EmptyState
              icon={<Bookmark className="w-6 h-6" />}
              title={lang === 'ur' ? 'ابھی کوئی کاروبار محفوظ نہیں کیا گیا' : 'No saved businesses yet'}
              titleUr={lang === 'en' ? 'ابھی کوئی کاروبار محفوظ نہیں کیا گیا' : undefined}
              description={
                lang === 'ur'
                  ? 'فوری کال کے لیے کسی بھی دکان یا کلینک پر بک مارک آئیکن دبائیں۔'
                  : 'Tap the bookmark icon on any shop or clinic to save it here for instant one-tap calling.'
              }
              action={
                <Link
                  to="/search"
                  className="px-4 py-2.5 rounded-xl bg-primary text-on-primary text-xs font-bold"
                >
                  {lang === 'ur' ? 'ڈائریکٹری دیکھیں' : 'Explore Directory'}
                </Link>
              }
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {visibleSaved.map((biz) => (
                <BusinessCard
                  key={biz.id}
                  business={biz}
                  isSaved={favIds.includes(biz.id)}
                  onToggleSave={handleToggle}
                />
              ))}
            </div>
          )}
        </section>

        {recent.length > 0 && (
          <section className="space-y-4">
            <SectionHeading
              title={lang === 'ur' ? 'حال ہی میں دیکھے گئے' : 'Recently Viewed'}
              titleUr={lang === 'en' ? 'حال ہی میں دیکھے گئے' : undefined}
              action={
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    clearRecentlyViewed();
                    setRecent([]);
                  }}
                >
                  {lang === 'ur' ? 'ہسٹری صاف کریں' : 'Clear History'}
                </Button>
              }
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {recent.map((item) => (
                <Link
                  key={item.id}
                  to={`/business/${item.slug}`}
                  className="p-3.5 rounded-2xl bg-surface-container-lowest border border-outline-variant/35 flex items-center gap-3 hover:border-primary/40 transition-colors"
                >
                  <ImageWithFallback
                    src={item.logo_url}
                    alt={item.name_en}
                    className="w-12 h-12 rounded-xl shrink-0"
                  />
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-on-surface truncate">
                      {lang === 'ur' && item.name_ur ? item.name_ur : item.name_en}
                    </h3>
                    <p className="text-xs text-on-surface-variant truncate">{item.area_name}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </Container>
    </AppShell>
  );
}
