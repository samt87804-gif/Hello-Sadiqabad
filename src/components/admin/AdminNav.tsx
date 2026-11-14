import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import {
  ArrowLeft,
  BarChart3,
  Briefcase,
  Building2,
  ClipboardCheck,
  Crown,
  Download,
  FileSpreadsheet,
  FolderTree,
  History,
  LayoutDashboard,
  LogOut,
  MapPin,
  Megaphone,
  MessageSquare,
  PhoneCall,
  Settings,
  Shield,
  Sparkles,
  Users,
  Wrench,
} from 'lucide-react';
import { useAuth } from '../../lib/auth';
import { usePermissions } from '../../lib/permissions';
import type { PermissionKey } from '../../types/database';
import type { AdminDashboardCounts } from '../../types/directory';

export interface AdminNavItem {
  tab: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  requiredPerm?: PermissionKey;
  superAdminOnly?: boolean;
  badgeKey?: keyof AdminDashboardCounts | 'moderation_total';
}

export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  { tab: 'overview', label: 'Overview', icon: LayoutDashboard },
  { tab: 'analytics', label: 'Analytics', icon: BarChart3, requiredPerm: 'analytics.view' },
  { tab: 'moderation', label: 'Moderation Queue', icon: ClipboardCheck, requiredPerm: 'moderation.review', badgeKey: 'moderation_total' },
  { tab: 'inquiries', label: 'Inquiries', icon: MessageSquare, requiredPerm: 'support.read' },
  { tab: 'leads', label: 'Sales Leads', icon: Briefcase, requiredPerm: 'leads.manage', badgeKey: 'open_leads' },
  { tab: 'businesses', label: 'Businesses', icon: Building2, requiredPerm: 'business.create', badgeKey: 'pending_businesses' },
  { tab: 'quality', label: 'Data Quality', icon: Wrench, requiredPerm: 'business.create' },
  { tab: 'import', label: 'CSV Import', icon: FileSpreadsheet, requiredPerm: 'import.run' },
  { tab: 'export', label: 'Backup & Export', icon: Download, superAdminOnly: true },
  { tab: 'owners', label: 'Owners', icon: Users, requiredPerm: 'owners.create' },
  { tab: 'ads', label: 'Sponsored Ads', icon: Sparkles, requiredPerm: 'ads.review' },
  { tab: 'plans', label: 'Plans & Expiry', icon: Crown, requiredPerm: 'tiers.manage', badgeKey: 'expiring_plans' },
  { tab: 'categories', label: 'Categories', icon: FolderTree, superAdminOnly: true },
  { tab: 'areas', label: 'Areas', icon: MapPin, superAdminOnly: true },
  { tab: 'emergency', label: 'Emergency Contacts', icon: PhoneCall, superAdminOnly: true },
  { tab: 'announcements', label: 'Announcements', icon: Megaphone, requiredPerm: 'announcements.manage' },
  { tab: 'staff', label: 'Staff & Roles', icon: Shield, superAdminOnly: true },
  { tab: 'settings', label: 'Settings & Pages', icon: Settings, requiredPerm: 'settings.manage' },
  { tab: 'audit', label: 'Audit Logs', icon: History, superAdminOnly: true },
];

function resolveBadgeValue(counts: AdminDashboardCounts | null | undefined, badgeKey?: AdminNavItem['badgeKey']): number {
  if (!counts || !badgeKey) return 0;
  if (badgeKey === 'moderation_total') {
    return (counts.pending_reviews ?? 0) + (counts.new_submissions ?? 0);
  }
  return counts[badgeKey] ?? 0;
}

export function AdminNav({ counts }: { counts?: AdminDashboardCounts | null }) {
  const { profile, role, signOut } = useAuth();
  const { hasPermission, isSuperAdmin } = usePermissions();

  const visibleItems = ADMIN_NAV_ITEMS.filter((item) => {
    if (item.superAdminOnly) return isSuperAdmin;
    if (item.requiredPerm) return hasPermission(item.requiredPerm);
    return true;
  });

  return (
    <>
      {/* Mobile / Tablet horizontal tab bar */}
      <div className="lg:hidden bg-surface-container-lowest border-b border-outline-variant/40 px-4 py-2.5 flex items-center gap-2 overflow-x-auto no-scrollbar">
        <Link
          to="/"
          className="px-3 py-2 rounded-xl bg-surface-container-low text-xs font-semibold text-on-surface-variant inline-flex items-center gap-1 shrink-0"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Public
        </Link>
        <button
          type="button"
          onClick={() => signOut()}
          className="px-3 py-2 rounded-xl bg-error-container/50 text-error text-xs font-bold inline-flex items-center gap-1.5 shrink-0 cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" /> Sign Out
        </button>
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const badgeVal = resolveBadgeValue(counts, item.badgeKey);
          return (
            <NavLink
              key={item.tab}
              to={`/admin/${item.tab}`}
              className={({ isActive }) =>
                `px-3 py-2 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors ${
                  isActive
                    ? 'bg-primary text-on-primary shadow-xs'
                    : 'bg-surface-container-low text-on-surface-variant hover:text-primary'
                }`
              }
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{item.label}</span>
              {badgeVal > 0 && (
                <span className="px-1.5 rounded-full bg-secondary-container text-on-secondary-container text-[10px] font-bold tabular-nums">
                  {badgeVal}
                </span>
              )}
            </NavLink>
          );
        })}
      </div>

      {/* Desktop sticky sidebar under frozen header */}
      <aside className="hidden lg:flex flex-col w-64 shrink-0 bg-surface-container-lowest border-e border-outline-variant/40 lg:sticky lg:top-[102px] lg:h-[calc(100vh-102px-52px)] overflow-y-auto p-3.5 pb-6 justify-between">
        <div className="space-y-3">
          <div className="p-3 rounded-2xl bg-primary text-on-primary">
            <span className="text-[10px] uppercase tracking-wider font-bold opacity-85">
              {role === 'super_admin' ? 'Super Admin' : 'Staff Operator'}
            </span>
            <p className="text-sm font-bold truncate mt-0.5">{profile?.full_name || 'Admin'}</p>
            <p className="text-[11px] opacity-80">Hello Sadiqabad Operations</p>
          </div>

          <nav className="space-y-0.5" aria-label="Admin navigation">
            {visibleItems.map((item) => {
              const Icon = item.icon;
              const badgeVal = resolveBadgeValue(counts, item.badgeKey);
              return (
                <NavLink
                  key={item.tab}
                  to={`/admin/${item.tab}`}
                  className={({ isActive }) =>
                    `flex items-center justify-between gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                      isActive
                        ? 'bg-primary text-on-primary shadow-xs'
                        : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface'
                    }`
                  }
                >
                  <span className="flex items-center gap-2.5 min-w-0">
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </span>
                  {badgeVal > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full bg-secondary-container text-on-secondary-container text-[10px] font-bold tabular-nums">
                      {badgeVal}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        <div className="space-y-2 pt-4 mt-4 border-t border-outline-variant/30">
          <Link
            to="/"
            className="w-full px-3 py-2 rounded-xl text-xs font-semibold text-on-surface-variant hover:bg-surface-container-low flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" /> Public Directory
          </Link>
          <button
            type="button"
            onClick={() => signOut()}
            className="w-full px-3 py-2 rounded-xl text-xs font-semibold text-error hover:bg-error-container/40 flex items-center gap-2 cursor-pointer"
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}
