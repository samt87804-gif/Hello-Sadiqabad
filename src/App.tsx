import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ThemeProvider } from './lib/theme';
import { I18nProvider } from './lib/i18n';
import { AuthProvider } from './lib/auth';
import { RequireAuth, RequireRole } from './lib/permissions';
import { ToastProvider } from './components/ui/Toast';
import { ErrorBoundary, Skeleton } from './components/ui/Feedback';
import { supabaseConfig } from './lib/supabase';

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
const Offers = lazy(() => import('./pages/Offers').then((m) => ({ default: m.Offers })));
const AddBusiness = lazy(() =>
  import('./pages/AddBusiness').then((m) => ({ default: m.AddBusiness }))
);
const MapPage = lazy(() => import('./pages/Map').then((m) => ({ default: m.Map })));
const Favorites = lazy(() => import('./pages/Favorites').then((m) => ({ default: m.Favorites })));
const Emergency = lazy(() => import('./pages/Emergency').then((m) => ({ default: m.Emergency })));
const Announcements = lazy(() =>
  import('./pages/Announcements').then((m) => ({ default: m.Announcements }))
);
const StaticPage = lazy(() => import('./pages/StaticPage').then((m) => ({ default: m.StaticPage })));
const Login = lazy(() => import('./pages/Login').then((m) => ({ default: m.Login })));
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

const OwnerDashboard = lazy(() =>
  import('./pages/owner/OwnerPortalPages').then((m) => ({ default: m.OwnerDashboard }))
);
const OwnerListing = lazy(() =>
  import('./pages/owner/OwnerPortalPages').then((m) => ({ default: m.OwnerListing }))
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

const AdminPortal = lazy(() =>
  import('./pages/admin/AdminPortal').then((m) => ({ default: m.AdminPortal }))
);

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
  if (supabaseConfig.isProductionBuild && !supabaseConfig.isConfigured) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-background px-6 py-12 text-foreground">
        <section className="max-w-md text-center">
          <h1 className="text-3xl font-bold">Hello Sadiqabad</h1>
          <p className="mt-4 text-muted-foreground">We are completing the production configuration. Please check back shortly.</p>
        </section>
      </main>
    );
  }
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <I18nProvider>
          <AuthProvider>
            <ToastProvider>
              <BrowserRouter>
                <Suspense fallback={<PageLoader />}>
                  <Routes>
                    {/* Public Visitor Routes */}
                    <Route path="/" element={<Home />} />
                    <Route path="/search" element={<Search />} />
                    <Route path="/categories" element={<Categories />} />
                    <Route path="/category/:slug" element={<CategoryDetail />} />
                    <Route path="/area/:slug" element={<AreaDetail />} />
                    <Route path="/business/:slug" element={<BusinessProfile />} />
                    <Route path="/offers" element={<Offers />} />
                    <Route path="/add-business" element={<AddBusiness />} />
                    <Route path="/map" element={<MapPage />} />
                    <Route path="/favorites" element={<Favorites />} />
                    <Route path="/emergency" element={<Emergency />} />
                    <Route path="/announcements" element={<Announcements />} />

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
                      path="/owner"
                      element={
                        <RequireAuth>
                          <RequireRole roles={['owner', 'staff', 'super_admin']}>
                            <OwnerDashboard />
                          </RequireRole>
                        </RequireAuth>
                      }
                    />
                    <Route
                      path="/owner/listing"
                      element={
                        <RequireAuth>
                          <RequireRole roles={['owner', 'staff', 'super_admin']}>
                            <OwnerListing />
                          </RequireRole>
                        </RequireAuth>
                      }
                    />
                    <Route
                      path="/owner/listings/:id"
                      element={
                        <RequireAuth>
                          <RequireRole roles={['owner', 'staff', 'super_admin']}>
                            <OwnerListing />
                          </RequireRole>
                        </RequireAuth>
                      }
                    />
                    <Route
                      path="/owner/offers"
                      element={
                        <RequireAuth>
                          <RequireRole roles={['owner', 'staff', 'super_admin']}>
                            <OwnerOffers />
                          </RequireRole>
                        </RequireAuth>
                      }
                    />
                    <Route
                      path="/owner/reviews"
                      element={
                        <RequireAuth>
                          <RequireRole roles={['owner', 'staff', 'super_admin']}>
                            <OwnerReviews />
                          </RequireRole>
                        </RequireAuth>
                      }
                    />
                    <Route
                      path="/owner/inquiries"
                      element={
                        <RequireAuth>
                          <RequireRole roles={['owner', 'staff', 'super_admin']}>
                            <OwnerInquiries />
                          </RequireRole>
                        </RequireAuth>
                      }
                    />
                    <Route
                      path="/owner/analytics"
                      element={
                        <RequireAuth>
                          <RequireRole roles={['owner', 'staff', 'super_admin']}>
                            <OwnerAnalyticsPage />
                          </RequireRole>
                        </RequireAuth>
                      }
                    />
                    <Route
                      path="/owner/plan"
                      element={
                        <RequireAuth>
                          <RequireRole roles={['owner', 'staff', 'super_admin']}>
                            <OwnerPlan />
                          </RequireRole>
                        </RequireAuth>
                      }
                    />
                    <Route
                      path="/owner/profile"
                      element={
                        <RequireAuth>
                          <RequireRole roles={['owner', 'staff', 'super_admin']}>
                            <OwnerProfile />
                          </RequireRole>
                        </RequireAuth>
                      }
                    />
                    <Route
                      path="/owner/notifications"
                      element={
                        <RequireAuth>
                          <RequireRole roles={['owner', 'staff', 'super_admin']}>
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
