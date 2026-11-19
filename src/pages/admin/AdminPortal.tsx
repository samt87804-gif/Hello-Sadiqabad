import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Search } from 'lucide-react';
import { OwnerRegistrationRequests } from '../../components/admin/OwnerRegistrationRequests';
import { NewsManager } from '../../components/admin/NewsManager';
import { LocalAuthoritiesManager } from '../../components/admin/LocalAuthoritiesManager';
import { AuthorityProfilesManager } from '../../components/admin/AuthorityProfilesManager';
import { useAuth } from '../../lib/auth';
import { usePermissions } from '../../lib/permissions';
import {
  fetchAdminAnalytics,
  fetchAdminBusinesses,
  fetchAdminDashboardCounts,
  fetchAllAdsAdmin,
  fetchAllAreas,
  fetchAllCategories,
  fetchAllInquiriesAdmin,
  fetchAllPagesAdmin,
  fetchAllReviewsAdmin,
  fetchAllSiteSettingsAdmin,
  fetchAllSubmissionsAdmin,
  fetchAnnouncements,
  fetchAuditLogs,
  fetchEmergencyContactsAdmin,
  fetchImportBatches,
  fetchLocalAuthoritiesAdmin,
  fetchAuthorityProfilesAdmin,
  fetchLeads,
  fetchPlans,
  fetchProfilesAdmin,
} from '../../lib/api';
import type {
  AdRow,
  AnnouncementRow,
  AreaRow,
  AuditLogRow,
  CategoryRow,
  EmergencyContactRow,
  LocalAuthorityRow,
  AuthorityProfileRow,
  ImportBatchRow,
  InquiryRow,
  LeadRow,
  PageRow,
  PlanRow,
  ProfileRow,
  PermissionKey,
  ReviewRow,
  SiteSettingRow,
  StaffMemberRow,
  SubmissionRow,
} from '../../types/database';
import type {
  AdminAnalyticsData,
  AdminDashboardCounts,
  BusinessPublicView,
} from '../../types/directory';
import { AppHeader } from '../../components/layout/AppHeader';
import { AppFooter } from '../../components/layout/AppFooter';
import { AdminNav } from '../../components/admin/AdminNav';
import {
  AdminDashboard,
  BusinessManager,
  InquiriesManager,
  ModerationManager,
} from '../../components/admin/BusinessAndModeration';
import {
  AdsManager,
  ImportManager,
  LeadsManager,
  OwnersManager,
  PlansManager,
} from '../../components/admin/GrowthAndOps';
import {
  AnalyticsView,
  AnnouncementsManager,
  AuditLogsViewer,
  BackupExportManager,
  DataQualityManager,
  SettingsManager,
  StaffManager,
  TaxonomyManager,
} from '../../components/admin/SystemAndTaxonomy';
import { Card } from '../../components/ui/Surface';
import { Skeleton } from '../../components/ui/Feedback';
import { DemoModeNotice } from '../../components/ui/DemoModeNotice';
import { AdvancedAnalyticsPanel } from '../../components/admin/AdvancedAnalyticsPanel';
import { useToast } from '../../components/ui/Toast';

export function AdminPortal() {
  const { tab = 'overview' } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { hasPermission, isSuperAdmin, permissions } = usePermissions();
  const { showToast } = useToast();

  const [analyticsDays, setAnalyticsDays] = useState<7 | 30 | 90>(30);
  const [quickQuery, setQuickQuery] = useState('');
  const [businessJumpQuery, setBusinessJumpQuery] = useState('');

  const [counts, setCounts] = useState<AdminDashboardCounts | null>(null);
  const [businesses, setBusinesses] = useState<BusinessPublicView[]>([]);
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [areas, setAreas] = useState<AreaRow[]>([]);
  const [plans, setPlans] = useState<PlanRow[]>([]);
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [submissions, setSubmissions] = useState<SubmissionRow[]>([]);
  const [inquiries, setInquiries] = useState<InquiryRow[]>([]);
  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [profiles, setProfiles] = useState<
    Array<ProfileRow & { email?: string; is_active?: boolean; staff?: StaffMemberRow | null }>
  >([]);
  const [ads, setAds] = useState<AdRow[]>([]);
  const [batches, setBatches] = useState<ImportBatchRow[]>([]);
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContactRow[]>([]);
  const [localAuthorities, setLocalAuthorities] = useState<LocalAuthorityRow[]>([]);
  const [authorityProfiles, setAuthorityProfiles] = useState<AuthorityProfileRow[]>([]);
  const [announcements, setAnnouncements] = useState<AnnouncementRow[]>([]);
  const [analytics, setAnalytics] = useState<AdminAnalyticsData | null>(null);
  const canViewAnalytics = isSuperAdmin || permissions.includes('analytics.view');
  const [settings, setSettings] = useState<SiteSettingRow[]>([]);
  const [pages, setPages] = useState<PageRow[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const can = (permission: PermissionKey) => isSuperAdmin || hasPermission(permission);
      const canViewDashboard = can('business.create') ||
        can('moderation.review') || can('support.read');
      const emptyCounts: AdminDashboardCounts = {
        pending_businesses: 0,
        pending_reviews: 0,
        new_submissions: 0,
        open_leads: 0,
        expiring_plans: 0,
        published_businesses: 0,
      };
      const failedRequests: string[] = [];
      const safeLoad = async <T,>(request: Promise<T>, fallback: T): Promise<T> => {
        let timeoutId: number | undefined;
        try {
          return await Promise.race([
            request,
            new Promise<T>((_, reject) => {
              timeoutId = window.setTimeout(() => reject(new Error('Request timed out after 12 seconds')), 12000);
            }),
          ]);
        } catch (error) {
          failedRequests.push(error instanceof Error ? error.message : 'A data request failed');
          return fallback;
        } finally {
          if (timeoutId !== undefined) window.clearTimeout(timeoutId);
        }
      };
      const [
        c,
        biz,
        cats,
        ar,
        pls,
        revs,
        subs,
        inqs,
        lds,
        profs,
        adList,
        imp,
        em,
        auths,
        authorityProfilesList,
        anns,
        sett,
        pgs,
        aud,
      ] = await Promise.all([
        canViewDashboard ? safeLoad(fetchAdminDashboardCounts(), emptyCounts) : Promise.resolve(emptyCounts),
        can('business.create') || can('business.publish') ? safeLoad(fetchAdminBusinesses(), []) : Promise.resolve([]),
        can('business.create') || can('settings.manage') ? safeLoad(fetchAllCategories(true), []) : can('business.publish') ? safeLoad(fetchAllCategories(false), []) : Promise.resolve([]),
        can('business.create') || can('settings.manage') ? safeLoad(fetchAllAreas(true), []) : can('business.publish') ? safeLoad(fetchAllAreas(false), []) : Promise.resolve([]),
        can('tiers.manage') ? safeLoad(fetchPlans(true), []) : Promise.resolve([]),
        can('moderation.review') ? safeLoad(fetchAllReviewsAdmin(), []) : Promise.resolve([]),
        can('moderation.review') ? safeLoad(fetchAllSubmissionsAdmin(), []) : Promise.resolve([]),
        can('support.read') ? safeLoad(fetchAllInquiriesAdmin(), []) : Promise.resolve([]),
        can('leads.manage') ? safeLoad(fetchLeads(), []) : Promise.resolve([]),
        can('owners.create') ? safeLoad(fetchProfilesAdmin(), []) : Promise.resolve([]),
        can('ads.review') ? safeLoad(fetchAllAdsAdmin(), []) : Promise.resolve([]),
        can('import.run') ? safeLoad(fetchImportBatches(), []) : Promise.resolve([]),
        safeLoad(fetchEmergencyContactsAdmin(), []),
        isSuperAdmin ? safeLoad(fetchLocalAuthoritiesAdmin(), []) : Promise.resolve([]),
        isSuperAdmin ? safeLoad(fetchAuthorityProfilesAdmin(), []) : Promise.resolve([]),
        safeLoad(fetchAnnouncements(can('announcements.manage') ? false : true), []),
        can('settings.manage') ? safeLoad(fetchAllSiteSettingsAdmin(), []) : Promise.resolve([]),
        can('settings.manage') ? safeLoad(fetchAllPagesAdmin(), []) : Promise.resolve([]),
        isSuperAdmin ? safeLoad(fetchAuditLogs(100), []) : Promise.resolve([]),
      ]);
      setCounts(c);
      setBusinesses(biz);
      setCategories(cats);
      setAreas(ar);
      setPlans(pls);
      setReviews(revs);
      setSubmissions(subs);
      setInquiries(inqs);
      setLeads(lds);
      setProfiles(profs);
      setAds(adList);
      setBatches(imp);
      setEmergencyContacts(em);
      setLocalAuthorities(auths);
      setAuthorityProfiles(authorityProfilesList);
      setAnnouncements(anns);
      setSettings(sett);
      setPages(pgs);
      setAuditLogs(aud);
      if (failedRequests.length) {
        showToast(`${failedRequests.length} admin data request(s) failed or timed out. Available sections remain usable; retry the affected section.`, 'error');
      }
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : 'Admin portal data could not be loaded.',
        'error'
      );
    } finally {
      setLoading(false);
    }
  }, [showToast, isSuperAdmin, hasPermission]);

  useEffect(() => {
    reload();
  }, [reload]);

  useEffect(() => {
    if (!canViewAnalytics) {
      setAnalytics(null);
      return;
    }
    let cancelled = false;
    void fetchAdminAnalytics(analyticsDays)
      .then((result) => { if (!cancelled) setAnalytics(result); })
      .catch((error) => {
        if (!cancelled) showToast(error instanceof Error ? error.message : 'Analytics could not be loaded.', 'error');
      });
    return () => { cancelled = true; };
  }, [analyticsDays, canViewAnalytics, showToast]);

  const actorId = user?.id ?? 'user-admin-1';

  const handleGlobalJump = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickQuery.trim()) return;
    setBusinessJumpQuery(quickQuery.trim());
    navigate('/admin/businesses');
  };

  const renderTab = (tabKey: string) => {
    if (!counts) {
      return <Skeleton className="h-72 rounded-2xl" />;
    }

    switch (tabKey) {
      case 'overview':
        return <AdminDashboard counts={counts} />;
      case 'analytics':
        return (isSuperAdmin || hasPermission('analytics.view')) ? (
          <div className="space-y-8">
            <AdvancedAnalyticsPanel />
            {analytics && (
              <AnalyticsView
                analytics={analytics}
                businesses={businesses}
                days={analyticsDays}
                onDaysChange={setAnalyticsDays}
              />
            )}
          </div>
        ) : (
          <PermissionDenied />
        );
      case 'moderation':
        return hasPermission('moderation.review') ? (
          <ModerationManager
            reviews={reviews}
            submissions={submissions}
            businesses={businesses}
            actorId={actorId}
            onJumpToBusiness={(name) => {
              setBusinessJumpQuery(name);
              navigate('/admin/businesses');
            }}
            onReload={reload}
          />
        ) : (
          <PermissionDenied />
        );
      case 'inquiries':
        return hasPermission('support.read') ? (
          <InquiriesManager
            inquiries={inquiries}
            businesses={businesses}
            actorId={actorId}
            onReload={reload}
          />
        ) : (
          <PermissionDenied />
        );
      case 'leads':
        return hasPermission('leads.manage') ? (
          <LeadsManager leads={leads} actorId={actorId} onReload={reload} />
        ) : (
          <PermissionDenied />
        );
      case 'businesses':
        return hasPermission('business.create') ? (
          <BusinessManager
            businesses={businesses}
            categories={categories}
            areas={areas}
            profiles={profiles}
            actorId={actorId}
            canPublish={hasPermission('business.publish')}
            initialSearch={businessJumpQuery}
            onReload={reload}
          />
        ) : (
          <PermissionDenied />
        );
      case 'quality':
        return hasPermission('business.create') ? (
          <DataQualityManager
            businesses={businesses}
            categories={categories}
            submissions={submissions}
            onJumpToBusiness={(name) => {
              setBusinessJumpQuery(name);
              navigate('/admin/businesses');
            }}
          />
        ) : (
          <PermissionDenied />
        );
      case 'import':
        return hasPermission('import.run') ? (
          <ImportManager
            categories={categories}
            areas={areas}
            businesses={businesses}
            batches={batches}
            actorId={actorId}
            onReload={reload}
          />
        ) : (
          <PermissionDenied />
        );
      case 'export':
        return isSuperAdmin ? (
          <BackupExportManager
            businesses={businesses}
            categories={categories}
            areas={areas}
            emergencyContacts={emergencyContacts}
            localAuthorities={localAuthorities}
            authorityProfiles={authorityProfiles}
            leads={leads}
          />
        ) : (
          <PermissionDenied />
        );
      case 'owner-requests':
        return hasPermission('owners.create') ? <OwnerRegistrationRequests /> : <PermissionDenied />;
      case 'owners':
        return hasPermission('owners.create') ? (
          <OwnersManager
            profiles={profiles}
            businesses={businesses}
            actorId={actorId}
            onReload={reload}
          />
        ) : (
          <PermissionDenied />
        );
      case 'ads':
        return hasPermission('ads.review') ? (
          <AdsManager
            ads={ads}
            businesses={businesses}
            actorId={actorId}
            onReload={reload}
          />
        ) : (
          <PermissionDenied />
        );
      case 'local-authorities':
        return isSuperAdmin ? <LocalAuthoritiesManager authorities={localAuthorities} actorId={actorId} onReload={reload} /> : <PermissionDenied />;
      case 'authority-profiles':
        return isSuperAdmin ? <AuthorityProfilesManager profiles={authorityProfiles} businesses={businesses} actorId={actorId} onReload={reload} /> : <PermissionDenied />;
      case 'plans':
        return hasPermission('tiers.manage') ? (
          <PlansManager
            plans={plans}
            businesses={businesses}
            actorId={actorId}
            onReload={reload}
          />
        ) : (
          <PermissionDenied />
        );
      case 'categories':
      case 'areas':
      case 'emergency':
        return isSuperAdmin ? (
          <TaxonomyManager
            mode={tabKey}
            categories={categories}
            areas={areas}
            emergencyContacts={emergencyContacts}
            actorId={actorId}
            onReload={reload}
          />
        ) : (
          <PermissionDenied />
        );
      case 'taxonomy':
        return isSuperAdmin ? (
          <TaxonomyManager
            mode="categories"
            categories={categories}
            areas={areas}
            emergencyContacts={emergencyContacts}
            actorId={actorId}
            onReload={reload}
          />
        ) : (
          <PermissionDenied />
        );
      case 'news':
        return hasPermission('announcements.manage') ? <NewsManager actorId={actorId} /> : <PermissionDenied />;
      case 'announcements':
        return hasPermission('announcements.manage') ? (
          <AnnouncementsManager
            announcements={announcements}
            actorId={actorId}
            onReload={reload}
          />
        ) : (
          <PermissionDenied />
        );
      case 'staff':
        return isSuperAdmin ? (
          <StaffManager profiles={profiles} actorId={actorId} onReload={reload} />
        ) : (
          <PermissionDenied />
        );
      case 'settings':
        return hasPermission('settings.manage') ? (
          <SettingsManager
            settings={settings}
            pages={pages}
            categories={categories}
            areas={areas}
            emergencyContacts={emergencyContacts}
            actorId={actorId}
            onReload={reload}
          />
        ) : (
          <PermissionDenied />
        );
      case 'audit':
        return isSuperAdmin ? <AuditLogsViewer logs={auditLogs} /> : <PermissionDenied />;
      default:
        return <AdminDashboard counts={counts} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-surface text-on-surface" data-admin-scroll-ready={counts ? "true" : "false"}>
      <AppHeader />
      <div className="pt-[93px] sm:pt-[102px]">
        <DemoModeNotice />
      </div>
      <div className="flex-1 flex flex-col lg:flex-row pb-20">
        <AdminNav counts={counts} />
        <main className="flex-1 p-4 sm:p-6 pb-10 max-w-6xl w-full mx-auto space-y-5">
          {/* Global Admin Quick Search */}
          <div className="relative">
            <form
              onSubmit={handleGlobalJump}
              className="flex items-center gap-2 p-2.5 rounded-2xl bg-surface-container-lowest border border-outline-variant/40"
            >
              <Search className="w-4 h-4 text-primary ms-1.5 shrink-0" />
              <input
                type="text"
                value={quickQuery}
                onChange={(e) => setQuickQuery(e.target.value)}
                placeholder="Quick jump to any Sadiqabad shop, lead, or owner by name or phone..."
                aria-label="Global admin search"
                className="flex-1 bg-transparent text-xs sm:text-sm outline-none text-on-surface placeholder:text-on-surface-variant/70"
              />
              <button
                type="submit"
                className="px-3 py-1.5 rounded-xl bg-primary text-on-primary text-xs font-bold cursor-pointer"
              >
                Find Listing
              </button>
            </form>

            {quickQuery.trim().length >= 2 && (() => {
              const q = quickQuery.trim().toLowerCase();
              const matchedBiz = businesses
                .filter(
                  (b) =>
                    b.name_en.toLowerCase().includes(q) ||
                    (b.name_ur ?? '').includes(quickQuery.trim()) ||
                    b.phone_primary.includes(q) ||
                    (b.area?.name_en ?? '').toLowerCase().includes(q)
                )
                .slice(0, 5);
              const matchedLeads = hasPermission('leads.manage')
                ? leads
                    .filter(
                      (l) =>
                        l.name.toLowerCase().includes(q) ||
                        l.phone.includes(q) ||
                        (l.area_text ?? '').toLowerCase().includes(q)
                    )
                    .slice(0, 4)
                : [];
              const matchedOwners = hasPermission('owners.create')
                ? profiles
                    .filter(
                      (p) =>
                        p.role === 'owner' &&
                        ((p.full_name ?? '').toLowerCase().includes(q) ||
                          (p.email ?? '').toLowerCase().includes(q) ||
                          (p.phone ?? '').includes(q))
                    )
                    .slice(0, 4)
                : [];

              if (
                matchedBiz.length === 0 &&
                matchedLeads.length === 0 &&
                matchedOwners.length === 0
              ) {
                return null;
              }

              return (
                <Card className="absolute z-30 top-full inset-x-0 mt-1.5 p-2 shadow-xl max-h-80 overflow-y-auto space-y-2">
                  {matchedBiz.length > 0 && (
                    <div>
                      <p className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                        Businesses
                      </p>
                      {matchedBiz.map((b) => (
                        <button
                          key={b.id}
                          type="button"
                          onClick={() => {
                            setBusinessJumpQuery(b.name_en);
                            setQuickQuery('');
                            navigate('/admin/businesses');
                          }}
                          className="w-full text-start px-2.5 py-2 rounded-xl hover:bg-surface-container-low flex items-center justify-between gap-2 text-xs cursor-pointer"
                        >
                          <span className="font-bold text-on-surface truncate">{b.name_en}</span>
                          <span className="text-on-surface-variant tabular-nums shrink-0" dir="ltr">
                            {b.phone_primary}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}

                  {matchedLeads.length > 0 && (
                    <div>
                      <p className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                        Sales Leads
                      </p>
                      {matchedLeads.map((l) => (
                        <button
                          key={l.id}
                          type="button"
                          onClick={() => {
                            setQuickQuery('');
                            navigate('/admin/leads');
                          }}
                          className="w-full text-start px-2.5 py-2 rounded-xl hover:bg-surface-container-low flex items-center justify-between gap-2 text-xs cursor-pointer"
                        >
                          <span className="font-bold text-on-surface truncate">{l.name}</span>
                          <span className="text-secondary font-semibold shrink-0">{l.status}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {matchedOwners.length > 0 && (
                    <div>
                      <p className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                        Business Owners
                      </p>
                      {matchedOwners.map((o) => (
                        <button
                          key={o.id}
                          type="button"
                          onClick={() => {
                            setQuickQuery('');
                            navigate('/admin/owners');
                          }}
                          className="w-full text-start px-2.5 py-2 rounded-xl hover:bg-surface-container-low flex items-center justify-between gap-2 text-xs cursor-pointer"
                        >
                          <span className="font-bold text-on-surface truncate">
                            {o.full_name || o.email || o.id}
                          </span>
                          <span className="text-on-surface-variant truncate">{o.phone ?? o.email}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </Card>
              );
            })()}
          </div>

          {renderTab(tab)}
        </main>
      </div>
      <AppFooter variant="portal" withBottomNavOffset={false} />
    </div>
  );
}

function PermissionDenied() {
  return (
    <Card className="p-8 text-center space-y-2">
      <h2 className="text-lg font-bold text-error">Permission Restricted</h2>
      <p className="text-sm text-on-surface-variant">
        Your staff role does not include permission for this section. Contact the Super Admin.
      </p>
    </Card>
  );
}
