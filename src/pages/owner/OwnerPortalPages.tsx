import React, { useCallback, useEffect, useRef, useState } from 'react';
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
  deleteBusinessProduct,
  deleteOffer,
  fetchAllAreas,
  fetchAllCategories,
  fetchBusinessOffers,
  fetchBusinessProducts,
  fetchNotifications,
  fetchUnreadNotificationCount,
  fetchOwnerDashboardStats,
  fetchOwnerPaymentHistory,
  submitOwnerPaymentCorrectionRequest,
  submitOwnerProfileChangeRequest,
  type OwnerPaymentHistory,
  type OwnerReviewReplyFilter,
  type OwnerInquiryStatusFilter,
  fetchOwnerInquiries,
  fetchOwnerInquiriesPage,
  fetchOwnerSubmissions,
  fetchOwnerSubmissionsPage,
  fetchOwnerSubmissionsAwaitingReviewCount,
  fetchOwnerPublicProfileBusinessIds,
  setOwnerPublicProfileBusinessIds,
  fetchOwnerListings,
  fetchOwnerReviews,
  fetchOwnerReviewsPage,
  fetchPlans,
  fetchPublicSiteSettings,
  markNotificationsRead,
  setNotificationRead,
  replyToReview,
  updateInquiryStatus,
  updateOwnerBusiness,
  upsertBusinessProduct,
  upsertOffer,
} from '../../lib/api';
import { daysUntil, formatDateShort } from '../../lib/format';
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
  ProductRow,
  ReviewRow,
  SubmissionRow,
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
  ProductCatalogueManager,
  OwnerAnalytics,
  PlanCard,
  ReviewsReply,
} from '../../components/owner/OwnerModules';
import { SparklineSvg } from '../../components/ui/Charts';
import { ImageWithFallback } from '../../components/ui/ImageWithFallback';
import { Badge, Card } from '../../components/ui/Surface';
import { Button } from '../../components/ui/Button';
import { Input, Textarea } from '../../components/ui/FormFields';
import { Skeleton } from '../../components/ui/Feedback';
import { useToast } from '../../components/ui/Toast';
import { DemoModeNotice } from '../../components/ui/DemoModeNotice';

interface OwnerPortalDataOptions {
  categories?: boolean; areas?: boolean; plans?: boolean; stats?: boolean;
  offers?: boolean; products?: boolean; reviews?: boolean; inquiries?: boolean;
  paginatedReviews?: boolean; paginatedInquiries?: boolean; submissions?: boolean; notifications?: boolean;
  profileBusinessIds?: boolean;
}
const OWNER_DASHBOARD_DATA: OwnerPortalDataOptions = { stats: true, offers: true, reviews: true, inquiries: true };
const OWNER_LISTING_DATA: OwnerPortalDataOptions = { categories: true, areas: true, plans: true, submissions: true };
const OWNER_PRODUCTS_DATA: OwnerPortalDataOptions = { products: true, submissions: true };
const OWNER_OFFERS_DATA: OwnerPortalDataOptions = { plans: true, offers: true, submissions: true };
const OWNER_REVIEWS_DATA: OwnerPortalDataOptions = { paginatedReviews: true };
const OWNER_INQUIRIES_DATA: OwnerPortalDataOptions = { paginatedInquiries: true };
const OWNER_ANALYTICS_DATA: OwnerPortalDataOptions = { stats: true };
const OWNER_PLAN_DATA: OwnerPortalDataOptions = { plans: true, submissions: true };
const OWNER_PUBLIC_PROFILE_DATA: OwnerPortalDataOptions = { profileBusinessIds: true };
const OWNER_NOTIFICATIONS_DATA: OwnerPortalDataOptions = { notifications: true };

function useOwnerPortalData(
  days = 30,
  routeListingId?: string,
  options: OwnerPortalDataOptions = {},
  reviewReplyFilter: OwnerReviewReplyFilter = 'all',
  inquiryStatusFilter: OwnerInquiryStatusFilter = 'all'
) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const includeCategories = options.categories === true;
  const includeAreas = options.areas === true;
  const includePlans = options.plans === true;
  const includeStats = options.stats === true;
  const includeOffers = options.offers === true;
  const includeProducts = options.products === true;
  const includeReviews = options.reviews === true;
  const includeInquiries = options.inquiries === true;
  const includePaginatedReviews = options.paginatedReviews === true;
  const includePaginatedInquiries = options.paginatedInquiries === true;
  const includeSubmissions = options.submissions === true;
  const includeProfileBusinessIds = options.profileBusinessIds === true;
  const includeNotifications = options.notifications === true;
  const [listings, setListings] = useState<BusinessPublicView[]>([]);
  const [selectedId, setSelectedId] = useState<string>(routeListingId ?? '');
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [areas, setAreas] = useState<AreaRow[]>([]);
  const [plans, setPlans] = useState<PlanRow[]>([]);
  const [stats, setStats] = useState<OwnerDashboardStats | null>(null);
  const [offers, setOffers] = useState<OfferRow[]>([]);
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [inquiries, setInquiries] = useState<InquiryRow[]>([]);
  const [reviewHasMore, setReviewHasMore] = useState(false);
  const [inquiryHasMore, setInquiryHasMore] = useState(false);
  const [reviewLoadingMore, setReviewLoadingMore] = useState(false);
  const [inquiryLoadingMore, setInquiryLoadingMore] = useState(false);
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [submissions, setSubmissions] = useState<SubmissionRow[]>([]);
  const [profileBusinessIds, setProfileBusinessIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const reviewOffsetRef = useRef(0);
  const inquiryOffsetRef = useRef(0);

  useEffect(() => {
    if (routeListingId && routeListingId !== selectedId) {
      setStats(null); setOffers([]); setProducts([]); setReviews([]); setInquiries([]);
      setSelectedId(routeListingId);
    }
  }, [routeListingId, selectedId]);

  const reloadSequenceRef = useRef(0);
  const reload = useCallback(async () => {
    const requestId = ++reloadSequenceRef.current;
    reviewOffsetRef.current = 0;
    inquiryOffsetRef.current = 0;
    setReviewLoadingMore(false); setInquiryLoadingMore(false);
    setReviewHasMore(false); setInquiryHasMore(false);
    setReviews([]); setInquiries([]);

    if (!user) {
      setListings([]); setSelectedId(''); setCategories([]); setAreas([]); setPlans([]);
      setStats(null); setOffers([]); setProducts([]); setNotifications([]);
      setSubmissions([]); setProfileBusinessIds([]); setUnreadCount(0); setLoading(false);
      return;
    }

    setLoading(true); setStats(null); setOffers([]); setProducts([]);
    try {
      const [owned, notificationData, cats, ar, pls, ownerRequests, profileSelection] = await Promise.all([
        fetchOwnerListings(user.id), includeNotifications ? fetchNotifications(user.id) : fetchUnreadNotificationCount(user.id),
        includeCategories ? fetchAllCategories() : Promise.resolve([]),
        includeAreas ? fetchAllAreas() : Promise.resolve([]),
        includePlans ? fetchPlans() : Promise.resolve([]),
        includeSubmissions ? fetchOwnerSubmissions(user.id) : Promise.resolve([]),
        includeProfileBusinessIds ? fetchOwnerPublicProfileBusinessIds(user.id) : Promise.resolve([]),
      ]);
      if (requestId !== reloadSequenceRef.current) return;
      const notificationRows = includeNotifications ? notificationData as NotificationRow[] : [];
      const nextUnreadCount = includeNotifications
        ? notificationRows.filter((notification) => !notification.is_read).length
        : notificationData as number;
      setListings(owned); setNotifications(notificationRows); setUnreadCount(nextUnreadCount); setCategories(cats); setAreas(ar);
      setPlans(pls); setSubmissions(ownerRequests); setProfileBusinessIds(profileSelection);

      let persistedId = '';
      try { persistedId = window.localStorage.getItem(`hs_owner_active_business_${user.id}`) ?? ''; } catch {}
      const preferredId =
        (routeListingId && owned.some((b) => b.id === routeListingId) ? routeListingId : '') ||
        (selectedId && owned.some((b) => b.id === selectedId) ? selectedId : '') ||
        (persistedId && owned.some((b) => b.id === persistedId) ? persistedId : '') ||
        owned[0]?.id || '';
      if (preferredId !== selectedId) setSelectedId(preferredId);
      if (!preferredId) { setReviews([]); setInquiries([]); setLoading(false); return; }

      const [st, offs, prods, revs, inqs, reviewPage, inquiryPage] = await Promise.all([
        includeStats ? fetchOwnerDashboardStats(preferredId, days) : Promise.resolve(null),
        includeOffers ? fetchBusinessOffers(preferredId) : Promise.resolve([]),
        includeProducts ? fetchBusinessProducts(preferredId) : Promise.resolve([]),
        includeReviews ? fetchOwnerReviews([preferredId]) : Promise.resolve([]),
        includeInquiries ? fetchOwnerInquiries([preferredId]) : Promise.resolve([]),
        includePaginatedReviews ? fetchOwnerReviewsPage(preferredId, 0, 20, reviewReplyFilter) : Promise.resolve({ items: [], hasMore: false }),
        includePaginatedInquiries ? fetchOwnerInquiriesPage(preferredId, 0, 20, inquiryStatusFilter) : Promise.resolve({ items: [], hasMore: false }),
      ]);
      if (requestId !== reloadSequenceRef.current) return;
      setStats(st); setOffers(offs); setProducts(prods);
      setReviews(includePaginatedReviews ? reviewPage.items : revs);
      setInquiries(includePaginatedInquiries ? inquiryPage.items : inqs);
      setReviewHasMore(includePaginatedReviews && reviewPage.hasMore);
      setInquiryHasMore(includePaginatedInquiries && inquiryPage.hasMore);
      reviewOffsetRef.current = reviewPage.items.length;
      inquiryOffsetRef.current = inquiryPage.items.length;
    } catch (error) {
      if (requestId === reloadSequenceRef.current) {
        showToast(error instanceof Error ? error.message : 'Owner portal data could not be loaded.', 'error');
      }
    } finally {
      if (requestId === reloadSequenceRef.current) setLoading(false);
    }
  }, [
    user, selectedId, routeListingId, days, showToast, includeCategories, includeAreas,
    includePlans, includeStats, includeOffers, includeProducts, includeReviews, includeInquiries,
    includePaginatedReviews, includePaginatedInquiries, includeSubmissions, includeProfileBusinessIds, includeNotifications,
    reviewReplyFilter, inquiryStatusFilter,
  ]);

  useEffect(() => {
    void reload();
    return () => { reloadSequenceRef.current += 1; };
  }, [reload]);

  useEffect(() => {
    if (!user || !selectedId || !listings.some((business) => business.id === selectedId)) return;
    try { window.localStorage.setItem(`hs_owner_active_business_${user.id}`, selectedId); } catch {}
  }, [user, selectedId, listings]);

  const selectBusiness = useCallback((nextId: string) => {
    if (nextId !== selectedId) {
      setStats(null); setOffers([]); setProducts([]); setReviews([]); setInquiries([]);
      setReviewHasMore(false); setInquiryHasMore(false);
      reviewOffsetRef.current = 0; inquiryOffsetRef.current = 0;
    }
    setSelectedId(nextId);
  }, [selectedId]);

  const loadMoreReviews = useCallback(async () => {
    if (!includePaginatedReviews || !selectedId || !reviewHasMore || reviewLoadingMore) return;
    const requestId = reloadSequenceRef.current;
    setReviewLoadingMore(true);
    try {
      const page = await fetchOwnerReviewsPage(selectedId, reviewOffsetRef.current, 20, reviewReplyFilter);
      if (requestId !== reloadSequenceRef.current) return;
      setReviews((current) => [...current, ...page.items]);
      reviewOffsetRef.current += page.items.length; setReviewHasMore(page.hasMore);
    } catch (error) {
      if (requestId === reloadSequenceRef.current) showToast(error instanceof Error ? error.message : 'More reviews could not be loaded.', 'error');
    } finally {
      if (requestId === reloadSequenceRef.current) setReviewLoadingMore(false);
    }
  }, [includePaginatedReviews, selectedId, reviewHasMore, reviewLoadingMore, reviewReplyFilter, showToast]);

  const loadMoreInquiries = useCallback(async () => {
    if (!includePaginatedInquiries || !selectedId || !inquiryHasMore || inquiryLoadingMore) return;
    const requestId = reloadSequenceRef.current;
    setInquiryLoadingMore(true);
    try {
      const page = await fetchOwnerInquiriesPage(selectedId, inquiryOffsetRef.current, 20, inquiryStatusFilter);
      if (requestId !== reloadSequenceRef.current) return;
      setInquiries((current) => [...current, ...page.items]);
      inquiryOffsetRef.current += page.items.length; setInquiryHasMore(page.hasMore);
    } catch (error) {
      if (requestId === reloadSequenceRef.current) showToast(error instanceof Error ? error.message : 'More inquiries could not be loaded.', 'error');
    } finally {
      if (requestId === reloadSequenceRef.current) setInquiryLoadingMore(false);
    }
  }, [includePaginatedInquiries, selectedId, inquiryHasMore, inquiryLoadingMore, inquiryStatusFilter, showToast]);

  const activeBusiness = listings.find((b) => b.id === selectedId) ?? listings[0] ?? null;
  return {
    listings, activeBusiness, selectedId, setSelectedId: selectBusiness, categories, areas, plans,
    stats, offers, products, reviews, inquiries, reviewHasMore, inquiryHasMore,
    reviewLoadingMore, inquiryLoadingMore, loadMoreReviews, loadMoreInquiries,
    notifications, submissions, profileBusinessIds, unreadCount, loading, reload,
  };
}
function OwnerShell({
  unreadCount,
  listings,
  selectedId,
  onSelect,
  loading,
  showSwitcher = true,
  children,
}: {
  unreadCount: number;
  listings: BusinessPublicView[];
  selectedId: string;
  onSelect: (id: string) => void;
  loading: boolean;
  showSwitcher?: boolean;
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
          {showSwitcher && listings.length > 1 && (
            <div className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-surface-container-lowest border border-outline-variant/40">
              <span className="text-xs font-bold text-on-surface-variant">Your Businesses ({listings.length})</span>
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

export function OwnerBusinesses() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [listings, setListings] = useState<BusinessPublicView[]>([]);
  const [requests, setRequests] = useState<SubmissionRow[]>([]);
  const [requestsAwaitingReviewCount, setRequestsAwaitingReviewCount] = useState(0);
  const [requestsHasMore, setRequestsHasMore] = useState(false);
  const [requestsLoadingMore, setRequestsLoadingMore] = useState(false);
  const requestOffsetRef = useRef(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let active = true;
    if (!user) {
      setRequestsAwaitingReviewCount(0);
      setLoading(false);
      return () => { active = false; };
    }
    setLoading(true);
    setRequestsAwaitingReviewCount(0);
    requestOffsetRef.current = 0;
    setRequestsHasMore(false);
    Promise.all([
      fetchOwnerListings(user.id),
      fetchOwnerSubmissionsPage(user.id, 0, 20),
      fetchNotifications(user.id),
      fetchOwnerSubmissionsAwaitingReviewCount(user.id),
    ]).then(([owned, requestPage, notifications, awaitingReviewCount]) => {
      if (!active) return;
      setListings(owned);
      setRequests(requestPage.items);
      setRequestsAwaitingReviewCount(awaitingReviewCount);
      setRequestsHasMore(requestPage.hasMore);
      requestOffsetRef.current = requestPage.items.length;
      setUnreadCount(notifications.filter((item) => !item.is_read).length);
    }).catch((error) => {
      if (active) {
        showToast(error instanceof Error ? error.message : 'Your business list could not be loaded.', 'error');
      }
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [user?.id, retry, showToast]);

  const loadMoreRequests = useCallback(async () => {
    if (!user || !requestsHasMore || requestsLoadingMore) return;
    setRequestsLoadingMore(true);
    try {
      const page = await fetchOwnerSubmissionsPage(user.id, requestOffsetRef.current, 20);
      setRequests((current) => {
        const existing = new Set(current.map((item) => item.id));
        return [...current, ...page.items.filter((item) => !existing.has(item.id))];
      });
      requestOffsetRef.current += page.items.length;
      setRequestsHasMore(page.hasMore);
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Older request history could not be loaded.', 'error');
    } finally {
      setRequestsLoadingMore(false);
    }
  }, [user, requestsHasMore, requestsLoadingMore, showToast]);

  const businessStatusVariant = (status: string): 'success' | 'warning' | 'danger' | 'neutral' => {
    if (status === 'published') return 'success';
    if (status === 'rejected' || status === 'suspended' || status === 'archived') return 'danger';
    if (status === 'pending_approval') return 'warning';
    return 'neutral';
  };

  const requestStatusVariant = (status: string): 'success' | 'warning' | 'danger' | 'neutral' => {
    if (status === 'done') return 'success';
    if (status === 'rejected') return 'danger';
    if (status === 'new') return 'warning';
    return 'neutral';
  };

  const requestTitle = (request: SubmissionRow) => {
    if (request.type === 'new_business') {
      const name = request.payload?.name_en;
      return typeof name === 'string' && name.trim() ? `New business: ${name}` : 'New business request';
    }
    if (request.type === 'claim') return 'Business ownership claim';
    if (request.type === 'plan_upgrade') {
      const planCode = request.payload?.requested_plan;
      return typeof planCode === 'string' ? `Plan upgrade request: ${planCode.toUpperCase()}` : 'Plan upgrade request';
    }
    return 'Owner request';
  };

  return (
    <OwnerShell
      unreadCount={unreadCount}
      listings={listings}
      selectedId=""
      onSelect={() => {}}
      loading={loading}
      showSwitcher={false}
    >
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-on-surface">My Businesses</h1>
            <p className="text-sm text-on-surface-variant">Manage every business connected to your owner account</p>
            <p className="font-urdu text-xs text-primary mt-1" dir="rtl">میرے کاروبار اور درخواستیں</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link to="/search" className="min-h-[40px] px-3.5 rounded-xl border border-outline-variant text-xs font-bold inline-flex items-center gap-1.5 hover:bg-surface-container-low">
              <Search className="w-4 h-4" /> Find & Claim
            </Link>
            <Link to="/add-business" className="min-h-[40px] px-3.5 rounded-xl bg-primary text-on-primary text-xs font-bold inline-flex items-center gap-1.5">
              <PlusCircle className="w-4 h-4" /> Add Business
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Card className="p-4">
            <p className="text-xs text-on-surface-variant">Businesses linked to you</p>
            <p className="text-2xl font-extrabold text-on-surface tabular-nums">{listings.length}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-on-surface-variant">Requests awaiting review</p>
            <p className="text-2xl font-extrabold text-on-surface tabular-nums">{requestsAwaitingReviewCount}</p>
          </Card>
        </div>

        <section className="space-y-3">
          <h2 className="text-base font-bold text-on-surface">Your Business Listings</h2>
          {listings.length === 0 ? (
            <Card className="p-6 text-center space-y-3">
              <Store className="w-9 h-9 mx-auto text-primary" />
              <p className="text-sm font-semibold text-on-surface">No approved or linked businesses yet</p>
              <p className="text-xs text-on-surface-variant">Add a new business or claim an existing Sadiqabad listing. It will appear here after Admin approval.</p>
              <div className="flex justify-center flex-wrap gap-2">
                <Link to="/add-business"><Button size="sm">Add Business</Button></Link>
                <Link to="/search"><Button size="sm" variant="outline">Find a Listing</Button></Link>
              </div>
            </Card>
          ) : (
            <div className="space-y-3">
              {listings.map((business) => (
                <Card key={business.id} className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="w-14 h-14 rounded-xl overflow-hidden bg-surface-container-low shrink-0">
                    <ImageWithFallback src={business.logo_url ?? ''} alt={business.name_en} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-bold text-sm text-on-surface">{business.name_en}</h3>
                      <Badge variant={businessStatusVariant(business.status)}>{business.status.replaceAll('_', ' ')}</Badge>
                      <Badge variant="neutral">{effectivePlanCode(business.plan_code, business.plan_expires_at).toUpperCase()}</Badge>
                    </div>
                    {business.name_ur && <p className="font-urdu text-xs text-primary" dir="rtl">{business.name_ur}</p>}
                    <p className="text-xs text-on-surface-variant">{business.category?.name_en ?? 'Uncategorized'} · {business.area?.name_en ?? 'Sadiqabad'}</p>
                    <p className="text-[11px] text-outline">Updated {formatDateShort(business.updated_at)}</p>
                  </div>
                  <div className="flex flex-wrap gap-2 sm:justify-end">
                    <Link to={`/owner/listings/${business.id}`}><Button size="sm" variant="outline"><Edit3 className="w-3.5 h-3.5" /> Edit</Button></Link>
                    {business.status === 'published' && <Link to={`/business/${business.slug}`}><Button size="sm" variant="ghost"><ExternalLink className="w-3.5 h-3.5" /> View</Button></Link>}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </section>

        <section className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-base font-bold text-on-surface">My Requests & Approval History</h2>
            <span className="text-xs text-on-surface-variant">Showing {requests.length} requests</span>
          </div>
          {requests.length === 0 ? (
            <Card className="p-5 text-sm text-on-surface-variant">You have not submitted any business, claim, or plan requests yet.</Card>
          ) : (
            <div className="space-y-2">
              {requests.map((request) => (
                <Card key={request.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="min-w-0 space-y-1">
                    <p className="text-sm font-bold text-on-surface">{requestTitle(request)}</p>
                    <p className="text-[11px] text-on-surface-variant">Submitted {formatDateShort(request.created_at)}</p>
                    {request.status === 'done' && request.type === 'new_business' && <p className="text-xs text-tertiary">Approved — your business should now appear in the listings above.</p>}
                    {request.status === 'done' && request.type === 'claim' && <p className="text-xs text-tertiary">Approved — the claimed business is now linked to your account.</p>}
                    {request.status === 'rejected' && <p className="text-xs text-danger">This request was not approved. Please contact the Hello Sadiqabad team for guidance.</p>}
                  </div>
                  <Badge variant={requestStatusVariant(request.status)}>{request.status === 'new' ? 'Pending review' : request.status === 'done' ? 'Approved' : request.status.replaceAll('_', ' ')}</Badge>
                </Card>
              ))}
            </div>
          )}
          {requestsHasMore && (
            <div className="flex justify-center pt-2">
              <Button size="sm" variant="outline" loading={requestsLoadingMore} disabled={requestsLoadingMore} onClick={() => void loadMoreRequests()}>
                Load older requests
              </Button>
            </div>
          )}
        </section>
        <div className="flex justify-end">
          <Button size="sm" variant="ghost" onClick={() => setRetry((value) => value + 1)}>Refresh status</Button>
        </div>
      </div>
    </OwnerShell>
  );
}

export function OwnerDashboard() {
  const { profile } = useAuth();
  const data = useOwnerPortalData(30, undefined, OWNER_DASHBOARD_DATA);
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
                  to="/add-business"
                  className="min-h-[40px] px-3.5 rounded-xl border border-primary/40 text-primary text-xs font-bold inline-flex items-center gap-1.5 hover:bg-primary/5"
                >
                  <PlusCircle className="w-3.5 h-3.5" /> Add Another Business
                </Link>
                <Link
                  to="/owner/businesses"
                  className="min-h-[40px] px-3.5 rounded-xl border border-outline-variant text-xs font-bold inline-flex items-center gap-1.5 hover:bg-surface-container-low"
                >
                  <Store className="w-3.5 h-3.5" /> Manage All Businesses
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
  const data = useOwnerPortalData(30, id, OWNER_LISTING_DATA);
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
        <>
          {data.submissions.filter((request) => request.type === 'owner_service' && request.business_id === biz.id && (request.status === 'new' || request.status === 'in_review')).map((request) => <Card key={request.id} className="p-3 border border-secondary/40 bg-secondary-container/20 text-sm"><p className="font-bold text-on-surface">Service changes awaiting Admin approval</p><p className="text-xs text-on-surface-variant mt-1">Your submitted services will appear publicly after approval.</p></Card>)}
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
        </>
      ) : (
        <Card className="p-6 text-center text-sm text-on-surface-variant">
          No business listing selected or assigned yet.
        </Card>
      )}
    </OwnerShell>
  );
}

export function OwnerProducts() {
  const data = useOwnerPortalData(30, undefined, OWNER_PRODUCTS_DATA);
  const business = data.activeBusiness;

  return (
    <OwnerShell
      unreadCount={data.unreadCount}
      listings={data.listings}
      selectedId={data.selectedId}
      onSelect={data.setSelectedId}
      loading={data.loading}
    >
      {business ? (
        <ProductCatalogueManager
          business={business}
          products={data.products}
          requests={data.submissions}
          onSave={async (product) => {
            await upsertBusinessProduct(product);
            await data.reload();
          }}
          onDelete={async (id) => {
            await deleteBusinessProduct(id);
            await data.reload();
          }}
        />
      ) : (
        <Card className="p-6 text-center text-sm text-on-surface-variant">
          Add or claim a business listing before managing products.
        </Card>
      )}
    </OwnerShell>
  );
}

export function OwnerOffers() {
  const data = useOwnerPortalData(30, undefined, OWNER_OFFERS_DATA);
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
          requests={data.submissions}
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
  const [replyFilter, setReplyFilter] = useState<OwnerReviewReplyFilter>('all');
  const data = useOwnerPortalData(30, undefined, OWNER_REVIEWS_DATA, replyFilter);
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
        replyFilter={replyFilter}
        onReplyFilterChange={setReplyFilter}
        hasMore={data.reviewHasMore}
        loadingMore={data.reviewLoadingMore}
        onLoadMore={data.loadMoreReviews}
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
  const [statusFilter, setStatusFilter] = useState<OwnerInquiryStatusFilter>('all');
  const data = useOwnerPortalData(30, undefined, OWNER_INQUIRIES_DATA, 'all', statusFilter);
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
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        hasMore={data.inquiryHasMore}
        loadingMore={data.inquiryLoadingMore}
        onLoadMore={data.loadMoreInquiries}
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
  const data = useOwnerPortalData(days, undefined, OWNER_ANALYTICS_DATA);
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
  const data = useOwnerPortalData(30, undefined, OWNER_PLAN_DATA);
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
        <PlanCard business={biz} plans={data.plans} requests={data.submissions} onReload={data.reload} />
      )}
    </OwnerShell>
  );
}


export function OwnerPayments() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [unreadCount, setUnreadCount] = useState(0);
  useEffect(() => {
    let active = true;
    if (!user) {
      setUnreadCount(0);
      return () => { active = false; };
    }
    void fetchUnreadNotificationCount(user.id)
      .then((count) => { if (active) setUnreadCount(count); })
      .catch(() => { if (active) setUnreadCount(0); });
    return () => { active = false; };
  }, [user]);
  const [history, setHistory] = useState<OwnerPaymentHistory | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [activeReceipt, setActiveReceipt] = useState<string | null>(null);
  const [requestedAmount, setRequestedAmount] = useState('');
  const [reason, setReason] = useState('');
  const [evidenceReference, setEvidenceReference] = useState('');
  const [saving, setSaving] = useState(false);
  const historyRequestSequence = useRef(0);
  const correctionInFlight = useRef(false);
  const reload = useCallback(async () => {
    const requestId = ++historyRequestSequence.current;
    setLoading(true);
    setLoadError(null);
    try {
      const nextHistory = await fetchOwnerPaymentHistory();
      if (requestId === historyRequestSequence.current) setHistory(nextHistory);
    } catch (error) {
      if (requestId === historyRequestSequence.current) {
        setLoadError(error instanceof Error ? error.message : 'Payment history could not be loaded.');
      }
    } finally {
      if (requestId === historyRequestSequence.current) setLoading(false);
    }
  }, []);
  useEffect(() => {
    void reload();
    return () => { historyRequestSequence.current += 1; };
  }, [reload]);
  const money = (value: number) => 'Rs. ' + Number(value || 0).toLocaleString('en-PK');
  const submitCorrection = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!activeReceipt || correctionInFlight.current) return;
    const amount = Number(requestedAmount);
    if (!Number.isFinite(amount) || amount < 0 || reason.trim().length < 10) {
      showToast('Corrected amount aur kam az kam 10 characters ki reason darj karein.', 'error');
      return;
    }
    correctionInFlight.current = true;
    setSaving(true);
    try {
      await submitOwnerPaymentCorrectionRequest({ receiptId: activeReceipt, requestedAmountPkr: amount, reason, evidenceReference });
      showToast('Correction request Admin ko bhej di gayi. Receipt abhi change nahi hui.', 'success');
      setActiveReceipt(null);
      await reload();
    } catch (error) { showToast(error instanceof Error ? error.message : 'Correction request submit nahi ho saki.', 'error'); }
    finally { correctionInFlight.current = false; setSaving(false); }
  };
  return (
    <OwnerShell unreadCount={unreadCount} listings={[]} selectedId="" onSelect={() => {}} loading={loading && !history} showSwitcher={false}>
      <div className="space-y-5">
        <div><h1 className="text-xl sm:text-2xl font-extrabold text-on-surface">My Payments</h1><p className="text-sm text-on-surface-variant">Your read-only payment history across all linked businesses. Only Admin can change financial records.</p></div>
        {loadError && <Card className="p-4 border border-error/40 space-y-2"><p className="text-sm text-error">{loadError}</p><Button size="sm" variant="outline" disabled={loading} onClick={() => void reload()}>{loading ? 'Retrying…' : 'Retry loading payment history'}</Button></Card>}
        {history && <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            ['Businesses', String(history.business_count)],
            ['Paid', money(history.paid_pkr)],
            ['Outstanding', money(history.outstanding_pkr)],
            ['Active paid plans', String(history.active_paid_plans)],
          ].map(([label, value]) => <Card key={label} className="p-4"><p className="text-xs text-on-surface-variant">{label}</p><p className="text-lg font-extrabold text-on-surface tabular-nums">{value}</p></Card>)}
        </div>}
        <section className="space-y-3">
          <h2 className="font-bold text-on-surface">Receipts</h2>
          {!history ? (loadError ? null : <Card className="p-5 text-sm text-on-surface-variant">Loading payment history…</Card>) : !history.receipts.length ? <Card className="p-5 text-sm text-on-surface-variant">No payment receipts are recorded for your account yet.</Card> : history.receipts.map((receipt) => {
            const pending = history.payment_correction_requests.some((item) => item.receipt_id === receipt.receipt_id && item.status === 'pending');
            return <Card key={receipt.receipt_id} className="p-4 space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div><p className="font-bold text-sm text-on-surface">{receipt.business_name}</p><p className="text-xs text-on-surface-variant">{receipt.plan_code.toUpperCase()} · {formatDateShort(receipt.received_at)} · {receipt.payment_method.replaceAll('_', ' ')}</p>{receipt.transaction_reference && <p className="text-xs text-on-surface-variant">Reference: {receipt.transaction_reference}</p>}</div>
                <div className="text-right"><p className="font-extrabold text-on-surface tabular-nums">{money(receipt.amount_pkr)}</p>{receipt.adjustment_total_pkr !== 0 && <p className="text-[11px] text-on-surface-variant">Original {money(receipt.original_amount_pkr)} · adjustment {money(receipt.adjustment_total_pkr)}</p>}</div>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2"><span className="text-[11px] text-on-surface-variant">Period: {receipt.period_start ? formatDateShort(receipt.period_start) : '—'} to {receipt.period_end ? formatDateShort(receipt.period_end) : '—'}</span><Button size="sm" variant="outline" disabled={pending || saving} onClick={() => { setActiveReceipt(receipt.receipt_id); setRequestedAmount(String(receipt.amount_pkr)); setReason(''); setEvidenceReference(''); }}>{pending ? 'Correction pending' : 'Request correction'}</Button></div>
              {activeReceipt === receipt.receipt_id && <form onSubmit={submitCorrection} className="border-t border-outline-variant/40 pt-3 space-y-3">
                <p className="text-xs text-on-surface-variant">Receipt will remain unchanged unless Admin approves. Enter 0 only if you believe the receipt should be reversed.</p>
                <Input label="Correct amount (PKR)" type="number" min="0" step="0.01" value={requestedAmount} onChange={(event) => setRequestedAmount(event.target.value)} required />
                <Textarea label="Reason for correction" value={reason} onChange={(event) => setReason(event.target.value)} rows={3} required />
                <Input label="Evidence / transaction reference (optional)" value={evidenceReference} onChange={(event) => setEvidenceReference(event.target.value)} />
                <div className="flex justify-end gap-2"><Button type="button" variant="outline" disabled={saving} onClick={() => setActiveReceipt(null)}>Cancel</Button><Button type="submit" disabled={saving}>{saving ? 'Submitting…' : 'Submit request'}</Button></div>
              </form>}
            </Card>;
          })}
        </section>
        <section className="space-y-3"><h2 className="font-bold text-on-surface">Correction request history</h2>
          {!history ? null : !history.payment_correction_requests.length ? <Card className="p-4 text-sm text-on-surface-variant">No correction requests submitted.</Card> : history.payment_correction_requests.map((request) => <Card key={request.id} className="p-4 space-y-1"><div className="flex items-center justify-between gap-2"><p className="text-sm font-bold text-on-surface">Requested amount: {money(request.requested_amount_pkr)}</p><Badge variant={request.status === 'approved' ? 'success' : request.status === 'rejected' ? 'danger' : 'warning'}>{request.status}</Badge></div><p className="text-xs text-on-surface-variant">{request.reason}</p>{request.admin_response && <p className="text-xs text-on-surface-variant">Admin: {request.admin_response}</p>}</Card>)}
        </section>
        <div className="flex justify-end"><Button size="sm" variant="ghost" disabled={loading || saving} onClick={() => void reload()}>{loading ? 'Refreshing…' : 'Refresh history'}</Button></div>
      </div>
    </OwnerShell>
  );
}

export function OwnerProfile() {
  const { user, profile, isDemoMode, updatePassword } = useAuth();
  const { showToast } = useToast();
  const data = useOwnerPortalData();

  const [fullName, setFullName] = useState(profile?.full_name ?? '');
  const [phone, setPhone] = useState(profile?.phone ?? '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [profileReason, setProfileReason] = useState('');
  const [profileHistory, setProfileHistory] = useState<OwnerPaymentHistory | null>(null);
  const [profileHistoryLoading, setProfileHistoryLoading] = useState(true);
  const [profileHistoryError, setProfileHistoryError] = useState<string | null>(null);
  const [profileSaving, setProfileSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const profileHistorySequence = useRef(0);
  const profileSaveInFlight = useRef(false);
  const passwordChangeInFlight = useRef(false);
  const pendingProfileRequest = profileHistory?.profile_change_requests.find((request) => request.status === 'pending');

  useEffect(() => {
    setFullName(profile?.full_name ?? '');
    setPhone(profile?.phone ?? '');
  }, [profile?.full_name, profile?.phone]);

  const reloadProfileHistory = useCallback(async () => {
    const requestId = ++profileHistorySequence.current;
    setProfileHistoryLoading(true);
    setProfileHistoryError(null);
    try {
      const nextHistory = await fetchOwnerPaymentHistory();
      if (requestId === profileHistorySequence.current) setProfileHistory(nextHistory);
    } catch (error) {
      if (requestId === profileHistorySequence.current) {
        setProfileHistoryError(error instanceof Error ? error.message : 'Profile request history could not be loaded.');
      }
    } finally {
      if (requestId === profileHistorySequence.current) setProfileHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    void reloadProfileHistory();
    return () => { profileHistorySequence.current += 1; };
  }, [reloadProfileHistory]);

  const strength = evaluatePasswordStrength(newPassword);

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (profileSaveInFlight.current || profileHistoryLoading || profileHistoryError || !profileHistory) return;
    if (pendingProfileRequest) { showToast('A profile change request is already awaiting Admin review.', 'error'); return; }
    if (profileReason.trim().length < 10) { showToast('Please explain the reason in at least 10 characters.', 'error'); return; }
    profileSaveInFlight.current = true;
    setProfileSaving(true);
    try {
      await submitOwnerProfileChangeRequest({ fullName, phone, reason: profileReason });
      setProfileReason('');
      await reloadProfileHistory();
      showToast('Profile change request Admin ko bhej di gayi hai. Approval ke baad details update hongi.', 'success');
    } catch (error) { showToast(error instanceof Error ? error.message : 'Profile change request submit nahi ho saki.', 'error'); }
    finally { profileSaveInFlight.current = false; setProfileSaving(false); }
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
    if (passwordChangeInFlight.current) return;
    passwordChangeInFlight.current = true;
    setPasswordSaving(true);
    try {
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
    } finally {
      passwordChangeInFlight.current = false;
      setPasswordSaving(false);
    }
  };

  return (
    <OwnerShell
      unreadCount={data.unreadCount}
      listings={data.listings}
      selectedId={data.selectedId}
      onSelect={data.setSelectedId}
      loading={data.loading}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Card className="p-5">
          <h2 className="text-base font-bold text-on-surface mb-4">Account Profile</h2>
          <form onSubmit={saveProfile} className="space-y-3">
            <Input label="Email" value={user?.email ?? ''} disabled dir="ltr" />
            <Input label="Full Name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
            <Input label="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} dir="ltr" />
            <Textarea label="Reason for change" value={profileReason} onChange={(e) => setProfileReason(e.target.value)} rows={2} required />
            {profileHistoryLoading && <p className="text-xs text-on-surface-variant">Loading profile request history…</p>}
            {profileHistoryError && <div className="rounded-xl border border-error/40 p-3 space-y-2"><p className="text-xs text-error">{profileHistoryError}</p><Button type="button" size="sm" variant="outline" disabled={profileHistoryLoading} onClick={() => void reloadProfileHistory()}>Retry request history</Button></div>}
            <Button type="submit" disabled={Boolean(pendingProfileRequest) || profileSaving || profileHistoryLoading || Boolean(profileHistoryError) || !profileHistory}>{profileSaving ? 'Submitting…' : 'Request Admin Approval'}</Button>
            {pendingProfileRequest && <p className="text-xs text-amber-700">A profile change request is pending Admin review.</p>}
            {profileHistory?.profile_change_requests.slice(0, 3).map((request) => <p key={request.id} className="text-xs text-on-surface-variant">{request.status.toUpperCase()}: {request.admin_response || request.reason}</p>)}
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
            <Button type="submit" variant="outline" disabled={passwordSaving}>
              {passwordSaving ? 'Updating…' : 'Update Password'}
            </Button>
          </form>
        </Card>
      </div>
    </OwnerShell>
  );
}

export function OwnerPublicProfileSettings() {
  const data = useOwnerPortalData(30, undefined, OWNER_PUBLIC_PROFILE_DATA); const { user } = useAuth(); const { showToast } = useToast();
  const [selectedIds, setSelectedIds] = useState<string[]>([]); const [saving, setSaving] = useState(false);
  useEffect(() => { setSelectedIds(data.profileBusinessIds); }, [data.profileBusinessIds]);
  const publishedListings = data.listings.filter((business) => business.status === 'published');
  const toggleBusiness = (id: string) => setSelectedIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current,id]);
  const saveSelection = async () => { if (!user) return; setSaving(true); try { await setOwnerPublicProfileBusinessIds(selectedIds); await data.reload(); showToast('Public profile business selection saved.','success'); } catch (error) { showToast(error instanceof Error ? error.message : 'Business selection could not be saved.','error'); } finally { setSaving(false); } };
  return <OwnerShell unreadCount={data.unreadCount} listings={data.listings} selectedId={data.selectedId} onSelect={data.setSelectedId} loading={data.loading} showSwitcher={false}>
    <Card className="p-5 sm:p-6 space-y-4">
      <div><h1 className="text-lg font-bold text-on-surface">Public Owner Profile — My Businesses</h1><p className="text-sm text-on-surface-variant mt-1">Choose which of your published businesses should appear on your public owner profile. Unselected businesses remain in the public directory but will not be listed on your owner profile.</p><p className="font-urdu text-xs text-primary mt-2" dir="rtl">اپنی پبلک اونر پروفائل پر دکھانے کے لیے اپنے شائع شدہ کاروبار منتخب کریں۔</p></div>
      {publishedListings.length===0 ? <p className="rounded-xl bg-surface-container-low p-4 text-sm text-on-surface-variant">You do not have any published businesses to select yet.</p> : <div className="space-y-2">{publishedListings.map((business)=><label key={business.id} className="flex items-start gap-3 rounded-xl border border-outline-variant/40 p-3 cursor-pointer hover:border-primary/50"><input type="checkbox" checked={selectedIds.includes(business.id)} onChange={()=>toggleBusiness(business.id)} className="mt-1 w-4 h-4 accent-primary"/><span className="min-w-0"><span className="block text-sm font-bold text-on-surface">{business.name_en}</span>{business.name_ur&&<span className="block text-xs font-urdu text-primary" dir="rtl">{business.name_ur}</span>}<span className="block text-xs text-on-surface-variant mt-1">{business.category?.name_en??'Business'} · {business.area?.name_en??'Sadiqabad'}</span></span></label>)}</div>}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-outline-variant/30 pt-3"><span className="text-xs text-on-surface-variant">{selectedIds.length} business(es) selected · maximum 50</span><Button onClick={saveSelection} loading={saving} disabled={selectedIds.length>50}>Save Selection</Button></div>
      <p className="text-xs text-on-surface-variant">Your Admin must also enable your public owner profile before visitors can see it. This selection does not change your business listing visibility.</p>
    </Card>
  </OwnerShell>;
}

export function OwnerNotifications() {
  const { user } = useAuth();
  const data = useOwnerPortalData(30, undefined, OWNER_NOTIFICATIONS_DATA);
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
          if (!user) throw new Error('Please sign in again.');
          await markNotificationsRead(user.id);
          await data.reload();
        }}
        onSetRead={async (notificationId, isRead) => {
          if (!user) throw new Error('Please sign in again.');
          await setNotificationRead(user.id, notificationId, isRead);
          await data.reload();
        }}
      />
    </OwnerShell>
  );
}
