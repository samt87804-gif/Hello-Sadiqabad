import React, { useCallback, useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  BadgeCheck,
  Bookmark,
  CheckCircle2,
  Crown,
  ExternalLink,
  Flag,
  Globe,
  Info,
  MapPin,
  MessageCircle,
  Navigation,
  Phone,
  QrCode,
  Send,
  Share2,
  ShieldCheck,
  Smartphone,
  Star,
  Tag,
} from 'lucide-react';
import {
  fetchBusinessBySlug,
  fetchRelatedBusinesses,
  trackBusinessEvent,
} from '../lib/api';
import { useI18n } from '../lib/i18n';
import {
  bilingualText,
  buildGoogleMapsDirectionsUrl,
  extractSafeEmbedUrl,
  formatDateShort,
} from '../lib/format';
import { buildTelUrl, buildWhatsAppUrl, formatPkPhoneDisplay } from '../lib/phone';
import { buildLocalBusinessJsonLd, updatePageSeo } from '../lib/seo';
import { effectivePlanCode } from '../lib/searchFilter';
import {
  addRecentlyViewed,
  getFavorites,
  toggleFavoriteId,
} from '../lib/offlineStorage';
import type { BusinessPublicView } from '../types/directory';
import { AppShell } from '../components/layout/AppShell';
import { OpenNowBadge, OpeningHoursTable } from '../components/directory/OpenNowBadge';
import { BusinessCard } from '../components/directory/BusinessCard';
import {
  ClaimBusinessModal,
  QrCodeModal,
  SendInquiryModal,
  ShareSheet,
  SuggestCorrectionModal,
  WriteReviewModal,
} from '../components/directory/ActionModals';
import { Button } from '../components/ui/Button';
import { ImageWithFallback } from '../components/ui/ImageWithFallback';
import { Lightbox, StarRating } from '../components/ui/DataDisplay';
import { ErrorState, Skeleton } from '../components/ui/Feedback';
import { Badge, Card, Container } from '../components/ui/Surface';

function MiniBusinessMap({ lat, lng, name }: { lat: number; lng: number; name: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const map = L.map(ref.current, {
      center: [lat, lng],
      zoom: 15,
      zoomControl: false,
      attributionControl: false,
      dragging: false,
      scrollWheelZoom: false,
    });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
    L.circleMarker([lat, lng], {
      radius: 8,
      color: '#ffffff',
      weight: 2.5,
      fillColor: '#006948',
      fillOpacity: 1,
    })
      .bindTooltip(name)
      .addTo(map);
    return () => {
      map.remove();
    };
  }, [lat, lng, name]);

  return (
    <div
      ref={ref}
      aria-label={`Map showing ${name}`}
      className="w-full h-36 rounded-xl overflow-hidden border border-outline-variant/40 z-0"
    />
  );
}

export function BusinessProfile() {
  const { slug = '' } = useParams();
  const navigate = useNavigate();
  const { lang, urduHints, t } = useI18n();
  const viewedSlugRef = useRef<string | null>(null);

  const [business, setBusiness] = useState<BusinessPublicView | null>(null);
  const [related, setRelated] = useState<BusinessPublicView[]>([]);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState<string[]>(() => getFavorites());
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

  // Action modal states
  const [inquiryOpen, setInquiryOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [correctionOpen, setCorrectionOpen] = useState(false);
  const [correctionReason, setCorrectionReason] = useState('Phone number changed');
  const [claimOpen, setClaimOpen] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  const loadProfile = useCallback(async () => {
    setLoading(true);
    try {
      const found = await fetchBusinessBySlug(slug);
      setBusiness(found);
      if (found) {
        updatePageSeo({
          title: found.meta_title_en || `${found.name_en} — Sadiqabad | Hello Sadiqabad`,
          description:
            found.meta_description_en ||
            found.description_en ||
            `Phone number, hours, and location for ${found.name_en} in Sadiqabad.`,
          canonicalPath: `/business/${found.slug}`,
          jsonLd: buildLocalBusinessJsonLd(found),
        });
        if (viewedSlugRef.current !== found.slug) {
          viewedSlugRef.current = found.slug;
          trackBusinessEvent(found.id, 'view');
        }
        addRecentlyViewed({
          id: found.id,
          slug: found.slug,
          name_en: found.name_en,
          name_ur: found.name_ur,
          area_name: found.area?.name_en ?? 'Sadiqabad',
          category_name: found.category?.name_en ?? '',
          icon: found.category?.icon ?? 'Store',
          logo_url: found.logo_url,
        });
        fetchRelatedBusinesses(found.id, found.category_id, 3).then(setRelated);
      }
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const openCorrectionWith = (reason: string) => {
    setCorrectionReason(reason);
    setCorrectionOpen(true);
  };

  if (loading) {
    return (
      <AppShell>
        <Container className="py-6 space-y-4">
          <Skeleton className="h-56 w-full rounded-3xl" />
          <Skeleton className="h-32 w-full rounded-2xl" />
          <Skeleton className="h-48 w-full rounded-2xl" />
        </Container>
      </AppShell>
    );
  }

  if (!business) {
    return (
      <AppShell>
        <Container className="py-10">
          <ErrorState
            title={lang === 'ur' ? 'کاروبار کی لسٹنگ نہیں ملی' : 'Business listing not found'}
            description={
              lang === 'ur'
                ? 'ہو سکتا ہے یہ لسٹنگ منتقل ہو گئی ہو یا ماڈریشن کے انتظار میں ہو۔'
                : 'This listing may have moved or is awaiting moderation.'
            }
            onRetry={() => navigate('/search')}
          />
        </Container>
      </AppShell>
    );
  }

  const effPlan = effectivePlanCode(business.plan_code, business.plan_expires_at);
  const canWhatsApp = Boolean(business.whatsapp) && (effPlan === 'basic' || effPlan === 'premium');
  const canGallery = effPlan === 'basic' || effPlan === 'premium';
  const canVideos = effPlan === 'basic' || effPlan === 'premium';
  const canQr = effPlan === 'basic' || effPlan === 'premium';
  const canInquiry = effPlan === 'basic' || effPlan === 'premium';
  const canSocial = effPlan === 'basic' || effPlan === 'premium';
  const isSaved = favorites.includes(business.id);
  const gallery = canGallery
    ? business.gallery_urls.length > 0
      ? business.gallery_urls
      : business.cover_url
      ? [business.cover_url]
      : []
    : [];
  const directionsUrl = buildGoogleMapsDirectionsUrl(
    business.lat,
    business.lng,
    `${business.name_en} ${business.address_en ?? ''}`
  );
  const activeOffer = business.active_offers?.[0];
  const reviews = business.approved_reviews ?? [];
  const displayedServices =
    lang === 'ur' && business.services_ur.length > 0 ? business.services_ur : business.services_en;

  const socialLinks = canSocial
    ? [
        { label: 'Facebook', url: business.facebook_url },
        { label: 'Instagram', url: business.instagram_url },
        { label: 'YouTube', url: business.youtube_url },
        { label: 'TikTok', url: business.tiktok_url },
      ].filter((s): s is { label: string; url: string } => Boolean(s.url))
    : [];

  return (
    <AppShell hideBottomNav>
      <div className="pb-24 md:pb-8">
        {/* Hero Cover */}
        <div className="relative w-full h-52 sm:h-72 bg-surface-container-high overflow-hidden">
          <ImageWithFallback
            src={business.cover_url || business.logo_url}
            alt={business.name_en}
            className="w-full h-full"
            onReportBroken={() => openCorrectionWith('Broken image / photo')}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-black/30 pointer-events-none" />

          <Container className="absolute inset-0 flex flex-col justify-between py-4">
            <div className="flex items-center justify-between">
              <button
                type="button"
                aria-label="Go back"
                onClick={() => navigate(-1)}
                className="w-10 h-10 rounded-full bg-surface-container-lowest/85 backdrop-blur-md text-on-surface flex items-center justify-center shadow-sm cursor-pointer"
              >
                <ArrowLeft className="w-5 h-5 rtl:rotate-180" />
              </button>

              <div className="flex items-center gap-2">
                {canQr && (
                  <button
                    type="button"
                    aria-label="Show QR Code"
                    onClick={() => setQrOpen(true)}
                    className="w-10 h-10 rounded-full bg-surface-container-lowest/85 backdrop-blur-md text-on-surface flex items-center justify-center shadow-sm cursor-pointer"
                  >
                    <QrCode className="w-5 h-5" />
                  </button>
                )}
                <button
                  type="button"
                  aria-label="Share business"
                  onClick={() => setShareOpen(true)}
                  className="w-10 h-10 rounded-full bg-surface-container-lowest/85 backdrop-blur-md text-on-surface flex items-center justify-center shadow-sm cursor-pointer"
                >
                  <Share2 className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  aria-label={isSaved ? 'Remove bookmark' : 'Save business'}
                  onClick={() => setFavorites(toggleFavoriteId(business.id))}
                  className="w-10 h-10 rounded-full bg-surface-container-lowest/85 backdrop-blur-md text-secondary flex items-center justify-center shadow-sm cursor-pointer"
                >
                  <Bookmark className={`w-5 h-5 ${isSaved ? 'fill-current' : ''}`} />
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <OpenNowBadge
                openingHours={business.opening_hours}
                isOpen24h={business.is_open_24h}
                showDetail
              />
            </div>
          </Container>
        </div>

        <Container className="relative -mt-10 space-y-6">
          {/* Identity Header Row */}
          <div className="flex items-end justify-between gap-4 flex-wrap">
            <div className="relative w-24 h-24 rounded-2xl bg-surface-container-lowest p-1.5 shadow-lg border border-outline-variant/40">
              <ImageWithFallback
                src={business.logo_url || business.cover_url}
                alt={business.name_en}
                className="w-full h-full rounded-xl"
              />
              {business.is_verified && (
                <span className="absolute -bottom-1.5 -end-1.5 w-7 h-7 rounded-full bg-primary text-on-primary flex items-center justify-center shadow-md">
                  <BadgeCheck className="w-4 h-4" />
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {business.is_verified && (
                <Badge variant="primary">
                  <BadgeCheck className="w-3.5 h-3.5" />{' '}
                  {lang === 'ur' ? 'تصدیق شدہ' : 'Verified تصدیق شدہ'}
                </Badge>
              )}
              {effPlan === 'premium' && (
                <Badge variant="gold">
                  <Crown className="w-3.5 h-3.5" />{' '}
                  {lang === 'ur' ? 'پریمیم پلان' : 'Premium Plan'}
                </Badge>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left / Main Info Column */}
            <div className="lg:col-span-8 space-y-5">
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-on-surface tracking-tight">
                  {bilingualText(lang, business.name_en, business.name_ur)}
                </h1>
                {lang === 'en' && urduHints && business.name_ur && (
                  <p className="font-urdu text-lg font-bold text-primary mt-1 leading-[2.0]" dir="rtl">
                    {business.name_ur}
                  </p>
                )}

                <div className="flex items-center flex-wrap gap-x-2 gap-y-1 text-sm text-on-surface-variant mt-2">
                  {business.category && (
                    <Link
                      to={`/category/${business.category.slug}`}
                      className="font-semibold text-primary hover:underline"
                    >
                      {bilingualText(lang, business.category.name_en, business.category.name_ur)}
                    </Link>
                  )}
                  <span>·</span>
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="w-4 h-4 text-secondary" />
                    {business.area
                      ? bilingualText(lang, business.area.name_en, business.area.name_ur)
                      : lang === 'ur'
                      ? 'صادق آباد'
                      : 'Sadiqabad'}
                  </span>
                  {business.established_year && (
                    <>
                      <span>·</span>
                      <span>
                        {lang === 'ur'
                          ? `قائم شدہ ${business.established_year}`
                          : `Est. ${business.established_year}`}
                      </span>
                    </>
                  )}
                </div>

                <div className="flex items-center gap-3 mt-3">
                  <StarRating rating={business.rating_avg} count={business.rating_count} />
                  {business.rating_avg && business.rating_avg >= 4.5 && (
                    <span className="text-xs font-bold text-tertiary">
                      {lang === 'ur' ? 'صادق آباد میں نمایاں درجہ بندی' : 'Top Rated in Sadiqabad'}
                    </span>
                  )}
                </div>
              </div>

              {/* Active Promotion Banner */}
              {activeOffer && (
                <div className="rounded-2xl bg-gradient-to-r from-secondary-container to-secondary p-4 text-on-secondary-container shadow-sm flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/25 flex items-center justify-center shrink-0">
                    <Tag className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-extrabold uppercase tracking-wider">
                        {lang === 'ur' ? 'خصوصی آفر' : 'Special Offer'}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-white/30 text-[11px] font-bold">
                        {lang === 'ur' ? 'میعاد' : 'Till'} {formatDateShort(activeOffer.valid_to, lang)}
                      </span>
                    </div>
                    <h2 className="text-base font-bold mt-0.5">{activeOffer.title}</h2>
                    {activeOffer.description && (
                      <p className="text-xs opacity-90 mt-0.5">{activeOffer.description}</p>
                    )}
                  </div>
                </div>
              )}

              {/* About Business */}
              {(business.description_en || business.description_ur) && (
                <Card className="p-5 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h2 className="text-base font-bold text-on-surface flex items-center gap-2">
                      <Info className="w-4 h-4 text-primary" />{' '}
                      {lang === 'ur' ? 'کاروبار کا تعارف' : 'About Business'}
                    </h2>
                    {lang === 'en' && urduHints && (
                      <span className="font-urdu text-xs font-bold text-primary" dir="rtl">
                        ہمارے بارے میں
                      </span>
                    )}
                  </div>
                  {business.description_en && (
                    <p className="text-sm text-on-surface-variant leading-relaxed">
                      {business.description_en}
                    </p>
                  )}
                  {business.description_ur && (
                    <p
                      className="font-urdu text-sm text-on-surface-variant leading-[2.1] pt-1"
                      dir="rtl"
                    >
                      {business.description_ur}
                    </p>
                  )}
                </Card>
              )}

              {/* Services & Amenities */}
              {displayedServices.length > 0 && (
                <Card className="p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <h2 className="text-base font-bold text-on-surface">
                      {lang === 'ur' ? 'سہولیات اور خدمات' : 'Services & Amenities'}
                    </h2>
                    {lang === 'en' && urduHints && (
                      <span className="font-urdu text-xs text-on-surface-variant" dir="rtl">
                        سہولیات
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {displayedServices.map((srv) => (
                      <span
                        key={srv}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-container-low text-xs font-semibold text-on-surface"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-tertiary" />
                        <span>{srv}</span>
                      </span>
                    ))}
                  </div>
                </Card>
              )}

              {/* Photo Gallery & Video Showcase */}
              {gallery.length > 0 && (
                <Card className="p-5 space-y-3">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <h2 className="text-base font-bold text-on-surface">
                      {lang === 'ur' ? `تصاویر کی گیلری (${gallery.length})` : `Photo Gallery (${gallery.length})`}
                    </h2>
                    <button
                      type="button"
                      onClick={() => openCorrectionWith('Broken image / photo')}
                      className="text-xs font-semibold text-on-surface-variant hover:text-error inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Flag className="w-3.5 h-3.5" />
                      <span>{lang === 'ur' ? 'خراب تصویر کی اطلاع' : 'Report Broken Photo'}</span>
                    </button>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {gallery.map((url, idx) => (
                      <div key={`${url}-${idx}`} className="relative aspect-square rounded-xl overflow-hidden bg-surface-container">
                        <button
                          type="button"
                          onClick={() => setLightboxIdx(idx)}
                          aria-label={`Open photo ${idx + 1}`}
                          className="w-full h-full cursor-pointer hover:opacity-90 transition-opacity block"
                        >
                          <ImageWithFallback
                            src={url}
                            alt={`${business.name_en} photo ${idx + 1}`}
                            className="w-full h-full"
                            onReportBroken={() => openCorrectionWith('Broken image / photo')}
                          />
                        </button>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* Safe Embedded Videos */}
              {canVideos && business.video_urls.length > 0 && (
                <Card className="p-5 space-y-3">
                  <h2 className="text-base font-bold text-on-surface">
                    {lang === 'ur' ? 'ویڈیوز' : 'Videos'}
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {business.video_urls.map((vUrl, idx) => {
                      const safe = extractSafeEmbedUrl(vUrl);
                      if (!safe) return null;
                      return (
                        <iframe
                          key={idx}
                          src={safe}
                          title={`${business.name_en} video ${idx + 1}`}
                          className="w-full aspect-video rounded-xl border border-outline-variant/40"
                          allowFullScreen
                        />
                      );
                    })}
                  </div>
                </Card>
              )}

              {/* Operating Hours */}
              <Card className="p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold text-on-surface">
                    {lang === 'ur' ? 'اوقات کار (پاکستان وقت)' : 'Operating Hours (PKT)'}
                  </h2>
                  {lang === 'en' && urduHints && (
                    <span className="font-urdu text-xs text-primary" dir="rtl">
                      اوقات کار
                    </span>
                  )}
                </div>
                <OpeningHoursTable
                  openingHours={business.opening_hours}
                  isOpen24h={business.is_open_24h}
                />
              </Card>

              {/* Local Customer Reviews with Histogram */}
              <Card className="p-5 space-y-4">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div>
                    <h2 className="text-base font-bold text-on-surface">
                      {lang === 'ur'
                        ? `صارفین کے تبصرے (${reviews.length})`
                        : `Customer Reviews (${reviews.length})`}
                    </h2>
                    <p className="text-xs text-on-surface-variant">
                      {lang === 'ur'
                        ? 'صادق آباد کے صارفین کی آراء'
                        : 'Feedback from Sadiqabad visitors'}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => setReviewOpen(true)}
                    leftIcon={<Star className="w-4 h-4" />}
                  >
                    {t('action.writeReview', 'Write a Review')}
                  </Button>
                </div>

                {reviews.length > 0 && (
                  <div className="p-3.5 rounded-2xl bg-surface-container-low grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                    <div className="sm:col-span-4 text-center sm:border-e border-outline-variant/30 sm:pe-3">
                      <p className="text-3xl font-extrabold text-on-surface tabular-nums">
                        {(business.rating_avg ?? 5).toFixed(1)}
                      </p>
                      <div className="flex justify-center my-1">
                        <StarRating rating={business.rating_avg ?? 5} size="sm" />
                      </div>
                      <p className="text-[11px] text-on-surface-variant">
                        {lang === 'ur'
                          ? `${reviews.length} تبصرے`
                          : `${reviews.length} review${reviews.length === 1 ? '' : 's'}`}
                      </p>
                    </div>
                    <div className="sm:col-span-8 space-y-1.5">
                      {[5, 4, 3, 2, 1].map((stars) => {
                        const count = reviews.filter((r) => Math.round(r.rating) === stars).length;
                        const pct = Math.round((count / reviews.length) * 100);
                        return (
                          <div key={stars} className="flex items-center gap-2 text-xs">
                            <span className="w-6 font-bold tabular-nums">{stars}★</span>
                            <div className="flex-1 h-2 rounded-full bg-surface-container overflow-hidden">
                              <div
                                className="h-full rounded-full bg-secondary-container"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className="w-6 text-end text-on-surface-variant tabular-nums">
                              {count}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {reviews.length === 0 ? (
                  <p className="text-sm text-on-surface-variant">
                    {lang === 'ur'
                      ? `ابھی تک کوئی تبصرہ نہیں۔ ${bilingualText(lang, business.name_en, business.name_ur)} پر پہلی رائے درج کریں!`
                      : `No reviews yet. Be the first to review ${business.name_en}!`}
                  </p>
                ) : (
                  <div className="space-y-3">
                    {reviews.map((rev) => (
                      <div
                        key={rev.id}
                        className="p-3.5 rounded-xl bg-surface-container-low space-y-1.5"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-bold text-on-surface">
                            {rev.author_name}
                          </span>
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-secondary">
                            <Star className="w-3.5 h-3.5 fill-current" /> {rev.rating}
                          </span>
                        </div>
                        <p className="text-sm text-on-surface-variant">{rev.comment}</p>
                        {rev.owner_reply && (
                          <div className="mt-2 p-2.5 rounded-lg bg-primary-fixed/40 text-xs text-on-surface">
                            <strong className="text-primary">
                              {lang === 'ur' ? 'مالک کا جواب:' : 'Owner Reply:'}
                            </strong>{' '}
                            {rev.owner_reply}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>

            {/* Right / Sticky Contact & Action Column */}
            <aside className="lg:col-span-4 space-y-4 lg:sticky lg:top-28">
              <Card className="p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-outline">
                    {lang === 'ur' ? 'براہ راست رابطہ نمبرز' : 'Direct Contact Lines'}
                  </span>
                  {lang === 'en' && urduHints && (
                    <span className="font-urdu text-xs text-primary font-bold" dir="rtl">
                      رابطہ نمبرز
                    </span>
                  )}
                </div>

                <div className="space-y-2">
                  <a
                    href={buildTelUrl(business.phone_primary)}
                    onClick={() => trackBusinessEvent(business.id, 'call')}
                    className="flex items-center gap-3 p-3 rounded-xl bg-surface-container-low hover:bg-surface-container transition-colors"
                  >
                    <div className="w-9 h-9 rounded-lg bg-primary text-on-primary flex items-center justify-center shrink-0">
                      <Smartphone className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[11px] text-outline block">
                        {lang === 'ur' ? 'مرکزی موبائل / ہاٹ لائن' : 'Primary Mobile / Hotline'}
                      </span>
                      <span className="text-sm font-extrabold text-on-surface tabular-nums" dir="ltr">
                        {formatPkPhoneDisplay(business.phone_primary)}
                      </span>
                    </div>
                  </a>

                  {business.phone_secondary && (
                    <a
                      href={buildTelUrl(business.phone_secondary)}
                      onClick={() => trackBusinessEvent(business.id, 'call')}
                      className="flex items-center gap-3 p-3 rounded-xl bg-surface-container-low hover:bg-surface-container transition-colors"
                    >
                      <div className="w-9 h-9 rounded-lg bg-surface-variant text-on-surface-variant flex items-center justify-center shrink-0">
                        <Phone className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-[11px] text-outline block">
                          {lang === 'ur' ? 'لینڈ لائن / متبادل نمبر' : 'Landline / Secondary'}
                        </span>
                        <span className="text-sm font-extrabold text-on-surface tabular-nums" dir="ltr">
                          {formatPkPhoneDisplay(business.phone_secondary)}
                        </span>
                      </div>
                    </a>
                  )}
                </div>

                {/* Primary CTA Buttons */}
                <div className="grid grid-cols-1 gap-2.5">
                  <a
                    href={buildTelUrl(business.phone_primary)}
                    onClick={() => trackBusinessEvent(business.id, 'call')}
                    className="min-h-[46px] rounded-xl bg-primary text-on-primary font-bold text-sm flex items-center justify-center gap-2 shadow-sm hover:bg-primary-container transition-colors"
                  >
                    <Phone className="w-4 h-4" />
                    <span>{t('action.callNow', 'Call Now')}</span>
                  </a>

                  {canWhatsApp && (
                    <a
                      href={buildWhatsAppUrl(
                        business.whatsapp,
                        `Assalam o Alaikum! I found ${business.name_en} on HelloSadiqabad.com`
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => trackBusinessEvent(business.id, 'whatsapp')}
                      className="min-h-[46px] rounded-xl bg-whatsapp text-white font-bold text-sm flex items-center justify-center gap-2 shadow-sm hover:brightness-95"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>{lang === 'ur' ? 'واٹس ایپ پر بات کریں' : 'Chat on WhatsApp'}</span>
                    </a>
                  )}

                  <a
                    href={directionsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => trackBusinessEvent(business.id, 'directions')}
                    className="min-h-[44px] rounded-xl bg-surface-container text-primary font-bold text-sm flex items-center justify-center gap-2 hover:bg-surface-container-high"
                  >
                    <Navigation className="w-4 h-4" />
                    <span>{lang === 'ur' ? 'راستہ دیکھیں (نقشہ)' : 'Get Directions'}</span>
                  </a>

                  {canInquiry && (
                    <Button
                      variant="secondary"
                      fullWidth
                      onClick={() => setInquiryOpen(true)}
                      leftIcon={<Send className="w-4 h-4" />}
                    >
                      {t('action.sendInquiry', 'Send Inquiry')}
                    </Button>
                  )}
                </div>

                {/* Address, Landmark & Embedded Mini-Map */}
                {(business.address_en || business.landmark_en || (business.lat && business.lng)) && (
                  <div className="pt-3 border-t border-outline-variant/25 space-y-2 text-xs">
                    <span className="font-bold text-on-surface uppercase tracking-wider block">
                      {t('profile.locationAddress', 'Location & Address')}
                    </span>
                    {business.address_en && (
                      <p className="text-on-surface-variant">{business.address_en}</p>
                    )}
                    {business.address_ur && (
                      <p className="font-urdu text-on-surface-variant leading-[2.0]" dir="rtl">
                        {business.address_ur}
                      </p>
                    )}
                    {business.landmark_en && (
                      <p className="text-primary font-semibold">
                        {lang === 'ur' ? 'قریبی نشانی:' : 'Landmark:'} {business.landmark_en}
                      </p>
                    )}
                    {typeof business.lat === 'number' && typeof business.lng === 'number' && (
                      <MiniBusinessMap lat={business.lat} lng={business.lng} name={business.name_en} />
                    )}
                  </div>
                )}

                {business.website_url && (
                  <a
                    href={business.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-bold text-primary hover:underline inline-flex items-center gap-1.5 pt-1"
                  >
                    <Globe className="w-3.5 h-3.5" />{' '}
                    {lang === 'ur' ? 'ویب سائٹ دیکھیں' : 'Visit Website'}
                  </a>
                )}

                {socialLinks.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {socialLinks.map((soc) => (
                      <a
                        key={soc.label}
                        href={soc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-1 rounded-lg bg-surface-container-low hover:bg-surface-container text-[11px] font-bold text-on-surface inline-flex items-center gap-1"
                      >
                        <span>{soc.label}</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    ))}
                  </div>
                )}

                {/* Report & Claim Links */}
                <div className="pt-3 border-t border-outline-variant/25 flex items-center justify-between gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => openCorrectionWith('Phone number changed')}
                    className="text-on-surface-variant hover:text-error font-semibold inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Flag className="w-3.5 h-3.5" /> {t('action.suggestEdit', 'Suggest Edit')}
                  </button>

                  {!business.owner_id && (
                    <button
                      type="button"
                      onClick={() => setClaimOpen(true)}
                      className="text-primary hover:underline font-bold inline-flex items-center gap-1 cursor-pointer"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" /> {t('action.claimBusiness', 'Claim Listing')}
                    </button>
                  )}
                </div>
              </Card>
            </aside>
          </div>

          {/* Related Businesses */}
          {related.length > 0 && (
            <section className="pt-4 space-y-3">
              <h2 className="text-lg font-bold text-on-surface">
                {lang === 'ur' ? 'صادق آباد میں ملتے جلتے کاروبار' : 'Similar Businesses in Sadiqabad'}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {related.map((rel) => (
                  <BusinessCard
                    key={rel.id}
                    business={rel}
                    isSaved={favorites.includes(rel.id)}
                    onToggleSave={(id) => setFavorites(toggleFavoriteId(id))}
                  />
                ))}
              </div>
            </section>
          )}
        </Container>
      </div>

      {/* Stitch 06 Sticky Mobile Action Bar (above frozen mobile footer) */}
      <div className="fixed bottom-9 inset-x-0 z-30 md:hidden bg-surface-container-lowest/95 backdrop-blur-md border-t border-outline-variant/40 px-3 py-2 shadow-lg">
        <div className="flex items-center gap-2 max-w-md mx-auto">
          <a
            href={buildTelUrl(business.phone_primary)}
            onClick={() => trackBusinessEvent(business.id, 'call')}
            className="flex-1 h-10 rounded-xl bg-primary text-on-primary text-xs font-bold flex items-center justify-center gap-1.5"
          >
            <Phone className="w-4 h-4" /> {t('action.call', 'Call')}
          </a>
          {canWhatsApp && (
            <a
              href={buildWhatsAppUrl(
                business.whatsapp,
                `Assalam o Alaikum! I found ${business.name_en} on HelloSadiqabad.com`
              )}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackBusinessEvent(business.id, 'whatsapp')}
              className="flex-1 h-10 rounded-xl bg-whatsapp text-white text-xs font-bold flex items-center justify-center gap-1.5"
            >
              <MessageCircle className="w-4 h-4" /> {t('action.whatsapp', 'WhatsApp')}
            </a>
          )}
          <a
            href={directionsUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackBusinessEvent(business.id, 'directions')}
            aria-label="Get directions"
            className="w-10 h-10 rounded-xl bg-surface-container text-primary flex items-center justify-center shrink-0"
          >
            <Navigation className="w-4 h-4" />
          </a>
          <button
            type="button"
            aria-label={isSaved ? 'Remove bookmark' : 'Save business'}
            onClick={() => setFavorites(toggleFavoriteId(business.id))}
            className="w-10 h-10 rounded-xl bg-surface-container text-secondary flex items-center justify-center shrink-0 cursor-pointer"
          >
            <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
          </button>
        </div>
      </div>

      {/* Overlays & Lightbox */}
      <Lightbox
        images={gallery}
        index={lightboxIdx}
        onClose={() => setLightboxIdx(null)}
        onIndexChange={setLightboxIdx}
        title={business.name_en}
        phone={business.phone_primary}
        whatsapp={canWhatsApp ? business.whatsapp : null}
        onShare={() => setShareOpen(true)}
      />
      <SendInquiryModal open={inquiryOpen} onClose={() => setInquiryOpen(false)} business={business} />
      <WriteReviewModal
        open={reviewOpen}
        onClose={() => setReviewOpen(false)}
        business={business}
        onSubmitted={loadProfile}
      />
      <SuggestCorrectionModal
        open={correctionOpen}
        onClose={() => setCorrectionOpen(false)}
        business={business}
        initialReason={correctionReason}
      />
      <ClaimBusinessModal open={claimOpen} onClose={() => setClaimOpen(false)} business={business} />
      <QrCodeModal open={qrOpen} onClose={() => setQrOpen(false)} business={business} />
      <ShareSheet open={shareOpen} onClose={() => setShareOpen(false)} business={business} />
    </AppShell>
  );
}
