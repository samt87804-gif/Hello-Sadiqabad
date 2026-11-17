import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  BellRing,
  ChevronRight,
  History,
  Map as MapIcon,
  MapPin,
  PlusCircle,
  Search,
  Sparkles,
  Tag,
  Trash2,
  X,
} from 'lucide-react';
import {
  fetchActiveAds,
  fetchActiveOffers,
  fetchAllAreas,
  fetchCategoriesWithCounts,
  fetchPublicSiteSettings,
  fetchSearchSuggestions,
  searchBusinesses,
} from '../lib/api';
import { useDebounce } from '../lib/hooks';
import { useI18n } from '../lib/i18n';
import { bilingualText, formatDateShort } from '../lib/format';
import { updatePageSeo } from '../lib/seo';
import { DEFAULT_HERO_BANNER_URL, EMPTY_DIRECTORY_IMAGE_URLS, type DirectoryImageUrls } from '../lib/siteSettings';
import {
  clearRecentlyViewed,
  getFavorites,
  getRecentlyViewed,
  toggleFavoriteId,
  type RecentViewedItem,
} from '../lib/offlineStorage';
import type { AdRow, AreaRow, OfferRow } from '../types/database';
import type {
  BusinessPublicView,
  CategoryWithChildren,
  SearchSuggestionItem,
} from '../types/directory';
import { AppShell } from '../components/layout/AppShell';
import { InstallAppButton } from '../components/layout/InstallAppButton';
import { Button } from '../components/ui/Button';
import { AdBanner } from '../components/directory/AdBanner';
import { BusinessCard } from '../components/directory/BusinessCard';
import { CategoryChip, CategoryIcon } from '../components/ui/CategoryIcon';
import { Container, SectionHeading, Card } from '../components/ui/Surface';
import { BusinessCardSkeleton } from '../components/ui/Feedback';
import { ImageWithFallback } from '../components/ui/ImageWithFallback';

const EMERGENCY_QUICK = [
  { code: '1122', en: 'Rescue', ur: 'ریسکیو' },
  { code: '15', en: 'Police', ur: 'پولیس' },
  { code: '16', en: 'Fire Brig.', ur: 'فائر بریگیڈ' },
  { code: '115', en: 'Edhi', ur: 'ایدھی' },
];

const POPULAR_QUERIES = [
  'THQ Hospital',
  'Kashif Electronics',
  'Al-Rehman Pharmacy',
  'Karachi Biryani',
];

export function Home() {
  const { lang, urduHints, t } = useI18n();
  const navigate = useNavigate();
  const searchBoxRef = useRef<HTMLDivElement>(null);

  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 250);
  const [suggestions, setSuggestions] = useState<SearchSuggestionItem[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [categories, setCategories] = useState<CategoryWithChildren[]>([]);
  const [areas, setAreas] = useState<AreaRow[]>([]);
  const [featuredBusinesses, setFeaturedBusinesses] = useState<BusinessPublicView[]>([]);
  const [newestBusinesses, setNewestBusinesses] = useState<BusinessPublicView[]>([]);
  const [ads, setAds] = useState<AdRow[]>([]);
  const [adsEnabled, setAdsEnabled] = useState(true);
  const [heroBannerUrl, setHeroBannerUrl] = useState(DEFAULT_HERO_BANNER_URL);
  const [directoryImageUrls, setDirectoryImageUrls] = useState<DirectoryImageUrls>(EMPTY_DIRECTORY_IMAGE_URLS);
  const [offers, setOffers] = useState<Array<OfferRow & { business: BusinessPublicView | null }>>([]);
  const [recentItems, setRecentItems] = useState<RecentViewedItem[]>([]);
  const [favorites, setFavorites] = useState<string[]>(() => getFavorites());
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    updatePageSeo({
      title: 'Sadiqabad Business Directory & Emergency Helplines — Hello Sadiqabad',
      description:
        'Find shops, doctors, hospitals, pharmacies, restaurants and local services in Sadiqabad, Punjab. Browse business listings, area guides and 24/7 emergency helplines.',
      canonicalPath: '/',
      jsonLd: {
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'Organization',
            '@id': 'https://hellosadiqabad.com/#organization',
            name: 'Hello Sadiqabad',
            url: 'https://hellosadiqabad.com/',
            logo: { '@type': 'ImageObject', url: 'https://hellosadiqabad.com/site-logo.png', width: 512, height: 512 },
          },
          {
            '@type': 'WebSite',
            '@id': 'https://hellosadiqabad.com/#website',
            name: 'Hello Sadiqabad',
            url: 'https://hellosadiqabad.com/',
            publisher: { '@id': 'https://hellosadiqabad.com/#organization' },
            inLanguage: ['en', 'ur'],
          },
        ],
      },
    });

    setRecentItems(getRecentlyViewed());

    setLoading(true);
    setLoadError(false);
    Promise.all([
      fetchCategoriesWithCounts(),
      fetchAllAreas(),
      searchBusinesses({ sort: 'relevance' }, { limit: 6 }),
      searchBusinesses({ sort: 'newest' }, { limit: 3 }),
      fetchActiveAds('homepage_top'),
      fetchActiveOffers(),
      fetchPublicSiteSettings(),
    ])
      .then(([cats, ar, bizRes, newRes, topAds, activeOffers, settings]) => {
        setCategories(cats);
        setAreas(ar);
        setFeaturedBusinesses(bizRes.items);
        setNewestBusinesses(newRes.items);
        setAds(topAds);
        setOffers(activeOffers.slice(0, 4));
        setAdsEnabled(settings.ads_enabled);
        setHeroBannerUrl(settings.hero_banner_url || DEFAULT_HERO_BANNER_URL);
        setDirectoryImageUrls(settings.directory_image_urls || EMPTY_DIRECTORY_IMAGE_URLS);
      })
      .catch(() => {
        setCategories([]);
        setAreas([]);
        setFeaturedBusinesses([]);
        setNewestBusinesses([]);
        setAds([]);
        setOffers([]);
        setLoadError(true);
      })
      .finally(() => setLoading(false));
  }, [retryKey]);

  useEffect(() => {
    const onMouseDown = (e: MouseEvent) => {
      if (searchBoxRef.current && !searchBoxRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowSuggestions(false);
    };
    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  const autocompleteSeqRef = useRef<number>(0);
  const autocompleteAbortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const trimmed = debouncedQuery.trim();
    if (trimmed.length < 2) {
      if (autocompleteAbortRef.current) {
        autocompleteAbortRef.current.abort();
      }
      setSuggestions([]);
      return;
    }

    if (autocompleteAbortRef.current) {
      autocompleteAbortRef.current.abort();
    }
    const controller = new AbortController();
    autocompleteAbortRef.current = controller;
    const currentSeq = ++autocompleteSeqRef.current;

    fetchSearchSuggestions(trimmed, { signal: controller.signal })
      .then((data) => {
        if (!controller.signal.aborted && currentSeq === autocompleteSeqRef.current) {
          setSuggestions(data);
        }
      })
      .catch((err) => {
        if (controller.signal.aborted || err?.name === 'AbortError' || currentSeq !== autocompleteSeqRef.current) {
          return;
        }
        setSuggestions([]);
      });

    return () => {
      controller.abort();
    };
  }, [debouncedQuery]);

  const submitSearch = (e?: React.FormEvent, overrideQuery?: string) => {
    e?.preventDefault();
    const q = (overrideQuery ?? query).trim();
    setShowSuggestions(false);
    navigate(q ? `/search?q=${encodeURIComponent(q)}` : '/search');
  };

  const handleToggleFavorite = (id: string) => {
    setFavorites(toggleFavoriteId(id));
  };

  return (
    <AppShell>
      <div className="space-y-8 py-5 sm:py-7">
        
        <section aria-label="Project collaboration">
          <Container>
            <p className="text-center text-sm sm:text-base font-medium text-on-surface-variant">
              A Collaborative Project By <strong className="font-extrabold text-on-surface">AP KI AWAZ</strong>{' '}
              <span aria-hidden="true" className="mx-1 text-primary font-bold">X</span>{' '}
              <strong className="font-extrabold text-on-surface">INSPIRE ACADEMY</strong>
            </p>
          </Container>
        </section>
        {loadError && (
          <Container>
            <div role="alert" className="p-3 rounded-xl border border-error/30 bg-error/5 text-sm text-on-surface flex flex-wrap items-center justify-between gap-3">
              <span>{lang === 'ur' ? 'ہوم پیج کا ڈیٹا لوڈ نہیں ہو سکا۔' : 'Some homepage data could not be loaded.'}</span>
              <Button size="sm" variant="outline" onClick={() => setRetryKey((value) => value + 1)}>
                {lang === 'ur' ? 'دوبارہ کوشش' : 'Retry'}
              </Button>
            </div>
          </Container>
        )}
        {/* Hero Search Section */}
        <section>
          <Container>
            <div className="overflow-visible rounded-3xl border border-outline-variant/35 bg-surface-container-lowest shadow-lg">
              {/* Exact approved banner hosted in the public Supabase Storage bucket. */}
              <img
                src={heroBannerUrl}
                alt="Sadiqabad Phone Directory — Jahaz Chowk banner"
                className="block h-auto w-full rounded-t-3xl"
                fetchPriority="high"
                decoding="async"
              />

              <div className="max-w-3xl space-y-4 p-5 sm:p-8">
                <div className="space-y-1">
                  <h1 className="text-xl font-extrabold tracking-tight text-on-surface sm:text-2xl">
                    {lang === 'ur' ? 'صادق آباد کی کاروباری ڈائریکٹری' : 'Sadiqabad Business Directory'}
                  </h1>
                  <p className="text-sm leading-relaxed text-on-surface-variant">
                    {lang === 'ur'
                      ? 'صادق آباد کی دکانیں، ڈاکٹرز، ہسپتال، فارمیسیز، ریسٹورنٹس اور مقامی سروسز تلاش کریں۔'
                      : 'Find local shops, doctors, hospitals, pharmacies, restaurants and services across Sadiqabad.'}
                  </p>
                </div>
                <InstallAppButton />

                {/* Search Input & Autocomplete */}
                <div ref={searchBoxRef} className="relative">
                  <form
                    onSubmit={submitSearch}
                    className="flex items-center gap-1.5 rounded-2xl border border-outline-variant/60 bg-surface-container-lowest p-1.5 shadow-md"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center text-outline">
                      <Search className="h-5 w-5" />
                    </div>
                    <input
                      type="text"
                      value={query}
                      onFocus={() => setShowSuggestions(true)}
                      onChange={(e) => {
                        setQuery(e.target.value);
                        setShowSuggestions(true);
                      }}
                      placeholder={t(
                        'hero.searchPlaceholder',
                        'Search shops, doctors, emergency... (تلاش کریں)'
                      )}
                      aria-label="Search Sadiqabad directory"
                      className="min-w-0 flex-1 border-0 bg-transparent px-1 text-sm text-on-surface outline-none placeholder:text-on-surface-variant sm:text-base"
                    />
                    {query && (
                      <button
                        type="button"
                        aria-label="Clear search"
                        onClick={() => {
                          setQuery('');
                          setSuggestions([]);
                        }}
                        className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full text-outline hover:text-on-surface"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      type="submit"
                      className="flex h-11 shrink-0 cursor-pointer items-center gap-1.5 rounded-xl bg-primary px-4 text-sm font-bold text-on-primary transition-colors hover:bg-primary-container sm:px-5"
                    >
                      <span>{lang === 'ur' ? 'تلاش' : 'Search'}</span>
                      <ArrowRight className="h-4 w-4 rtl:rotate-180" />
                    </button>
                  </form>

                  {/* Autocomplete Dropdown */}
                  {showSuggestions && suggestions.length > 0 && (
                    <div className="absolute inset-x-0 top-full z-30 mt-2 space-y-1 rounded-2xl border border-outline-variant/50 bg-surface-container-lowest p-2 shadow-xl">
                      {suggestions.map((s) => {
                        const dest =
                          s.kind === 'business'
                            ? `/business/${s.slug}`
                            : s.kind === 'category'
                            ? `/category/${s.slug}`
                            : s.kind === 'area'
                            ? `/area/${s.slug}`
                            : s.kind === 'news'
                            ? `/news/${s.slug}`
                            : s.slug === 'government'
                            ? '/government-helplines'
                            : '/emergency';
                        return (
                          <Link
                            key={`${s.kind}-${s.slug}`}
                            to={dest}
                            onClick={() => setShowSuggestions(false)}
                            className="flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-sm hover:bg-surface-container-low"
                          >
                            <div className="min-w-0">
                              <p className="truncate font-semibold text-on-surface">
                                {bilingualText(lang, s.label_en, s.label_ur)}
                              </p>
                              <p className="text-xs text-on-surface-variant">{s.subtitle}</p>
                            </div>
                            <span className="shrink-0 rounded-md bg-surface-container px-2 py-0.5 text-[11px] font-bold capitalize text-primary">
                              {lang === 'ur'
                                ? s.kind === 'business'
                                  ? 'کاروبار'
                                   : s.kind === 'category'
                                  ? 'شعبہ'
                                  : s.kind === 'area'
                                  ? 'علاقہ'
                                  : s.kind === 'news'
                                  ? 'خبر'
                                  : 'ہیلپ لائن'
                                : s.kind}
                            </span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Popular Pills */}
                <div className="flex flex-wrap items-center gap-2 py-0.5">
                  <span className="flex shrink-0 items-center gap-1 text-xs font-semibold text-outline">
                    <History className="h-3.5 w-3.5" /> {lang === 'ur' ? 'مقبول:' : 'Popular:'}
                  </span>
                  {POPULAR_QUERIES.map((pq) => (
                    <button
                      key={pq}
                      type="button"
                      onClick={() => submitSearch(undefined, pq)}
                      className="shrink-0 cursor-pointer rounded-full bg-surface-container px-3 py-1.5 text-xs font-medium text-on-surface transition-colors hover:bg-surface-container-high"
                    >
                      {pq}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </Container>
        </section>

        {/* Emergency Quick Banner (Always above the fold / prominent) */}
        <section>
          <Container>
            <div className="rounded-2xl bg-[#ba1a1a] dark:bg-[#93000a] text-white p-4 sm:p-5 shadow-md flex flex-col gap-3">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2.5">
                  <span className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                    <BellRing className="w-5 h-5" />
                  </span>
                  <div>
                    <h2 className="text-base sm:text-lg font-bold leading-tight">
                      {t('section.emergencyTitle', '24/7 City Emergency Contacts')}
                    </h2>
                    {lang !== 'ur' && urduHints && (
                      <p className="font-urdu text-xs text-white/90 leading-[1.8]" dir="rtl">
                        ہنگامی صورتحال میں فوری رابطہ کریں
                      </p>
                    )}
                  </div>
                </div>
                <Link
                  to="/emergency"
                  className="px-3 py-1.5 rounded-full bg-white/20 hover:bg-white/30 text-xs font-bold uppercase tracking-wider transition-colors"
                >
                  {lang === 'ur' ? 'تمام ہیلپ لائنز ←' : 'All Helplines →'}
                </Link>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {EMERGENCY_QUICK.map((em) => (
                  <a
                    key={em.code}
                    href={`tel:${em.code}`}
                    className="bg-white dark:bg-[#1d201d] text-[#1a1c19] dark:text-[#f1f2ed] rounded-xl py-2.5 px-3 text-center shadow-sm hover:scale-[1.01] active:scale-95 transition-transform flex flex-col items-center border border-transparent dark:border-white/10"
                  >
                    <span
                      className="text-xl font-extrabold text-[#ba1a1a] dark:text-[#ff897d] tabular-nums"
                      dir="ltr"
                    >
                      {em.code}
                    </span>
                    <span className="text-xs font-bold mt-0.5">
                      {lang === 'ur' ? em.ur : em.en}
                    </span>
                    {lang === 'en' && urduHints && (
                      <span
                        className="font-urdu text-[10px] text-[#545853] dark:text-[#b4bbb3] leading-[1.6]"
                        dir="rtl"
                      >
                        {em.ur}
                      </span>
                    )}
                  </a>
                ))}
              </div>
            </div>
          </Container>
        </section>

        {/* Quick Lookups Rail */}
        <section>
          <Container className="space-y-3">
            <SectionHeading
              title={t('section.quickLookups', 'Quick Lookups')}
              titleUr="فوری تلاش"
              action={
                <Link
                  to="/map"
                  className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                >
                  {lang === 'ur' ? 'شہر کا نقشہ دیکھیں' : 'Open City Map'}{' '}
                  <ChevronRight className="w-4 h-4 rtl:rotate-180" />
                </Link>
              }
            />
            <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar py-1">
              {categories.slice(0, 8).map((cat) => (
                <CategoryChip
                  key={cat.id}
                  to={`/category/${cat.slug}`}
                  icon={cat.icon}
                  categoryKey={cat.slug}
                  color={cat.color}
                  labelEn={cat.name_en}
                  labelUr={cat.name_ur}
                />
              ))}
            </div>
          </Container>
        </section>

        {/* Sponsored Premium Spotlight */}
        {adsEnabled && ads[0] && (
          <section>
            <Container>
              <AdBanner ad={ads[0]} />
            </Container>
          </section>
        )}

        {/* Explore Categories Grid */}
        <section>
          <Container className="space-y-4">
            <SectionHeading
              title={t('section.categories', 'Explore Categories')}
              titleUr="شعبہ جات دیکھیں"
              subtitle={
                lang === 'ur'
                  ? 'صادق آباد کے کاروبار شعبے کے حساب سے دیکھیں'
                  : 'Browse Sadiqabad businesses by sector'
              }
              action={
                <Link
                  to="/categories"
                  className="text-sm font-bold text-primary hover:underline inline-flex items-center gap-0.5"
                >
                  <span>{t('action.viewAll', 'View all')}</span>
                  <ChevronRight className="w-4 h-4 rtl:rotate-180" />
                </Link>
              }
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {categories.slice(0, 8).map((cat) => (
                <Link
                  key={cat.id}
                  to={`/category/${cat.slug}`}
                  className="min-h-[112px] rounded-2xl overflow-hidden bg-surface-container-lowest border border-outline-variant/35 shadow-sm hover:shadow-md hover:border-primary/50 transition-all flex items-stretch group"
                >
                  <div
                    className="w-[30%] min-w-[88px] sm:min-w-[104px] bg-primary-fixed/70 flex items-center justify-center shrink-0"
                    style={{ color: cat.color }}
                  >
                    {directoryImageUrls.categories[cat.slug] ? (
                      <ImageWithFallback src={directoryImageUrls.categories[cat.slug]} alt={`${cat.name_en} category`} className="w-full h-full" fallbackIcon={<CategoryIcon name={cat.icon} categoryKey={cat.slug} categoryLabel={cat.name_en} className="w-16 h-16 sm:w-[4.5rem] sm:h-[4.5rem]" />} />
                    ) : (
                      <CategoryIcon name={cat.icon} categoryKey={cat.slug} categoryLabel={cat.name_en} className="w-16 h-16 sm:w-[4.5rem] sm:h-[4.5rem]" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0 p-3 sm:p-4 flex items-center gap-3">
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm sm:text-base font-bold text-on-surface group-hover:text-primary transition-colors line-clamp-2">
                        {bilingualText(lang, cat.name_en, cat.name_ur)}
                      </h3>
                      {lang === 'en' && urduHints && (
                        <p className="font-urdu text-xs text-outline leading-[1.8] mt-1" dir="rtl">
                          {cat.name_ur}
                        </p>
                      )}
                    </div>
                    <ChevronRight className="w-4 h-4 text-outline group-hover:text-primary shrink-0 rtl:rotate-180" />
                    <div className="shrink-0 min-w-[3.5rem] text-right">
                      <p className="text-xl sm:text-2xl font-extrabold leading-none text-primary tabular-nums">
                        {cat.listing_count ?? 0}
                      </p>
                      <p className="text-[10px] sm:text-xs font-bold text-on-surface-variant mt-1 whitespace-nowrap">
                        {lang === 'ur' ? 'کاروبار' : 'listings'}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </Container>
        </section>

        {/* Active Offers & Deals */}
        {offers.length > 0 && (
          <section>
            <Container className="space-y-4">
              <SectionHeading
                title={t('section.offers', 'Local Offers & Deals')}
                titleUr="صادق آباد میں خصوصی رعایت"
                action={
                  <Link
                    to="/offers"
                    className="text-sm font-bold text-primary hover:underline inline-flex items-center gap-0.5"
                  >
                    <span>{lang === 'ur' ? 'تمام ڈیلز' : 'All Offers'}</span>
                    <ChevronRight className="w-4 h-4 rtl:rotate-180" />
                  </Link>
                }
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {offers.map((offer) => (
                  <Link
                    key={offer.id}
                    to={offer.business ? `/business/${offer.business.slug}` : '/offers'}
                    className="rounded-2xl bg-surface-container-lowest border border-secondary-container/40 shadow-sm hover:shadow-md transition-shadow p-4 flex items-center gap-4"
                  >
                    <ImageWithFallback
                      src={offer.image_url || offer.business?.logo_url}
                      alt={offer.title}
                      className="w-20 h-20 rounded-xl shrink-0"
                    />
                    <div className="min-w-0 flex-1 space-y-1">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-secondary-fixed text-on-secondary-fixed text-[11px] font-bold">
                        <Tag className="w-3 h-3" /> {lang === 'ur' ? 'میعاد' : 'Valid till'}{' '}
                        {formatDateShort(offer.valid_to, lang)}
                      </span>
                      <h3 className="font-bold text-sm sm:text-base text-on-surface truncate">
                        {offer.title}
                      </h3>
                      {offer.business && (
                        <p className="text-xs font-semibold text-primary truncate">
                          {offer.business.name_en} · {offer.business.area?.name_en ?? 'Sadiqabad'}
                        </p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </Container>
          </section>
        )}

        {/* Featured & Verified Directory Listings */}
        <section>
          <Container className="space-y-4">
            <SectionHeading
              title={t('section.featured', 'Verified & Top Rated in Sadiqabad')}
              titleUr="مصدقہ اور نمایاں کاروبار"
              action={
                <Link
                  to="/search"
                  className="text-sm font-bold text-primary hover:underline inline-flex items-center gap-0.5"
                >
                  <span>{lang === 'ur' ? 'سب دیکھیں' : 'Browse All'}</span>
                  <ChevronRight className="w-4 h-4 rtl:rotate-180" />
                </Link>
              }
            />

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <BusinessCardSkeleton key={i} />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {featuredBusinesses.map((biz) => (
                  <BusinessCard
                    key={biz.id}
                    business={biz}
                    isSaved={favorites.includes(biz.id)}
                    onToggleSave={handleToggleFavorite}
                  />
                ))}
              </div>
            )}
          </Container>
        </section>

        {/* New in Town + Neighborhood Explorer & City Map Card */}
        <section>
          <Container className="space-y-4">
            <SectionHeading
              title={t('section.newInTown', 'New in Town')}
              titleUr="شہر میں نئے کاروبار"
              action={
                <Link
                  to="/search?sort=newest"
                  className="text-sm font-bold text-primary hover:underline inline-flex items-center gap-0.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{lang === 'ur' ? 'تازہ ترین' : 'Latest Additions'}</span>
                </Link>
              }
            />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {newestBusinesses.map((biz) => (
                <BusinessCard
                  key={biz.id}
                  business={biz}
                  isSaved={favorites.includes(biz.id)}
                  onToggleSave={handleToggleFavorite}
                />
              ))}
            </div>

            {areas.length > 0 && (
              <Card className="p-5 bg-surface-container-low border-outline-variant/40 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-secondary shrink-0" />
                    <h3 className="text-sm sm:text-base font-bold text-on-surface">
                      {lang === 'ur' ? 'صادق آباد کے علاقے اور بازار' : 'Explore Sadiqabad Neighborhoods & Bazaars'}
                    </h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {areas.slice(0, 8).map((a) => (
                      <Link
                        key={a.id}
                        to={`/area/${a.slug}`}
                        className="px-3 py-1.5 rounded-full bg-surface-container-lowest border border-outline-variant/40 hover:border-primary/50 text-xs font-semibold text-on-surface transition-colors"
                      >
                        {directoryImageUrls.areas[a.slug] && <ImageWithFallback src={directoryImageUrls.areas[a.slug]} alt="" className="w-6 h-6 rounded-full inline-block me-1.5 align-middle" />}
                        {bilingualText(lang, a.name_en, a.name_ur)}
                      </Link>
                    ))}
                  </div>
                </div>
                <Link
                  to="/map"
                  className="min-h-[44px] px-4 rounded-xl bg-primary text-on-primary text-xs font-bold inline-flex items-center justify-center gap-2 hover:bg-primary-container transition-colors shrink-0"
                >
                  <MapIcon className="w-4 h-4" />
                  <span>{lang === 'ur' ? 'نقشہ کھولیں' : 'Open Interactive Map'}</span>
                </Link>
              </Card>
            )}
          </Container>
        </section>

        {/* Recently Viewed */}
        {recentItems.length > 0 && (
          <section>
            <Container className="space-y-3">
              <SectionHeading
                title={t('section.recentlyViewed', 'Recently Viewed')}
                titleUr="حال ہی میں دیکھے گئے"
                action={
                  <button
                    type="button"
                    onClick={() => {
                      clearRecentlyViewed();
                      setRecentItems([]);
                    }}
                    className="text-xs font-semibold text-on-surface-variant hover:text-error inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> {lang === 'ur' ? 'صاف کریں' : 'Clear'}
                  </button>
                }
              />
              <div className="flex items-center gap-3 overflow-x-auto no-scrollbar pb-1">
                {recentItems.map((item) => (
                  <Link
                    key={item.id}
                    to={`/business/${item.slug}`}
                    className="shrink-0 w-56 rounded-2xl bg-surface-container-lowest border border-outline-variant/35 p-3 flex items-center gap-3 hover:border-primary/40 transition-colors"
                  >
                    <ImageWithFallback
                      src={item.logo_url}
                      alt={item.name_en}
                      className="w-12 h-12 rounded-xl shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-on-surface truncate">
                        {bilingualText(lang, item.name_en, item.name_ur)}
                      </p>
                      <p className="text-[11px] text-on-surface-variant truncate">
                        {item.area_name}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </Container>
          </section>
        )}

        {/* Add Business CTA */}
        <section>
          <Container>
            <Card className="p-6 sm:p-8 bg-gradient-to-r from-primary to-primary-container text-on-primary flex flex-col md:flex-row md:items-center justify-between gap-5">
              <div className="space-y-1.5 max-w-xl">
                <h2 className="text-xl sm:text-2xl font-extrabold">
                  {t('section.addBusinessTitle', 'Add Your Business to Sadiqabad Directory')}
                </h2>
                {urduHints && (
                  <p className="font-urdu text-sm opacity-95 leading-[2.0]" dir="rtl">
                    اپنا کاروبار، دکان یا کلینک مفت میں ہیلو صادق آباد پر رجسٹر کروائیں
                  </p>
                )}
                <p className="text-xs sm:text-sm opacity-90">
                  {lang === 'ur'
                    ? 'تحصیل صادق آباد کی ہر دکان، کلینک اور سروس کے لیے مفت بنیادی لسٹنگ۔'
                    : 'Free basic listing for every shop, clinic, workshop, and service in Tehsil Sadiqabad.'}
                </p>
              </div>
              <Link
                to="/add-business"
                className="min-h-[48px] px-6 py-3 rounded-xl bg-white text-primary font-bold text-sm inline-flex items-center justify-center gap-2 shadow-md hover:bg-primary-fixed transition-colors shrink-0"
              >
                <PlusCircle className="w-5 h-5" />
                <span>{t('action.registerBusiness', 'Register Business Now')}</span>
              </Link>
            </Card>
          </Container>
        </section>

        <section aria-label="A Collaborative Project By AP KI AWAZ and INSPIRE ACADEMY">
          <Container>
            <img
              src="https://efwohfzqitevkuybnyif.supabase.co/storage/v1/object/public/Hello%20Sadiqabad/Hello%20Sadiqabad%20Collaboration%20Banner.png"
              alt="A Collaborative Project By AP KI AWAZ and INSPIRE ACADEMY"
              className="block h-auto w-full rounded-2xl"
              loading="lazy"
              decoding="async"
            />
          </Container>
        </section>
      </div>
    </AppShell>
  );
}
