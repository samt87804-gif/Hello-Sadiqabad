import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import {
  ArrowLeft,
  BarChart3,
  Bell,
  Crown,
  Edit3,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Star,
  Tag,
  UserCircle,
} from 'lucide-react';
import { useAuth } from '../../lib/auth';

export function OwnerNav({ unreadCount = 0 }: { unreadCount?: number }) {
  const { profile, signOut } = useAuth();

  const links = [
    { to: '/owner', label: 'Overview', icon: LayoutDashboard, end: true },
    { to: '/owner/listing', label: 'Edit Listing', icon: Edit3 },
    { to: '/owner/offers', label: 'Offers', icon: Tag },
    { to: '/owner/reviews', label: 'Reviews', icon: Star },
    { to: '/owner/inquiries', label: 'Inquiries', icon: MessageSquare },
    { to: '/owner/analytics', label: 'Analytics', icon: BarChart3 },
    { to: '/owner/plan', label: 'Plan & Benefits', icon: Crown },
    { to: '/owner/notifications', label: 'Notifications', icon: Bell, badge: unreadCount },
    { to: '/owner/profile', label: 'Profile', icon: UserCircle },
  ];

  return (
    <>
      {/* Mobile / Tablet horizontal scroll nav */}
      <div className="lg:hidden bg-surface-container-lowest border-b border-outline-variant/40 px-4 py-2.5 flex items-center gap-2 overflow-x-auto no-scrollbar">
        <Link
          to="/"
          className="px-3 py-2 rounded-xl bg-surface-container-low text-xs font-semibold text-on-surface-variant inline-flex items-center gap-1 shrink-0"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Directory
        </Link>
        {links.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
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
              {item.badge && item.badge > 0 ? (
                <span className="px-1.5 py-0.2 rounded-full bg-secondary-container text-on-secondary-container text-[10px] font-bold">
                  {item.badge}
                </span>
              ) : null}
            </NavLink>
          );
        })}
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
