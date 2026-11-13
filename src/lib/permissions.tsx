import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import type { PermissionKey, StaffType, UserRole } from '../types/database';
import { useAuth } from './auth';

export const STAFF_TYPE_PERMISSIONS: Record<StaffType, PermissionKey[]> = {
  data_entry: ['business.create', 'business.edit_own'],
  importer: ['import.run'],
  sales_onboarding: ['leads.manage', 'owners.create', 'tiers.manage', 'ads.review'],
  listing_manager: ['business.create', 'business.edit_own', 'business.publish'],
  moderator: ['moderation.review'],
  support: ['support.read', 'moderation.review'],
};

export const STAFF_TYPE_LABELS: Record<StaffType, { en: string; ur: string; desc: string }> = {
  data_entry: {
    en: 'Data Entry',
    ur: 'ڈیٹا انٹری',
    desc: 'Add draft listings and edit own created drafts',
  },
  importer: {
    en: 'Bulk Importer',
    ur: 'بلک امپورٹر',
    desc: 'Import CSV/JSON batches of businesses',
  },
  sales_onboarding: {
    en: 'Sales & Onboarding',
    ur: 'سیلز اور آن بورڈنگ',
    desc: 'Manage leads, create owners, upgrade plans & ads',
  },
  listing_manager: {
    en: 'Listing Manager',
    ur: 'لسٹنگ مینیجر',
    desc: 'Create, edit, publish, suspend & verify listings',
  },
  moderator: {
    en: 'Moderator',
    ur: 'ماڈریٹر',
    desc: 'Approve/reject reviews, submissions & claims',
  },
  support: {
    en: 'Support',
    ur: 'سپورٹ',
    desc: 'View inquiries & moderation queue',
  },
};

export function usePermissions() {
  const { role, permissions, staffTypes, isActiveUser } = useAuth();

  const hasPermission = (perm: PermissionKey): boolean => {
    if (!isActiveUser) return false;
    if (role === 'super_admin') return true;
    return permissions.includes(perm);
  };

  const hasAnyPermission = (...perms: PermissionKey[]): boolean => {
    if (!isActiveUser) return false;
    if (role === 'super_admin') return true;
    return perms.some((p) => permissions.includes(p));
  };

  return {
    role,
    staffTypes,
    permissions,
    isSuperAdmin: role === 'super_admin',
    isStaff: role === 'staff',
    isOwner: role === 'owner',
    hasPermission,
    hasAnyPermission,
  };
}

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-3 text-on-surface-variant">
          <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <span className="text-sm font-medium">Loading portal session…</span>
        </div>
      </div>
    );
  }

  if (!user) {
    const nextPath = `${location.pathname}${location.search}`;
    return <Navigate to={`/login?next=${encodeURIComponent(nextPath)}`} state={{ from: nextPath }} replace />;
  }

  if (profile?.must_change_password && location.pathname !== '/change-password') {
    return <Navigate to="/change-password" replace />;
  }

  return <>{children}</>;
}

export function RequireRole({
  roles,
  children,
}: {
  roles: UserRole[];
  children: React.ReactNode;
}) {
  const { user, role, isActiveUser, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!user) {
    const nextPath = `${location.pathname}${location.search}`;
    return <Navigate to={`/login?next=${encodeURIComponent(nextPath)}`} replace />;
  }

  if (!isActiveUser) {
    return (
      <div className="max-w-md mx-auto my-12 p-6 rounded-2xl bg-surface-container-lowest border border-outline-variant/40 text-center space-y-3">
        <h2 className="text-lg font-bold text-error">Account Suspended / اکاؤنٹ معطل ہے</h2>
        <p className="text-sm text-on-surface-variant">
          Your portal access has been paused by the Super Admin. Contact Hello Sadiqabad support.
        </p>
        <a
          href="/"
          className="inline-flex items-center justify-center px-4 py-2 rounded-xl bg-primary text-on-primary text-xs font-bold"
        >
          Back to Directory
        </a>
      </div>
    );
  }

  if (!role || !roles.includes(role)) {
    const fallbackPortal = role === 'owner' ? '/owner' : role === 'staff' || role === 'super_admin' ? '/admin' : '/';
    return (
      <div className="max-w-md mx-auto my-12 p-6 rounded-2xl bg-surface-container-lowest border border-outline-variant/40 text-center space-y-3 shadow-sm">
        <h2 className="text-lg font-bold text-error">Access Not Allowed / رسائی کی اجازت نہیں</h2>
        <p className="text-sm text-on-surface-variant">
          Your account role ({role ?? 'guest'}) does not have permission to open this portal section.
        </p>
        <div className="flex items-center justify-center gap-2 pt-2">
          <a
            href="/"
            className="px-4 py-2 rounded-xl border border-outline-variant/60 text-xs font-bold text-on-surface"
          >
            Back Home
          </a>
          {fallbackPortal !== '/' && (
            <a
              href={fallbackPortal}
              className="px-4 py-2 rounded-xl bg-primary text-on-primary text-xs font-bold"
            >
              Open My Portal
            </a>
          )}
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
