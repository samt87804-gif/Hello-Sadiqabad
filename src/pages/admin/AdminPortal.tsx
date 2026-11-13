import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Search } from 'lucide-react';
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
  fetchEmergencyContacts,
  fetchImportBatches,
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
  ImportBatchRow,
  InquiryRow,
  LeadRow,
  PageRow,
  PlanRow,
  ProfileRow,
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

export function AdminPortal() {
  const { tab = 'overview' } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { hasPermission, isSuperAdmin } = usePermissions();

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
  const [announcements, setAnnouncements] = useState<AnnouncementRow[]>([]);
  const [analytics, setAnalytics] = useState<AdminAnalyticsData | null>(null);
  const [settings, setSettings] = useState<SiteSettingRow[]>([]);
  const [pages, setPages] = useState<PageRow[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogRow[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
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
        anns,
        anl,
        sett,
        pgs,
        aud,
      ] = await Promise.all([
        fetchAdminDashboardCounts(),
        fetchAdminBusinesses(),
        fetchAllCategories(true),
        fetchAllAreas(true),
        fetchPlans(),
        fetchAllReviewsAdmin(),
        fetchAllSubmissionsAdmin(),
        fetchAllInquiriesAdmin(),
        fetchLeads(),
        fetchProfilesAdmin(),
        fetchAllAdsAdmin(),
        fetchImportBatches(),
        fetchEmergencyContacts(),
        fetchAnnouncements(false),
        fetchAdminAnalytics(analyticsDays),
        fetchAllSiteSettingsAdmin(),
        fetchAllPagesAdmin(),
        fetchAuditLogs(100),
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
      setEmergencyContacts(em.items);
      setAnnouncements(anns);
      setAnalytics(anl);
      setSettings(sett);
      setPages(pgs);
      setAuditLogs(aud);
    } finally {
      setLoading(false);
    }
  }, [analyticsDays]);

  useEffect(() => {
    reload();
  }, [reload]);

  const actorId = user?.id ?? 'user-admin-1';

  const handleGlobalJump = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickQuery.trim()) return;
    setBusinessJumpQuery(quickQuery.trim());
    navigate('/admin/businesses');
  };

  const renderTab = () => {
    if (loading || !counts) {
      return <Skeleton className="h-72 rounded-2xl" />;
    }

    switch (tab) {
      case 'overview':
        return <AdminDashboard counts={counts} />;
      case 'analytics':
        return hasPermission('analytics.view') && analytics ? (
          <AnalyticsView
            analytics={analytics}
            businesses={businesses}
            days={analyticsDays}
            onDaysChange={setAnalyticsDays}
          />
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
            leads={leads}
          />
        ) : (
          <PermissionDenied />
        );
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
            mode={tab}
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
    <div className="min-h-screen flex flex-col bg-surface text-on-surface">
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

          {renderTab()}
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
