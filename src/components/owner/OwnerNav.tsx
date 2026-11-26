import React, { useEffect, useState } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import {
  ArrowLeft,
  BarChart3,
  BriefcaseBusiness,
  Bell,
  Crown,
  Edit3,
  LayoutDashboard,
  LogOut,
  Menu,
  X,
  MessageSquare,
  PlusCircle,
  Receipt,
  Package,
  Star,
  Store,
  Tag,
  UserCircle,
  UserCheck,
} from 'lucide-react';
import { useAuth } from '../../lib/auth';

export function OwnerNav({ unreadCount = 0 }: { unreadCount?: number }) {
  const { profile, signOut } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  useEffect(() => setMobileOpen(false), [location.pathname]);

  const links = [
    { to: '/owner', label: 'Overview', icon: LayoutDashboard, end: true },
    { to: '/owner/businesses', label: 'My Businesses', icon: Store },
    { to: '/owner/listing', label: 'Edit Listing', icon: Edit3 },
    { to: '/owner/sdk-jobs', label: 'SDK Jobs', icon: BriefcaseBusiness },
    { to: '/add-business', label: 'Add Business', icon: PlusCircle },
    { to: '/owner/products', label: 'Products', icon: Package },
    { to: '/owner/offers', label: 'Offers', icon: Tag },
    { to: '/owner/reviews', label: 'Reviews', icon: Star },
    { to: '/owner/inquiries', label: 'Inquiries', icon: MessageSquare },
    { to: '/owner/analytics', label: 'Analytics', icon: BarChart3 },
    { to: '/owner/plan', label: 'Plan & Benefits', icon: Crown },
    { to: '/owner/payments', label: 'My Payments', icon: Receipt },
    { to: '/owner/notifications', label: 'Notifications', icon: Bell, badge: unreadCount },
    { to: '/owner/profile', label: 'Profile', icon: UserCircle },
    { to: '/owner/public-profile', label: 'Public Profile', icon: UserCheck },
  ];

  return (
    <>
      {/* Compact mobile menu; every Owner destination remains available. */}
      <div className="lg:hidden bg-surface-container-lowest border-b border-outline-variant/40 px-4 py-2.5">
        <div className="flex items-center justify-between gap-3">
          <Link
            to="/"
            className="px-3 py-2 rounded-xl bg-surface-container-low text-xs font-semibold text-on-surface-variant inline-flex items-center gap-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Directory
          </Link>
          <span className="text-xs font-bold text-on-surface">Owner Portal</span>
          <button
            type="button"
            onClick={() => setMobileOpen((open) => !open)}
            aria-expanded={mobileOpen}
            aria-controls="owner-mobile-navigation"
            aria-label={mobileOpen ? 'Close Owner menu' : 'Open Owner menu'}
            className="min-h-10 min-w-10 rounded-xl bg-surface-container-low text-on-surface inline-flex items-center justify-center"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
        {mobileOpen && (
          <nav id="owner-mobile-navigation" className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-3" aria-label="Owner navigation">
            {links.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    `min-h-10 px-3 py-2 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 transition-colors ${
                      isActive
                        ? 'bg-primary text-on-primary shadow-xs'
                        : 'bg-surface-container-low text-on-surface-variant hover:text-primary'
                    }`
                  }
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{item.label}</span>
                  {item.badge && item.badge > 0 ? (
                    <span className="px-1.5 py-0.5 rounded-full bg-secondary-container text-on-secondary-container text-[10px] font-bold">
                      {item.badge}
                    </span>
                  ) : null}
                </NavLink>
              );
            })}
            <button
              type="button"
              onClick={() => signOut()}
              className="min-h-10 px-3 py-2 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 bg-error-container/40 text-error hover:bg-error-container"
            >
              <LogOut className="w-3.5 h-3.5" /> Sign Out
            </button>
          </nav>
        )}
      </div>

      {/* Desktop sticky sidebar under frozen header */}
      <aside className="hidden lg:flex flex-col w-64 shrink-0 bg-surface-container-lowest border-e border-outline-variant/40 lg:sticky lg:top-[102px] lg:h-[calc(100vh-102px-49px)] overflow-y-auto p-4 justify-between">
        <div className="space-y-4">
          <div className="p-3 rounded-2xl bg-surface-container-low border border-outline-variant/30">
            <span className="text-[11px] font-bold uppercase tracking-wider text-primary">
              Owner Portal
            </span>
            <p className="text-sm font-bold text-on-surface truncate mt-0.5">
              {profile?.full_name || 'Business Owner'}
            </p>
            <p className="font-urdu text-[11px] text-on-surface-variant" dir="rtl">
              بزنس اونر پورٹل
            </p>
          </div>

          <nav className="space-y-1" aria-label="Owner navigation">
            {links.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
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
                  {item.badge && item.badge > 0 ? (
                    <span className="px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container text-[11px] font-bold tabular-nums">
                      {item.badge}
                    </span>
                  ) : null}
                </NavLink>
              );
            })}
          </nav>
        </div>

        <div className="space-y-2 pt-4 border-t border-outline-variant/30">
          <Link
            to="/"
            className="w-full px-3 py-2.5 rounded-xl text-xs font-semibold text-on-surface-variant hover:bg-surface-container-low flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Public Directory
          </Link>
          <button
            type="button"
            onClick={() => signOut()}
            className="w-full px-3 py-2.5 rounded-xl text-xs font-semibold text-error hover:bg-error-container/40 flex items-center gap-2 cursor-pointer"
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}
