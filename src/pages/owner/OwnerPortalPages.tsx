import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  BarChart3,
  CheckCircle2,
  Circle,
  Clock,
  Crown,
  Edit3,
  ExternalLink,
  Eye,
  Headphones,
  Inbox,
  MessageCircle,
  MessageSquare,
  Navigation,
  Phone,
  PlusCircle,
  Rocket,
  Search,
  Star,
  Store,
  Tag,
} from 'lucide-react';
import { useAuth } from '../../lib/auth';
import {
  deleteOffer,
  fetchAllAreas,
  fetchAllCategories,
  fetchBusinessOffers,
  fetchNotifications,
  fetchOwnerDashboardStats,
  fetchOwnerInquiries,
  fetchOwnerListings,
  fetchOwnerReviews,
  fetchPlans,
  fetchPublicSiteSettings,
  markNotificationsRead,
  replyToReview,
  updateInquiryStatus,
  updateOwnerBusiness,
  upsertOffer,
} from '../../lib/api';
import { daysUntil } from '../../lib/format';
import { DEFAULT_SITE_SETTINGS, type SiteSettingsMap } from '../../lib/siteSettings';
import { evaluatePasswordStrength } from '../../lib/password';
import { normalizePkPhone } from '../../lib/phone';
import { effectivePlanCode } from '../../lib/searchFilter';
import { countEffectiveActiveOffers } from '../../lib/offers';
import type {
  AreaRow,
  CategoryRow,
  InquiryRow,
  InquiryStatus,
  NotificationRow,
  OfferRow,
  PlanRow,
  ReviewRow,
} from '../../types/database';
import type { BusinessPublicView, OwnerDashboardStats } from '../../types/directory';
import { AppHeader } from '../../components/layout/AppHeader';
import { AppFooter } from '../../components/layout/AppFooter';
import { OwnerNav } from '../../components/owner/OwnerNav';
import { ListingEditor } from '../../components/owner/ListingEditor';
import {
  InquiriesInbox,
  NotificationsList,
  OffersManager,
  OwnerAnalytics,
  PlanCard,
  ReviewsReply,
} from '../../components/owner/OwnerModules';
import { SparklineSvg } from '../../components/ui/Charts';
import { ImageWithFallback } from '../../components/ui/ImageWithFallback';
import { Badge, Card } from '../../components/ui/Surface';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/FormFields';
import { Skeleton } from '../../components/ui/Feedback';
import { useToast } from '../../components/ui/Toast';
import { DemoModeNotice } from '../../components/ui/DemoModeNotice';

function useOwnerPortalData(days = 30, routeListingId?: string) {
  const { user } = useAuth();
  const [listings, setListings] = useState<BusinessPublicView[]>([]);
  const [selectedId, setSelectedId] = useState<string>(routeListingId ?? '');
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [areas, setAreas] = useState<AreaRow[]>([]);
  const [plans, setPlans] = useState<PlanRow[]>([]);
  const [stats, setStats] = useState<OwnerDashboardStats | null>(null);
  const [offers, setOffers] = useState<OfferRow[]>([]);
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [inquiries, setInquiries] = useState<InquiryRow[]>([]);
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (routeListingId) {
      setSelectedId(routeListingId);
    }
  }, [routeListingId]);

  const reload = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [owned, cats, ar, pls, notifs] = await Promise.all([
        fetchOwnerListings(user.id),
        fetchAllCategories(),
        fetchAllAreas(),
        fetchPlans(),
        fetchNotifications(user.id),
      ]);
      setListings(owned);
      setCategories(cats);
      setAreas(ar);
      setPlans(pls);
      setNotifications(notifs);

      const preferredId =
        (routeListingId && owned.some((b) => b.id === routeListingId) ? routeListingId : '') ||
        (selectedId && owned.some((b) => b.id === selectedId) ? selectedId : '') ||
        owned[0]?.id ||
        '';
      if (preferredId !== selectedId) {
        setSelectedId(preferredId);
      }

      const ids = owned.map((b) => b.id);
      const [revs, inqs] = await Promise.all([
        fetchOwnerReviews(ids),
        fetchOwnerInquiries(ids),
      ]);
      setReviews(revs);
      setInquiries(inqs);

      if (preferredId) {
        const [st, offs] = await Promise.all([
          fetchOwnerDashboardStats(preferredId, days),
          fetchBusinessOffers(preferredId),
        ]);
        setStats(st);
        setOffers(offs);
      }
    } finally {
      setLoading(false);
    }
  }, [user, selectedId, routeListingId, days]);

  useEffect(() => {
    reload();
  }, [reload]);

  const activeBusiness = listings.find((b) => b.id === selectedId) ?? listings[0] ?? null;
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return {
    listings,
    activeBusiness,
    selectedId,
    setSelectedId,
    categories,
    areas,
    plans,
    stats,
    offers,
    reviews,
    inquiries,
    notifications,
    unreadCount,
    loading,
    reload,
  };
}

function OwnerShell({
  unreadCount,
  listings,
  selectedId,
  onSelect,
  loading,
  children,
}: {
  unreadCount: number;
  listings: BusinessPublicView[];
  selectedId: string;
  onSelect: (id: string) => void;
  loading: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-surface text-on-surface">
      <AppHeader />
      <div className="pt-[93px] sm:pt-[102px]">
        <DemoModeNotice />
      </div>
      <div className="flex-1 flex flex-col lg:flex-row pb-20">
        <OwnerNav unreadCount={unreadCount} />
        <main className="flex-1 p-4 sm:p-6 pb-10 max-w-5xl w-full mx-auto space-y-5">
          {listings.length > 1 && (
            <div className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-surface-container-lowest border border-outline-variant/40">
              <span className="text-xs font-bold text-on-surface-variant">Active Listing:</span>
              <select
                value={selectedId}
                onChange={(e) => onSelect(e.target.value)}
                aria-label="Select business listing"
                className="h-9 px-3 rounded-xl border border-outline-variant bg-surface text-xs font-bold"
              >
                {listings.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name_en} ({b.plan_code})
                  </option>
                ))}
              </select>
            </div>
          )}
          {loading ? <Skeleton className="h-64 rounded-2xl" /> : children}
        </main>
      </div>
      <AppFooter variant="portal" withBottomNavOffset={false} />
    </div>
  );
}

export function OwnerDashboard() {
  const { profile } = useAuth();
  const data = useOwnerPortalData();
  const biz = data.activeBusiness;
  const [siteSettings, setSiteSettings] = useState<SiteSettingsMap>(DEFAULT_SITE_SETTINGS);

  useEffect(() => {
    fetchPublicSiteSettings().then(setSiteSettings).catch(() => {});
  }, []);

  const newInquiriesCount = biz
    ? data.inquiries.filter((i) => i.business_id === biz.id && i.status === 'new').length
    : 0;
  const unansweredReviewsCount = biz
    ? data.reviews.filter((r) => r.business_id === biz.id && !r.owner_reply).length
    : 0;
  const activeOffersCount = countEffectiveActiveOffers(data.offers);
  const effCode = biz ? effectivePlanCode(biz.plan_code, biz.plan_expires_at) : 'free';
  const planDaysLeft = biz?.plan_expires_at ? daysUntil(biz.plan_expires_at) : null;

  const checklist = biz
    ? [
        {
          label: 'Upload Shop Logo Photo',
          ur: 'دکان کا لوگو شامل کریں',
          done: Boolean(biz.logo_url),
          step: 'preview',
        },
        {
          label: 'Write Business Description',
          ur: 'کاروبار کی تفصیل لکھیں',
          done: Boolean(biz.description_en?.trim()),
          step: 'basic',
        },
        {
          label: 'Set Opening Hours or 24/7',
          ur: 'اوقات کار مقرر کریں',
          done: Boolean(
            biz.is_open_24h || (biz.opening_hours && Object.keys(biz.opening_hours).length > 0)
          ),
          step: 'hours',
        },
        {
          label: 'Add Street Address',
          ur: 'گلی اور بازار کا پتہ لکھیں',
          done: Boolean(biz.address_en?.trim()),
          step: 'location',
        },
        {
          label: 'Pin Shop on Sadiqabad Map',
          ur: 'نقشے پر دکان کی جگہ منتخب کریں',
          done: Boolean(biz.lat && biz.lng),
          step: 'location',
        },
      ]
    : [];
  const doneCount = checklist.filter((c) => c.done).length;
  const completenessPct = checklist.length > 0 ? Math.round((doneCount / checklist.length) * 100) : 0;

  const waDigits = normalizePkPhone(
    siteSettings.contact_whatsapp || siteSettings.contact_phone
  ).replace(/^\+/, '');

  return (
    <OwnerShell
      unreadCount={data.unreadCount}
      listings={data.listings}
      selectedId={data.selectedId}
      onSelect={data.setSelectedId}
      loading={data.loading}
    >
      {!biz ? (
        /* Stitch 21 Unassigned Onboarding State */
        <Card className="p-6 sm:p-8 text-center space-y-5">
          <div className="w-16 h-16 rounded-full bg-secondary-fixed/50 text-secondary flex items-center justify-center mx-auto">
            <Store className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <p className="font-urdu text-base text-secondary font-bold" dir="rtl">
              اپنی دکان یا کاروبار کا اندراج کروائیں
            </p>
            <h2 className="text-xl font-extrabold text-on-surface">
              Claim or Register Your Sadiqabad Shop
            </h2>
            <p className="text-sm text-on-surface-variant max-w-md mx-auto">
              Get discovered by residents across Sadiqabad. Receive direct WhatsApp inquiries,
              phone calls, and Google Maps navigation.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-2xl mx-auto text-start">
            <div className="p-3.5 rounded-xl bg-surface-container-low space-y-1">
              <span className="w-6 h-6 rounded-full bg-primary text-on-primary text-xs font-bold inline-flex items-center justify-center">
                1
              </span>
              <p className="text-xs font-bold text-on-surface">Search Directory</p>
              <p className="text-[11px] text-on-surface-variant">
                Check if your shop is already listed to submit an ownership claim.
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-surface-container-low space-y-1">
              <span className="w-6 h-6 rounded-full bg-secondary text-on-secondary text-xs font-bold inline-flex items-center justify-center">
                2
              </span>
              <p className="text-xs font-bold text-on-surface">Submit Ownership Details</p>
              <p className="text-[11px] text-on-surface-variant">
                Provide your shop phone number and business details.
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-surface-container-low space-y-1">
              <span className="w-6 h-6 rounded-full bg-primary text-on-primary text-xs font-bold inline-flex items-center justify-center">
                3
              </span>
              <p className="text-xs font-bold text-on-surface">Moderation Review</p>
              <p className="text-[11px] text-on-surface-variant">
                Our Sadiqabad moderation team reviews your request and links the listing to your dashboard.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3 flex-wrap pt-1">
            <Link
              to="/add-business"
              className="min-h-[44px] px-5 rounded-xl bg-primary text-on-primary text-xs font-bold inline-flex items-center gap-1.5"
            >
              <PlusCircle className="w-4 h-4" /> Add New Business
            </Link>
            <Link
              to="/search"
              className="min-h-[44px] px-5 rounded-xl border border-outline-variant text-xs font-bold inline-flex items-center gap-1.5 hover:bg-surface-container-low"
            >
              <Search className="w-4 h-4" /> Find &amp; Claim Shop
            </Link>
          </div>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Owner Welcome & Shop Status Card (Stitch 21) */}
          <Card className="p-5 space-y-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-1">
                {profile?.full_name && (
                  <p className="text-xs font-semibold text-primary">
                    Welcome, {profile.full_name} ·{' '}
                    <span className="font-urdu">خوش آمدید</span>
                  </p>
                )}
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl sm:text-2xl font-extrabold text-on-surface">
                    {biz.name_en}
                  </h1>
                  <Badge variant={biz.status === 'published' ? 'success' : 'warning'}>
                    {biz.status}
                  </Badge>
                  <Badge variant={effCode === 'premium' ? 'gold' : 'neutral'}>
                    {effCode.toUpperCase()}
                  </Badge>
                  {effCode !== 'free' && planDaysLeft !== null && (
                    <Badge variant={planDaysLeft <= 14 ? 'danger' : 'primary'}>
                      <Clock className="w-3 h-3 inline me-1" />
                      {planDaysLeft}d left
                    </Badge>
                  )}
                </div>
                {biz.name_ur && (
                  <p className="font-urdu text-sm text-primary" dir="rtl">
                    {biz.name_ur}
                  </p>
                )}
                <p className="text-xs text-on-surface-variant">
                  {biz.category?.name_en} · {biz.area?.name_en ?? 'Sadiqabad'}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Link
                  to={`/business/${biz.slug}`}
                  className="min-h-[40px] px-3.5 rounded-xl border border-outline-variant text-xs font-bold inline-flex items-center gap-1.5 hover:bg-surface-container-low"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> View Public Profile
                </Link>
                <Link
                  to={`/owner/listings/${biz.id}`}
                  className="min-h-[40px] px-3.5 rounded-xl bg-primary text-on-primary text-xs font-bold inline-flex items-center gap-1.5"
                >
                  Edit Listing
                </Link>
              </div>
            </div>
          </Card>

          {/* 2x2 / 4-col Performance KPI Stat Cards with SparklineSvg (Stitch 21) */}
          {data.stats && (
            <div className="space-y-2.5">
              <DemoModeNotice
                variant="sample-data"
                contextLabelEn="Sample Preview Metrics: Views, calls, WhatsApp taps, and search trends shown below use local demo records."
                contextLabelUr="نمونہ پیش نظارہ اعدادوشمار: نیچے دکھائے گئے ویوز، کالز اور ٹرینڈز مقامی ڈیمو ڈیٹا پر مبنی ہیں۔"
              />
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {[
                {
                  label: 'Profile Views',
                  ur: 'پروفائل ویوز',
                  val: data.stats.totals.views,
                  icon: Eye,
                  color: '#006948',
                  seriesKey: 'views' as const,
                },
                {
                  label: 'Phone Call Taps',
                  ur: 'کالز موصول ہوئیں',
                  val: data.stats.totals.calls,
                  icon: Phone,
                  color: '#904d00',
                  seriesKey: 'calls' as const,
                },
                {
                  label: 'WhatsApp Clicks',
                  ur: 'واٹس ایپ پیغامات',
                  val: data.stats.totals.whatsapp,
                  icon: MessageSquare,
                  color: '#25D366',
                  seriesKey: 'whatsapp' as const,
                },
                {
                  label: 'Directions Taps',
                  ur: 'راستے کی رہنمائی',
                  val: data.stats.totals.directions,
                  icon: Navigation,
                  color: '#006b2e',
                  seriesKey: 'directions' as const,
                },
              ].map((kpi) => {
                const Icon = kpi.icon;
                const sparkPoints = data.stats!.series.map((pt) => pt[kpi.seriesKey]);
                return (
                  <Card key={kpi.label} className="p-4 flex flex-col justify-between gap-2">
                    <div className="flex items-center justify-between text-xs text-on-surface-variant font-semibold">
                      <span>{kpi.label}</span>
                      <Icon className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex items-end justify-between gap-2">
                      <div>
                        <p className="text-2xl font-extrabold text-on-surface tabular-nums">
                          {kpi.val}
                        </p>
                        <p className="font-urdu text-[10px] text-outline leading-tight">{kpi.ur}</p>
                      </div>
                      <SparklineSvg values={sparkPoints} color={kpi.color} height={28} />
                    </div>
                  </Card>
                );
              })}
              </div>
            </div>
          )}

          {/* Visual Spotlight Banner (Stitch 21) */}
          <div className="relative rounded-2xl overflow-hidden shadow-sm h-32 flex items-end p-4 sm:p-5 bg-inverse-surface text-inverse-on-surface">
            {(biz.cover_url || biz.logo_url) && (
              <ImageWithFallback
                src={biz.cover_url || biz.logo_url || ''}
                alt={biz.name_en}
                className="absolute inset-0 w-full h-full object-cover opacity-55"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
            <div className="relative z-10 flex items-center justify-between gap-3 w-full">
              <div>
                <p className="font-urdu text-xs text-primary-fixed">
                  صادق آباد میں اپنا کاروبار نمایاں کریں
                </p>
                <p className="text-sm sm:text-base font-extrabold text-white">
                  {effCode === 'premium'
                    ? 'Premium Spotlight Active on Search & Categories'
                    : 'Boost Visibility in Sadiqabad Searches'}
                </p>
              </div>
              <Link
                to="/owner/plan"
                className="px-3.5 py-2 rounded-full bg-primary text-on-primary text-xs font-bold inline-flex items-center gap-1.5 shrink-0 shadow-sm hover:brightness-110"
              >
                <Rocket className="w-3.5 h-3.5" />
                <span>{effCode === 'premium' ? 'Manage Plan' : 'Boost'}</span>
              </Link>
            </div>
          </div>

          {/* Checklist & Action Counters */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="p-5 lg:col-span-2 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h2 className="text-sm font-bold text-on-surface">
                    What to Do Next — Profile Health
                  </h2>
                  <p className="font-urdu text-[11px] text-primary">اگلے ضروری کام مکمل کریں</p>
                </div>
                <span className="text-xs font-extrabold text-primary tabular-nums">
                  {completenessPct}% Complete
                </span>
              </div>
              <div className="h-2 rounded-full bg-surface-container overflow-hidden">
                <div
                  className="h-full bg-primary transition-all"
                  style={{ width: `${completenessPct}%` }}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                {checklist.map((item) => (
                  <Link
                    key={item.label}
                    to={`/owner/listings/${biz.id}?step=${item.step}`}
                    className={`flex items-center gap-2 text-xs px-3 py-2.5 rounded-xl transition-colors ${
                      item.done
                        ? 'bg-primary-fixed/30 text-on-surface'
                        : 'bg-surface-container-low text-on-surface-variant hover:text-primary'
                    }`}
                  >
                    {item.done ? (
                      <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                    ) : (
                      <Circle className="w-4 h-4 text-outline shrink-0" />
                    )}
                    <div className="min-w-0">
                      <span className={item.done ? 'line-through opacity-75 block' : 'font-semibold block'}>
                        {item.label}
                      </span>
                      <span className="font-urdu text-[10px] opacity-75 block">{item.ur}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </Card>

            <Card className="p-5 space-y-3">
              <h2 className="text-sm font-bold text-on-surface">Action Counters</h2>
              <Link
                to="/owner/inquiries"
                className="flex items-center justify-between p-3 rounded-xl bg-surface-container-low hover:bg-surface-container text-xs transition-colors"
              >
                <span className="inline-flex items-center gap-2 font-semibold">
                  <Inbox className="w-4 h-4 text-primary" /> New Inquiries
                </span>
                <Badge variant={newInquiriesCount > 0 ? 'warning' : 'neutral'}>
                  {newInquiriesCount}
                </Badge>
              </Link>
              <Link
                to="/owner/reviews"
                className="flex items-center justify-between p-3 rounded-xl bg-surface-container-low hover:bg-surface-container text-xs transition-colors"
              >
                <span className="inline-flex items-center gap-2 font-semibold">
                  <Star className="w-4 h-4 text-secondary" /> Unanswered Reviews
                </span>
                <Badge variant={unansweredReviewsCount > 0 ? 'warning' : 'neutral'}>
                  {unansweredReviewsCount}
                </Badge>
              </Link>
              <Link
                to="/owner/offers"
                className="flex items-center justify-between p-3 rounded-xl bg-surface-container-low hover:bg-surface-container text-xs transition-colors"
              >
                <span className="inline-flex items-center gap-2 font-semibold">
                  <Tag className="w-4 h-4 text-tertiary" /> Active Offers
                </span>
                <Badge variant={activeOffersCount > 0 ? 'success' : 'neutral'}>
                  {activeOffersCount}
                </Badge>
              </Link>
            </Card>
          </div>

          {/* 6-Tile Quick Actions Grid (Stitch 21) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { to: `/owner/listings/${biz.id}`, icon: Edit3, label: 'Edit Listing', ur: 'ترمیم' },
              { to: '/owner/offers', icon: Tag, label: 'Manage Offers', ur: 'آفرز' },
              { to: '/owner/reviews', icon: Star, label: 'View Reviews', ur: 'ریویوز' },
              { to: '/owner/inquiries', icon: Inbox, label: 'Inquiries', ur: 'پیغامات' },
              { to: '/owner/analytics', icon: BarChart3, label: 'Analytics', ur: 'شماریات' },
              { to: '/owner/plan', icon: Crown, label: 'My Plan', ur: 'پلان' },
            ].map((tile) => {
              const Icon = tile.icon;
              return (
                <Link
                  key={tile.to}
                  to={tile.to}
                  className="p-3.5 rounded-2xl bg-surface-container-lowest border border-outline-variant/35 hover:border-primary/50 hover:shadow-xs transition-all flex flex-col items-start gap-2"
                >
                  <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-on-surface">{tile.label}</p>
                    <p className="font-urdu text-[10px] text-outline">{tile.ur}</p>
                  </div>
                </Link>
              );
            })}
          </div>

          {data.stats && (
            <OwnerAnalytics stats={data.stats} isFullAnalytics={effCode !== 'free'} />
          )}

          {/* Civic Support Help Card */}
          <Card className="p-4 bg-tertiary-container text-on-tertiary-container flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center shrink-0">
                <Headphones className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold">Hello Sadiqabad Merchant Support</p>
                <p className="font-urdu text-xs opacity-90">
                  کوئی مسئلہ ہے؟ واٹس ایپ سپورٹ ڈیسک سے رابطہ کریں
                </p>
              </div>
            </div>
            <a
              href={`https://wa.me/${waDigits}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-full bg-surface-container-lowest text-primary text-xs font-bold inline-flex items-center gap-1.5 shadow-xs"
            >
              <MessageCircle className="w-4 h-4" /> Chat on WhatsApp
            </a>
          </Card>
        </div>
      )}
    </OwnerShell>
  );
}

export function OwnerListing() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const data = useOwnerPortalData(30, id);
  const biz = data.activeBusiness;

  const handleSelect = (nextId: string) => {
    data.setSelectedId(nextId);
    if (id) {
      navigate(`/owner/listings/${nextId}`);
    }
  };

  return (
    <OwnerShell
      unreadCount={data.unreadCount}
      listings={data.listings}
      selectedId={data.selectedId}
      onSelect={handleSelect}
      loading={data.loading}
    >
      {biz && user ? (
        <ListingEditor
          business={biz}
          categories={data.categories}
          areas={data.areas}
          plans={data.plans}
          onSave={async (patch) => {
            await updateOwnerBusiness(biz.id, patch, user.id);
            await data.reload();
          }}
        />
      ) : (
        <Card className="p-6 text-center text-sm text-on-surface-variant">
          No business listing selected or assigned yet.
        </Card>
      )}
    </OwnerShell>
  );
}

export function OwnerOffers() {
  const data = useOwnerPortalData();
  const biz = data.activeBusiness;
  const effCode = biz ? effectivePlanCode(biz.plan_code, biz.plan_expires_at) : 'free';
  const plan = data.plans.find((p) => p.code === effCode) ?? null;

  return (
    <OwnerShell
      unreadCount={data.unreadCount}
      listings={data.listings}
      selectedId={data.selectedId}
      onSelect={data.setSelectedId}
      loading={data.loading}
    >
      {biz && (
        <OffersManager
          business={biz}
          offers={data.offers}
          plan={plan}
          onSaveOffer={async (offer) => {
            await upsertOffer(offer);
            await data.reload();
          }}
          onDeleteOffer={async (id) => {
            await deleteOffer(id);
            await data.reload();
          }}
        />
      )}
    </OwnerShell>
  );
}

export function OwnerReviews() {
  const data = useOwnerPortalData();
  const displayedReviews = data.activeBusiness
    ? data.reviews.filter((r) => r.business_id === data.activeBusiness?.id)
    : data.reviews;

  return (
    <OwnerShell
      unreadCount={data.unreadCount}
      listings={data.listings}
      selectedId={data.selectedId}
      onSelect={data.setSelectedId}
      loading={data.loading}
    >
      <ReviewsReply
        reviews={displayedReviews}
        onReply={async (id, text) => {
          await replyToReview(id, text);
          await data.reload();
        }}
      />
    </OwnerShell>
  );
}

export function OwnerInquiries() {
  const { user } = useAuth();
  const data = useOwnerPortalData();
  const displayedInquiries = data.activeBusiness
    ? data.inquiries.filter((i) => i.business_id === data.activeBusiness?.id)
    : data.inquiries;

  return (
    <OwnerShell
      unreadCount={data.unreadCount}
      listings={data.listings}
      selectedId={data.selectedId}
      onSelect={data.setSelectedId}
      loading={data.loading}
    >
      <InquiriesInbox
        inquiries={displayedInquiries}
        onStatusChange={async (id, status: InquiryStatus) => {
          await updateInquiryStatus(id, status, user?.id);
          await data.reload();
        }}
      />
    </OwnerShell>
  );
}

export function OwnerAnalyticsPage() {
  const [days, setDays] = useState<7 | 30 | 90>(30);
  const data = useOwnerPortalData(days);
  const biz = data.activeBusiness;
  return (
    <OwnerShell
      unreadCount={data.unreadCount}
      listings={data.listings}
      selectedId={data.selectedId}
      onSelect={data.setSelectedId}
      loading={data.loading}
    >
      {biz && data.stats && (
        <OwnerAnalytics
          stats={data.stats}
          isFullAnalytics={effectivePlanCode(biz.plan_code, biz.plan_expires_at) !== 'free'}
          days={days}
          onDaysChange={setDays}
        />
      )}
    </OwnerShell>
  );
}

export function OwnerPlan() {
  const { profile } = useAuth();
  const data = useOwnerPortalData();
  const biz = data.activeBusiness;
  return (
    <OwnerShell
      unreadCount={data.unreadCount}
      listings={data.listings}
      selectedId={data.selectedId}
      onSelect={data.setSelectedId}
      loading={data.loading}
    >
      {biz && (
        <PlanCard
          business={biz}
          plans={data.plans}
          ownerName={profile?.full_name}
          ownerPhone={profile?.phone}
        />
      )}
    </OwnerShell>
  );
}

export function OwnerProfile() {
  const { user, profile, isDemoMode, updateOwnProfile, updatePassword } = useAuth();
  const { showToast } = useToast();
  const data = useOwnerPortalData();

  const [fullName, setFullName] = useState(profile?.full_name ?? '');
  const [phone, setPhone] = useState(profile?.phone ?? '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    setFullName(profile?.full_name ?? '');
    setPhone(profile?.phone ?? '');
  }, [profile?.full_name, profile?.phone]);

  const strength = evaluatePasswordStrength(newPassword);

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateOwnProfile({ full_name: fullName, phone });
    showToast('Profile details updated!', 'success');
  };

  const changePass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      showToast('Password must be at least 8 characters.', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('New passwords do not match.', 'error');
      return;
    }
    const res = await updatePassword(newPassword);
    if (!res.ok) {
      showToast(res.error ?? 'Failed to update password.', 'error');
      return;
    }
    setNewPassword('');
    setConfirmPassword('');
    showToast(
      res.simulated || isDemoMode
        ? 'Preview Mode: local demo password check updated (no remote auth server).'
        : 'Password changed successfully!',
      'success'
    );
  };

  return (
    <OwnerShell
      unreadCount={data.unreadCount}
      listings={data.listings}
      selectedId={data.selectedId}
      onSelect={data.setSelectedId}
      loading={false}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Card className="p-5">
          <h2 className="text-base font-bold text-on-surface mb-4">Account Profile</h2>
          <form onSubmit={saveProfile} className="space-y-3">
            <Input label="Email" value={user?.email ?? ''} disabled dir="ltr" />
            <Input label="Full Name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
            <Input label="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} dir="ltr" />
            <Button type="submit">Save Profile</Button>
          </form>
        </Card>

        <Card className="p-5">
          <h2 className="text-base font-bold text-on-surface mb-4">Change Password</h2>
          <form onSubmit={changePass} className="space-y-3">
            <Input
              label="New Password (min 8 chars)"
              type="password"
              dir="ltr"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            {newPassword && (
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] font-bold">
                  <span className="text-on-surface-variant">Strength</span>
                  <span
                    className={
                      strength.score === 3
                        ? 'text-primary'
                        : strength.score === 2
                          ? 'text-secondary'
                          : 'text-error'
                    }
                  >
                    {strength.label}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-1 h-1.5">
                  {[1, 2, 3].map((b) => (
                    <div
                      key={b}
                      className={`rounded-full ${
                        strength.score >= b
                          ? strength.score === 3
                            ? 'bg-primary'
                            : strength.score === 2
                              ? 'bg-secondary-container'
                              : 'bg-error'
                          : 'bg-outline-variant/40'
                      }`}
                    />
                  ))}
                </div>
              </div>
            )}
            <Input
              label="Confirm New Password"
              type="password"
              dir="ltr"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            <Button type="submit" variant="outline">
              Update Password
            </Button>
          </form>
        </Card>
      </div>
    </OwnerShell>
  );
}

export function OwnerNotifications() {
  const { user } = useAuth();
  const data = useOwnerPortalData();
  return (
    <OwnerShell
      unreadCount={data.unreadCount}
      listings={data.listings}
      selectedId={data.selectedId}
      onSelect={data.setSelectedId}
      loading={data.loading}
    >
      <NotificationsList
        items={data.notifications}
        onMarkAllRead={async () => {
          if (!user) return;
          await markNotificationsRead(user.id);
          await data.reload();
        }}
      />
    </OwnerShell>
  );
}
