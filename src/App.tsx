import React, { Suspense, lazy, useEffect, useRef } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { ThemeProvider } from './lib/theme';
import { I18nProvider } from './lib/i18n';
import { AuthProvider } from './lib/auth';
import { RequireAuth, RequireRole } from './lib/permissions';
import { ToastProvider } from './components/ui/Toast';
import { ErrorBoundary, Skeleton } from './components/ui/Feedback';
import { restoreAdminRecoverySnapshot, saveAdminRecoverySnapshot } from './lib/adminRecovery';
import { canTrackSiteAnalytics, classifySiteAnalyticsPath, trackSiteAnalyticsEvent } from './lib/siteAnalytics';

const Home = lazy(() => import('./pages/Home').then((m) => ({ default: m.Home })));
const Search = lazy(() => import('./pages/Search').then((m) => ({ default: m.Search })));
const Categories = lazy(() => import('./pages/Categories').then((m) => ({ default: m.Categories })));
const CategoryDetail = lazy(() =>
  import('./pages/CategoryDetail').then((m) => ({ default: m.CategoryDetail }))
);
const AreaDetail = lazy(() => import('./pages/AreaDetail').then((m) => ({ default: m.AreaDetail })));
const BusinessProfile = lazy(() =>
  import('./pages/BusinessProfile').then((m) => ({ default: m.BusinessProfile }))
);
const OwnerPublicProfile = lazy(() =>
  import('./pages/OwnerPublicProfile').then((m) => ({ default: m.OwnerPublicProfile }))
);
const Offers = lazy(() => import('./pages/Offers').then((m) => ({ default: m.Offers })));
const AddBusiness = lazy(() =>
  import('./pages/AddBusiness').then((m) => ({ default: m.AddBusiness }))
);
const MapPage = lazy(() => import('./pages/Map').then((m) => ({ default: m.Map })));
const Favorites = lazy(() => import('./pages/Favorites').then((m) => ({ default: m.Favorites })));
const OfflineData = lazy(() => import('./pages/OfflineData').then((m) => ({ default: m.OfflineData })));
const Emergency = lazy(() => import('./pages/Emergency').then((m) => ({ default: m.Emergency })));
const GovernmentHelplines = lazy(() => import('./pages/Emergency').then((m) => ({ default: m.GovernmentHelplines })));
const LocalAuthorities = lazy(() => import('./pages/LocalAuthorities').then((m) => ({ default: m.LocalAuthorities })));
const AuthorityProfiles = lazy(() => import('./pages/AuthorityProfiles').then((m) => ({ default: m.AuthorityProfiles })));
const Announcements = lazy(() =>
  import('./pages/Announcements').then((m) => ({ default: m.Announcements }))
);
const News = lazy(() => import('./pages/News').then((m) => ({ default: m.News })));
const SdkJobs = lazy(() => import('./pages/SdkJobs').then((m) => ({ default: m.SdkJobs })));
const GovernmentJobs = lazy(() => import('./pages/GovernmentJobs').then((m) => ({ default: m.GovernmentJobs })));
const GovernmentSchemes = lazy(() => import('./pages/GovernmentSchemes').then((m) => ({ default: m.GovernmentSchemes })));
const StaticPage = lazy(() => import('./pages/StaticPage').then((m) => ({ default: m.StaticPage })));
const Login = lazy(() => import('./pages/Login').then((m) => ({ default: m.Login })));
const OwnerRegistration = lazy(() => import('./pages/OwnerRegistration').then((m) => ({ default: m.OwnerRegistration })));
const ForgotPassword = lazy(() =>
  import('./pages/ForgotPassword').then((m) => ({ default: m.ForgotPassword }))
);
const ResetPassword = lazy(() =>
  import('./pages/ResetPassword').then((m) => ({ default: m.ResetPassword }))
);
const ChangePassword = lazy(() =>
  import('./pages/ChangePassword').then((m) => ({ default: m.ChangePassword }))
);
const NotFound = lazy(() => import('./pages/NotFound').then((m) => ({ default: m.NotFound })));

const OwnerSdkJobs = lazy(() => import('./pages/owner/OwnerSdkJobs').then((m) => ({ default: m.OwnerSdkJobs })));

const OwnerBusinesses = lazy(() =>
  import('./pages/owner/OwnerPortalPages').then((m) => ({ default: m.OwnerBusinesses }))
);
const OwnerDashboard = lazy(() =>
  import('./pages/owner/OwnerPortalPages').then((m) => ({ default: m.OwnerDashboard }))
);
const OwnerListing = lazy(() =>
  import('./pages/owner/OwnerPortalPages').then((m) => ({ default: m.OwnerListing }))
);
const OwnerProducts = lazy(() =>
  import('./pages/owner/OwnerPortalPages').then((m) => ({ default: m.OwnerProducts }))
);
const OwnerOffers = lazy(() =>
  import('./pages/owner/OwnerPortalPages').then((m) => ({ default: m.OwnerOffers }))
);
const OwnerReviews = lazy(() =>
  import('./pages/owner/OwnerPortalPages').then((m) => ({ default: m.OwnerReviews }))
);
const OwnerInquiries = lazy(() =>
  import('./pages/owner/OwnerPortalPages').then((m) => ({ default: m.OwnerInquiries }))
);
const OwnerAnalyticsPage = lazy(() =>
  import('./pages/owner/OwnerPortalPages').then((m) => ({ default: m.OwnerAnalyticsPage }))
);
const OwnerPlan = lazy(() =>
  import('./pages/owner/OwnerPortalPages').then((m) => ({ default: m.OwnerPlan }))
);
const OwnerProfile = lazy(() =>
  import('./pages/owner/OwnerPortalPages').then((m) => ({ default: m.OwnerProfile }))
);
const OwnerNotifications = lazy(() =>
  import('./pages/owner/OwnerPortalPages').then((m) => ({ default: m.OwnerNotifications }))
);
const OwnerPublicProfileSettings = lazy(() =>
  import('./pages/owner/OwnerPortalPages').then((m) => ({ default: m.OwnerPublicProfileSettings }))
);

const AdminPortal = lazy(() =>
  import('./pages/admin/AdminPortal').then((m) => ({ default: m.AdminPortal }))
);


/**
 * Browser-level scroll persistence for the admin workspace.
 * This remains mounted while protected routes are checking the Supabase session,
 * so it can restore the user's position even after Chrome discards a background tab.
 */
function AdminScrollPersistence() {
  const location = useLocation();
  const restoredForPath = useRef<string | null>(null);
  const recoveredScrollY = useRef<number | null>(null);

  useEffect(() => {
    const path = location.pathname;
    if (!path.startsWith('/admin')) return;
    restoredForPath.current = null;
    recoveredScrollY.current = null;

    // localStorage is synchronous. Never serialize every admin field on every
    // keystroke/scroll frame: debounce routine drafts, but flush immediately when
    // the browser hides or unloads the document.
    const save = () => saveAdminRecoverySnapshot(path);
    let draftSaveTimer = 0;
    let scrollSaveTimer = 0;
    const scheduleDraftSave = () => {
      if (draftSaveTimer) window.clearTimeout(draftSaveTimer);
      draftSaveTimer = window.setTimeout(() => {
        draftSaveTimer = 0;
        save();
      }, 700);
    };
    const scheduleScrollSave = () => {
      if (scrollSaveTimer) return;
      scrollSaveTimer = window.setTimeout(() => {
        scrollSaveTimer = 0;
        save();
      }, 1200);
    };
    const flushSave = () => {
      if (draftSaveTimer) window.clearTimeout(draftSaveTimer);
      if (scrollSaveTimer) window.clearTimeout(scrollSaveTimer);
      draftSaveTimer = 0;
      scrollSaveTimer = 0;
      save();
    };
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') flushSave();
    };

    window.addEventListener('scroll', scheduleScrollSave, { passive: true });
    window.addEventListener('pagehide', flushSave);
    window.addEventListener('beforeunload', flushSave);
    document.addEventListener('visibilitychange', onVisibility);
    document.addEventListener('input', scheduleDraftSave, true);
    document.addEventListener('change', scheduleDraftSave, true);

    let restoreTimer = 0;
    let attemptsStartedAt = 0;
    const attemptRestore = () => {
      if (restoredForPath.current === path) return;
      const root = document.querySelector('[data-admin-scroll-ready="true"]');
      if (!root) return;

      if (recoveredScrollY.current === null) {
        recoveredScrollY.current = restoreAdminRecoverySnapshot(path);
      }
      const targetY = recoveredScrollY.current;
      if (targetY === null) {
        restoredForPath.current = path;
        return;
      }

      const maxScroll = Math.max(
        0,
        document.documentElement.scrollHeight - window.innerHeight,
        document.body.scrollHeight - window.innerHeight
      );
      const enoughHeight = maxScroll + 8 >= targetY;
      const timedOut = Date.now() - attemptsStartedAt > 15000;
      if (!enoughHeight && !timedOut) {
        restoreTimer = window.setTimeout(attemptRestore, 150);
        return;
      }

      window.scrollTo({ top: Math.min(targetY, maxScroll), left: 0, behavior: 'auto' });
      restoredForPath.current = path;
    };

    const startRestore = () => {
      if (restoredForPath.current === path || restoreTimer) return;
      attemptsStartedAt = Date.now();
      restoreTimer = window.setTimeout(() => {
        restoreTimer = 0;
        attemptRestore();
      }, 80);
    };

    const observer = new MutationObserver(startRestore);
    observer.observe(document.body, { childList: true, subtree: true });
    const resizeObserver = new ResizeObserver(startRestore);
    resizeObserver.observe(document.documentElement);
    window.addEventListener('pageshow', startRestore);
    startRestore();

    return () => {
      flushSave();
      if (draftSaveTimer) window.clearTimeout(draftSaveTimer);
      if (scrollSaveTimer) window.clearTimeout(scrollSaveTimer);
      if (restoreTimer) window.clearTimeout(restoreTimer);
      observer.disconnect();
      resizeObserver.disconnect();
      window.removeEventListener('scroll', scheduleScrollSave);
      window.removeEventListener('pagehide', flushSave);
      window.removeEventListener('beforeunload', flushSave);
      document.removeEventListener('visibilitychange', onVisibility);
      document.removeEventListener('input', scheduleDraftSave, true);
      document.removeEventListener('change', scheduleDraftSave, true);
      window.removeEventListener('pageshow', startRestore);
    };
  }, [location.pathname]);

  return null;
}

function ChunkLoadNotice() {
  const location = useLocation();
  const [hasChunkError, setHasChunkError] = React.useState(false);

  useEffect(() => {
    const onChunkError = () => setHasChunkError(true);
    window.addEventListener('hs:chunk-load-error', onChunkError);
    return () => window.removeEventListener('hs:chunk-load-error', onChunkError);
  }, []);

  if (!hasChunkError || !location.pathname.startsWith('/admin')) return null;

  return (
    <div role="alert" className="fixed bottom-4 inset-x-3 z-[1000] mx-auto max-w-xl rounded-2xl border border-amber-500/40 bg-surface p-4 shadow-2xl">
      <p className="text-sm font-bold text-on-surface">A new website version is available for one or more sections.</p>
      <p className="mt-1 text-xs text-on-surface-variant">Your current Admin page has not been reloaded. Save your work first. Refresh only when you choose.</p>
      <div className="mt-3 flex justify-end">
        <button type="button" onClick={() => window.location.reload()} className="rounded-xl bg-primary px-4 py-2 text-xs font-bold text-on-primary">Refresh manually</button>
      </div>
    </div>
  );
}

function RouteIndexing() {
  const location = useLocation();

  useEffect(() => {
    const path = location.pathname;
    const portalRoute = /^\/(?:admin|owner)(?:\/|$)/.test(path);
    const noIndexRoutes = new Set([
      '/search',
      '/favorites',
      '/add-business',
      '/login',
      '/owner-register',
      '/forgot-password',
      '/reset-password',
      '/change-password',
    ]);
    const publicStaticRoutes = new Set([
      '/',
      '/categories',
      '/offers',
      '/map',
      '/emergency',
      '/government-helplines',
      '/local-authorities',
      '/authority-profiles',
      '/announcements',
      '/news',
      '/government-jobs',
      '/sdk-jobs',
      '/government-schemes',
      '/about',
      '/advertise',
      '/contact',
      '/terms',
      '/privacy',
      '/listing-terms',
      '/refund-policy',
      '/faq',
    ]);
    const publicDynamicRoutes = [
      /^\/(?:category|area|business)\/[a-z0-9]+(?:-[a-z0-9]+)*$/,
      /^\/news\/[a-z0-9]+(?:-[a-z0-9]+)*$/,
      /^\/government-jobs\/[a-z0-9]+(?:-[a-z0-9]+)*$/,
      /^\/government-schemes\/[a-z0-9]+(?:-[a-z0-9]+)*$/,
      /^\/sdk-jobs\/[a-z0-9]+(?:-[a-z0-9]+)*$/,
      /^\/authority-profiles\/[a-z0-9]+(?:-[a-z0-9]+)*$/,
      /^\/owner-profile\/[0-9a-f-]{36}$/i,
    ];
    const knownPublicRoute = publicStaticRoutes.has(path) || publicDynamicRoutes.some((pattern) => pattern.test(path));
    const noIndex = portalRoute || noIndexRoutes.has(path) || !knownPublicRoute;
    let robots = document.querySelector('meta[name="robots"]') as HTMLMetaElement | null;
    if (!robots) {
      robots = document.createElement('meta');
      robots.name = 'robots';
      document.head.appendChild(robots);
    }
    robots.content = noIndex ? 'noindex,follow' : 'index,follow,max-image-preview:large';
  }, [location.pathname]);

  return null;
}


function SiteAnalyticsTracker() {
  const location = useLocation();

  useEffect(() => {
    const pagePath = location.pathname;
    if (!classifySiteAnalyticsPath(pagePath) || !canTrackSiteAnalytics()) return;

    trackSiteAnalyticsEvent('page_view', { pagePath });
    let activeSeconds = 0;
    let lastTick = Date.now();

    const flushActiveTime = () => {
      if (activeSeconds > 0) {
        trackSiteAnalyticsEvent('engagement', {
          pagePath,
          activeSeconds: Math.min(30, activeSeconds),
        });
        activeSeconds = 0;
      }
    };

    const timer = window.setInterval(() => {
      const now = Date.now();
      const elapsed = Math.min(5, Math.max(0, Math.floor((now - lastTick) / 1000)));
      lastTick = now;
      if (document.visibilityState === 'visible' && navigator.onLine) {
        activeSeconds += elapsed;
        if (activeSeconds >= 30) {
          trackSiteAnalyticsEvent('engagement', { pagePath, activeSeconds: 30 });
          activeSeconds -= 30;
        }
      }
    }, 5_000);

    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') flushActiveTime();
      lastTick = Date.now();
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      flushActiveTime();
    };
  }, [location.pathname]);

  return null;
}

function PageLoader() {
  return (
    <div className="min-h-screen bg-surface p-6 max-w-5xl mx-auto space-y-4">
      <Skeleton className="h-14 w-full rounded-2xl" />
      <Skeleton className="h-44 w-full rounded-2xl" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Skeleton className="h-36 rounded-2xl" />
        <Skeleton className="h-36 rounded-2xl" />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <I18nProvider>
          <AuthProvider>
            <ToastProvider>
              <BrowserRouter>
                <AdminScrollPersistence />
                <RouteIndexing />
                <SiteAnalyticsTracker />
                <ChunkLoadNotice />
                <Suspense fallback={<PageLoader />}>
                  <Routes>
                    {/* Public Visitor Routes */}
                    <Route path="/" element={<Home />} />
                    <Route path="/search" element={<Search />} />
                    <Route path="/categories" element={<Categories />} />
                    <Route path="/category/:slug" element={<CategoryDetail />} />
                    <Route path="/area/:slug" element={<AreaDetail />} />
                    <Route path="/business/:slug" element={<BusinessProfile />} />
                    <Route path="/owner-profile/:ownerId" element={<OwnerPublicProfile />} />
                    <Route path="/offers" element={<Offers />} />
                    <Route path="/add-business" element={<AddBusiness />} />
                    <Route path="/map" element={<MapPage />} />
                    <Route path="/favorites" element={<Favorites />} />
                    <Route path="/offline-data" element={<OfflineData />} />
                    <Route path="/emergency" element={<Emergency />} />
                    <Route path="/government-helplines" element={<GovernmentHelplines />} />
                    <Route path="/local-authorities" element={<LocalAuthorities />} />
                    <Route path="/authority-profiles" element={<AuthorityProfiles />} />
                    <Route path="/authority-profiles/:slug" element={<AuthorityProfiles />} />
                    <Route path="/announcements" element={<Announcements />} />
                    <Route path="/news" element={<News />} />
                    <Route path="/news/:slug" element={<News />} />
                    <Route path="/sdk-jobs" element={<SdkJobs />} />
                    <Route path="/sdk-jobs/:slug" element={<SdkJobs />} />
                    <Route path="/government-jobs" element={<GovernmentJobs />} />
                    <Route path="/government-jobs/:slug" element={<GovernmentJobs />} />
                    <Route path="/government-schemes" element={<GovernmentSchemes />} />
                    <Route path="/government-schemes/:slug" element={<GovernmentSchemes />} />

                    {/* Static Civic & Legal Pages */}
                    <Route path="/about" element={<StaticPage slug="about" />} />
                    <Route path="/advertise" element={<StaticPage slug="advertise" />} />
                    <Route path="/contact" element={<StaticPage slug="contact" />} />
                    <Route path="/terms" element={<StaticPage slug="terms" />} />
                    <Route path="/privacy" element={<StaticPage slug="privacy" />} />
                    <Route path="/listing-terms" element={<StaticPage slug="listing-terms" />} />
                    <Route path="/refund-policy" element={<StaticPage slug="refund-policy" />} />
                    <Route path="/faq" element={<StaticPage slug="faq" />} />

                    {/* Portal Auth Routes */}
                    <Route path="/login" element={<Login />} />
                    <Route path="/owner-register" element={<OwnerRegistration />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    <Route path="/reset-password" element={<ResetPassword />} />
                    <Route
                      path="/change-password"
                      element={
                        <RequireAuth>
                          <ChangePassword />
                        </RequireAuth>
                      }
                    />

                    {/* Owner Portal Routes */}
                    <Route
                      path="/owner/sdk-jobs"
                      element={
                        <RequireAuth>
                          <RequireRole roles={['owner']}>
                            <OwnerSdkJobs />
                          </RequireRole>
                        </RequireAuth>
                      }
                    />
                    <Route
                      path="/owner/businesses"
                      element={
                        <RequireAuth>
                          <RequireRole roles={['owner']}>
                            <OwnerBusinesses />
                          </RequireRole>
                        </RequireAuth>
                      }
                    />
                    <Route
                      path="/owner"
                      element={
                        <RequireAuth>
                          <RequireRole roles={['owner']}>
                            <OwnerDashboard />
                          </RequireRole>
                        </RequireAuth>
                      }
                    />
                    <Route
                      path="/owner/listing"
                      element={
                        <RequireAuth>
                          <RequireRole roles={['owner']}>
                            <OwnerListing />
                          </RequireRole>
                        </RequireAuth>
                      }
                    />
                    <Route
                      path="/owner/listings/:id"
                      element={
                        <RequireAuth>
                          <RequireRole roles={['owner']}>
                            <OwnerListing />
                          </RequireRole>
                        </RequireAuth>
                      }
                    />
                    <Route
                      path="/owner/products"
                      element={
                        <RequireAuth>
                          <RequireRole roles={['owner']}>
                            <OwnerProducts />
                          </RequireRole>
                        </RequireAuth>
                      }
                    />
                    <Route
                      path="/owner/offers"
                      element={
                        <RequireAuth>
                          <RequireRole roles={['owner']}>
                            <OwnerOffers />
                          </RequireRole>
                        </RequireAuth>
                      }
                    />
                    <Route
                      path="/owner/reviews"
                      element={
                        <RequireAuth>
                          <RequireRole roles={['owner']}>
                            <OwnerReviews />
                          </RequireRole>
                        </RequireAuth>
                      }
                    />
                    <Route
                      path="/owner/inquiries"
                      element={
                        <RequireAuth>
                          <RequireRole roles={['owner']}>
                            <OwnerInquiries />
                          </RequireRole>
                        </RequireAuth>
                      }
                    />
                    <Route
                      path="/owner/analytics"
                      element={
                        <RequireAuth>
                          <RequireRole roles={['owner']}>
                            <OwnerAnalyticsPage />
                          </RequireRole>
                        </RequireAuth>
                      }
                    />
                    <Route
                      path="/owner/plan"
                      element={
                        <RequireAuth>
                          <RequireRole roles={['owner']}>
                            <OwnerPlan />
                          </RequireRole>
                        </RequireAuth>
                      }
                    />
                    <Route
                      path="/owner/profile"
                      element={
                        <RequireAuth>
                          <RequireRole roles={['owner']}>
                            <OwnerProfile />
                          </RequireRole>
                        </RequireAuth>
                      }
                    />
                    <Route path="/owner/public-profile" element={<RequireAuth><RequireRole roles={['owner']}><OwnerPublicProfileSettings /></RequireRole></RequireAuth>} />
                    <Route
                      path="/owner/notifications"
                      element={
                        <RequireAuth>
                          <RequireRole roles={['owner']}>
                            <OwnerNotifications />
                          </RequireRole>
                        </RequireAuth>
                      }
                    />

                    {/* Admin & Staff Portal Routes */}
                    <Route path="/admin" element={<Navigate to="/admin/overview" replace />} />
                    <Route
                      path="/admin/:tab"
                      element={
                        <RequireAuth>
                          <RequireRole roles={['super_admin', 'staff']}>
                            <AdminPortal />
                          </RequireRole>
                        </RequireAuth>
                      }
                    />

                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Suspense>
              </BrowserRouter>
            </ToastProvider>
          </AuthProvider>
        </I18nProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
