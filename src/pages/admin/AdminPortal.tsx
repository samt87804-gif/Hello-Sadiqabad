import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Search } from 'lucide-react';
const SdkJobsManager = React.lazy(() => import('../../components/admin/SdkJobsManager').then((m) => ({ default: m.SdkJobsManager })));
const BusinessFieldReviewQueue = React.lazy(() => import('../../components/admin/BusinessFieldReviewQueue').then((m) => ({ default: m.BusinessFieldReviewQueue })));
const OwnerRegistrationRequests = React.lazy(() => import('../../components/admin/OwnerRegistrationRequests').then((m) => ({ default: m.OwnerRegistrationRequests })));
const NewsManager = React.lazy(() => import('../../components/admin/NewsManager').then((m) => ({ default: m.NewsManager })));
const GovernmentJobsManager = React.lazy(() => import('../../components/admin/GovernmentJobsManager').then((m) => ({ default: m.GovernmentJobsManager })));
const GovernmentSchemesManager = React.lazy(() => import('../../components/admin/GovernmentSchemesManager').then((m) => ({ default: m.GovernmentSchemesManager })));
const AdminChatbotKnowledge = React.lazy(() => import('../../components/admin/AdminChatbotKnowledge').then((m) => ({ default: m.AdminChatbotKnowledge })));
const LocalAuthoritiesManager = React.lazy(() => import('../../components/admin/LocalAuthoritiesManager').then((m) => ({ default: m.LocalAuthoritiesManager })));
const AuthorityProfilesManager = React.lazy(() => import('../../components/admin/AuthorityProfilesManager').then((m) => ({ default: m.AuthorityProfilesManager })));
const AdminDashboard = React.lazy(() => import('../../components/admin/BusinessAndModeration').then((m) => ({ default: m.AdminDashboard })));
const BusinessManager = React.lazy(() => import('../../components/admin/BusinessAndModeration').then((m) => ({ default: m.BusinessManager })));
const InquiriesManager = React.lazy(() => import('../../components/admin/BusinessAndModeration').then((m) => ({ default: m.InquiriesManager })));
const ModerationManager = React.lazy(() => import('../../components/admin/BusinessAndModeration').then((m) => ({ default: m.ModerationManager })));
const AdsManager = React.lazy(() => import('../../components/admin/GrowthAndOps').then((m) => ({ default: m.AdsManager })));
const ImportManager = React.lazy(() => import('../../components/admin/GrowthAndOps').then((m) => ({ default: m.ImportManager })));
const LeadsManager = React.lazy(() => import('../../components/admin/GrowthAndOps').then((m) => ({ default: m.LeadsManager })));
const OwnersManager = React.lazy(() => import('../../components/admin/GrowthAndOps').then((m) => ({ default: m.OwnersManager })));
const PlansManager = React.lazy(() => import('../../components/admin/GrowthAndOps').then((m) => ({ default: m.PlansManager })));
const AnalyticsView = React.lazy(() => import('../../components/admin/SystemAndTaxonomy').then((m) => ({ default: m.AnalyticsView })));
const AnnouncementsManager = React.lazy(() => import('../../components/admin/SystemAndTaxonomy').then((m) => ({ default: m.AnnouncementsManager })));
const AuditLogsViewer = React.lazy(() => import('../../components/admin/SystemAndTaxonomy').then((m) => ({ default: m.AuditLogsViewer })));
const BackupExportManager = React.lazy(() => import('../../components/admin/SystemAndTaxonomy').then((m) => ({ default: m.BackupExportManager })));
const DataQualityManager = React.lazy(() => import('../../components/admin/SystemAndTaxonomy').then((m) => ({ default: m.DataQualityManager })));
const SettingsManager = React.lazy(() => import('../../components/admin/SystemAndTaxonomy').then((m) => ({ default: m.SettingsManager })));
const StaffManager = React.lazy(() => import('../../components/admin/SystemAndTaxonomy').then((m) => ({ default: m.StaffManager })));
const TaxonomyManager = React.lazy(() => import('../../components/admin/SystemAndTaxonomy').then((m) => ({ default: m.TaxonomyManager })));
const AdvancedAnalyticsPanel = React.lazy(() => import('../../components/admin/AdvancedAnalyticsPanel').then((m) => ({ default: m.AdvancedAnalyticsPanel })));
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
import { Card } from '../../components/ui/Surface';
import { Skeleton } from '../../components/ui/Feedback';
import { DemoModeNotice } from '../../components/ui/DemoModeNotice';
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
  const [businessesLoaded, setBusinessesLoaded] = useState(false);
  const [leadsLoaded, setLeadsLoaded] = useState(false);
  const [profilesLoaded, setProfilesLoaded] = useState(false);
  const quickSearchLoading = React.useRef({ businesses: false, leads: false, profiles: false });
  const adminCacheTtlMs = 30_000;
  const loadedAdminData = React.useRef({
    businesses: { loaded: false, at: 0 },
    taxonomy: { loaded: false, at: 0 },
    profiles: { loaded: false, at: 0 },
    leads: { loaded: false, at: 0 },
  });
  const reload = useCallback(async (force = true) => {
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
      const needsBusinesses = ['businesses', 'quality', 'moderation', 'inquiries', 'import', 'export', 'owners', 'ads', 'plans', 'authority-profiles', 'analytics'].includes(tab);
      const needsTaxonomy = ['businesses', 'quality', 'import', 'export', 'categories', 'areas', 'settings', 'business-review'].includes(tab);
      const needsProfiles = ['businesses', 'owners', 'staff'].includes(tab) && can('owners.create');
      const canLoadBusinesses = can('business.create') || can('business.publish');
      const canLoadTaxonomy = can('business.create') || can('settings.manage') || can('business.publish') || can('moderation.review');
      const shouldLoadBusinesses = needsBusinesses && canLoadBusinesses &&
        (force || !loadedAdminData.current.businesses.loaded || Date.now() - loadedAdminData.current.businesses.at >= adminCacheTtlMs);
      const shouldLoadTaxonomy = needsTaxonomy && canLoadTaxonomy &&
        (force || !loadedAdminData.current.taxonomy.loaded || Date.now() - loadedAdminData.current.taxonomy.at >= adminCacheTtlMs);
      const shouldLoadProfiles = needsProfiles &&
        (force || !loadedAdminData.current.profiles.loaded || Date.now() - loadedAdminData.current.profiles.at >= adminCacheTtlMs);
      const shouldLoadLeads = (tab === 'leads' || tab === 'export') && can('leads.manage') &&
        (force || !loadedAdminData.current.leads.loaded || Date.now() - loadedAdminData.current.leads.at >= adminCacheTtlMs);
      const needsEmergency = ['emergency', 'export', 'settings'].includes(tab);
      const needsLocalAuthorities = ['local-authorities', 'export'].includes(tab) && isSuperAdmin;
      const needsAuthorityProfiles = ['authority-profiles', 'export'].includes(tab) && isSuperAdmin;
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
      let businessLoadSucceeded = false;
      let taxonomyCategoriesLoadSucceeded = false;
      let taxonomyAreasLoadSucceeded = false;
      let profilesLoadSucceeded = false;
      let leadsLoadSucceeded = false;
      if (shouldLoadBusinesses) quickSearchLoading.current.businesses = true;
      if (shouldLoadProfiles) quickSearchLoading.current.profiles = true;
      if (shouldLoadLeads) quickSearchLoading.current.leads = true;
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
        shouldLoadBusinesses
          ? safeLoad(fetchAdminBusinesses().then((result) => { businessLoadSucceeded = true; return result; }), [])
          : Promise.resolve([]),
        shouldLoadTaxonomy
          ? safeLoad(fetchAllCategories(can('business.create') || can('settings.manage')).then((result) => { taxonomyCategoriesLoadSucceeded = true; return result; }), [])
          : Promise.resolve([]),
        shouldLoadTaxonomy
          ? safeLoad(fetchAllAreas(can('business.create') || can('settings.manage')).then((result) => { taxonomyAreasLoadSucceeded = true; return result; }), [])
          : Promise.resolve([]),
        tab === 'plans' && can('tiers.manage') ? safeLoad(fetchPlans(true), []) : Promise.resolve([]),
        tab === 'moderation' && can('moderation.review') ? safeLoad(fetchAllReviewsAdmin(), []) : Promise.resolve([]),
        (tab === 'moderation' || tab === 'quality') && can('moderation.review') ? safeLoad(fetchAllSubmissionsAdmin(), []) : Promise.resolve([]),
        tab === 'inquiries' && can('support.read') ? safeLoad(fetchAllInquiriesAdmin(), []) : Promise.resolve([]),
        shouldLoadLeads
          ? safeLoad(fetchLeads().then((result) => { leadsLoadSucceeded = true; return result; }), [])
          : Promise.resolve([]),
        shouldLoadProfiles
          ? safeLoad(fetchProfilesAdmin().then((result) => { profilesLoadSucceeded = true; return result; }), [])
          : Promise.resolve([]),
        tab === 'ads' && can('ads.review') ? safeLoad(fetchAllAdsAdmin(), []) : Promise.resolve([]),
        tab === 'import' && can('import.run') ? safeLoad(fetchImportBatches(), []) : Promise.resolve([]),
        needsEmergency ? safeLoad(fetchEmergencyContactsAdmin(), []) : Promise.resolve([]),
        needsLocalAuthorities ? safeLoad(fetchLocalAuthoritiesAdmin(), []) : Promise.resolve([]),
        needsAuthorityProfiles ? safeLoad(fetchAuthorityProfilesAdmin(), []) : Promise.resolve([]),
        tab === 'announcements' ? safeLoad(fetchAnnouncements(can('announcements.manage') ? false : true), []) : Promise.resolve([]),
        tab === 'settings' && can('settings.manage') ? safeLoad(fetchAllSiteSettingsAdmin(), []) : Promise.resolve([]),
        tab === 'settings' && can('settings.manage') ? safeLoad(fetchAllPagesAdmin(), []) : Promise.resolve([]),
        tab === 'audit' && isSuperAdmin ? safeLoad(fetchAuditLogs(100), []) : Promise.resolve([]),
      ]);
      setCounts(c);
      if (shouldLoadBusinesses) {
        if (businessLoadSucceeded) setBusinesses(biz);
        setBusinessesLoaded(businessLoadSucceeded);
        loadedAdminData.current.businesses = { loaded: businessLoadSucceeded, at: businessLoadSucceeded ? Date.now() : 0 };
      }
      if (shouldLoadTaxonomy) {
        const taxonomyLoadSucceeded = taxonomyCategoriesLoadSucceeded && taxonomyAreasLoadSucceeded;
        if (taxonomyLoadSucceeded) {
          setCategories(cats);
          setAreas(ar);
        }
        loadedAdminData.current.taxonomy = { loaded: taxonomyLoadSucceeded, at: taxonomyLoadSucceeded ? Date.now() : 0 };
      }
      if (tab === 'plans') setPlans(pls);
      if (tab === 'moderation') {
        setReviews(revs);
        setSubmissions(subs);
      }
      if (tab === 'quality') setSubmissions(subs);
      if (tab === 'inquiries') setInquiries(inqs);
      if (shouldLoadLeads) {
        if (leadsLoadSucceeded) setLeads(lds);
        setLeadsLoaded(leadsLoadSucceeded);
        loadedAdminData.current.leads = { loaded: leadsLoadSucceeded, at: leadsLoadSucceeded ? Date.now() : 0 };
      }
      if (shouldLoadProfiles) {
        if (profilesLoadSucceeded) setProfiles(profs);
        setProfilesLoaded(profilesLoadSucceeded);
        loadedAdminData.current.profiles = { loaded: profilesLoadSucceeded, at: profilesLoadSucceeded ? Date.now() : 0 };
      }
      if (tab === 'ads') setAds(adList);
      if (tab === 'import') setBatches(imp);
      if (needsEmergency) setEmergencyContacts(em);
      if (needsLocalAuthorities) setLocalAuthorities(auths);
      if (needsAuthorityProfiles) setAuthorityProfiles(authorityProfilesList);
      if (tab === 'announcements') setAnnouncements(anns);
      if (tab === 'settings') {
        setSettings(sett);
        setPages(pgs);
      }
      if (tab === 'audit') setAuditLogs(aud);
      quickSearchLoading.current.businesses = false;
      quickSearchLoading.current.profiles = false;
      quickSearchLoading.current.leads = false;
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
  }, [showToast, isSuperAdmin, hasPermission, tab]);

  useEffect(() => {
    void reload(false);
  }, [reload]);

  useEffect(() => {
    if (!canViewAnalytics || tab !== 'analytics') {
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
  }, [analyticsDays, canViewAnalytics, showToast, tab]);

  useEffect(() => {
    if (quickQuery.trim().length < 2) return;
    const timeoutId = window.setTimeout(() => {
      const can = (permission: PermissionKey) => isSuperAdmin || hasPermission(permission);
      if (!businessesLoaded && !quickSearchLoading.current.businesses && (can('business.create') || can('business.publish'))) {
        quickSearchLoading.current.businesses = true;
        void fetchAdminBusinesses().then((result) => {
          setBusinesses(result);
          setBusinessesLoaded(true);
          loadedAdminData.current.businesses = { loaded: true, at: Date.now() };
        }).catch(() => {
          setBusinessesLoaded(false);
        }).finally(() => {
          quickSearchLoading.current.businesses = false;
        });
      }
      if (!leadsLoaded && !quickSearchLoading.current.leads && can('leads.manage')) {
        quickSearchLoading.current.leads = true;
        void fetchLeads().then((result) => {
          setLeads(result);
          setLeadsLoaded(true);
          loadedAdminData.current.leads = { loaded: true, at: Date.now() };
        }).catch(() => {
          setLeadsLoaded(false);
        }).finally(() => {
          quickSearchLoading.current.leads = false;
        });
      }
      if (!profilesLoaded && !quickSearchLoading.current.profiles && can('owners.create')) {
        quickSearchLoading.current.profiles = true;
        void fetchProfilesAdmin().then((result) => {
          setProfiles(result);
          setProfilesLoaded(true);
          loadedAdminData.current.profiles = { loaded: true, at: Date.now() };
        }).catch(() => {
          setProfilesLoaded(false);
        }).finally(() => {
          quickSearchLoading.current.profiles = false;
        });
      }
    }, 250);
    return () => window.clearTimeout(timeoutId);
  }, [quickQuery, businessesLoaded, leadsLoaded, profilesLoaded, isSuperAdmin, hasPermission]);

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
      case 'sdk-jobs':
        return hasPermission('sdk_jobs.manage') ? <SdkJobsManager /> : <PermissionDenied />;
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
      case 'business-review':
        return hasPermission('moderation.review') ? <BusinessFieldReviewQueue categories={categories} areas={areas} /> : <PermissionDenied />;
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
      case 'government-jobs':
        return hasPermission('government_jobs.manage') ? <GovernmentJobsManager actorId={actorId} /> : <PermissionDenied />;
      case 'government-schemes':
        return hasPermission('government_schemes.manage') ? <GovernmentSchemesManager actorId={actorId} /> : <PermissionDenied />;
      case 'chatbot-knowledge':
        return isSuperAdmin ? <AdminChatbotKnowledge /> : <PermissionDenied />;
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

          <React.Suspense fallback={<Skeleton className="h-72 rounded-2xl" />}>
            {renderTab(tab)}
          </React.Suspense>
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
