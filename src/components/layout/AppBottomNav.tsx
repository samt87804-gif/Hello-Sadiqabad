import React from 'react';
import { NavLink } from 'react-router-dom';
import { Bookmark, BriefcaseBusiness, Home, Landmark, Search } from 'lucide-react';
import { useI18n } from '../../lib/i18n';

export function AppBottomNav() {
  const { lang, urduHints, t } = useI18n();

  const tabs = [
    { to: '/', label: t('nav.home', 'Home'), ur: 'ہوم', icon: Home, end: true },
    { to: '/search', label: t('nav.search', 'Search'), ur: 'تلاش', icon: Search },
    { to: '/gov', label: lang === 'ur' ? 'حکومت' : 'Gov', ur: 'حکومت', icon: Landmark },
    { to: '/sdk-jobs', label: lang === 'ur' ? 'مقامی نوکریاں' : 'SDK Jobs', ur: 'مقامی نوکریاں', icon: BriefcaseBusiness },
    { to: '/favorites', label: t('nav.favorites', 'Saved'), ur: 'پسندیدہ', icon: Bookmark },
  ];

  return (
    <nav
      aria-label={lang === 'ur' ? 'موبائل نیویگیشن' : 'Mobile bottom navigation'}
      className="md:hidden fixed bottom-0 inset-x-0 z-40 pb-safe bg-surface-container-lowest/95 backdrop-blur-xl border-t border-outline-variant/40 shadow-[0_-2px_10px_rgba(0,0,0,0.06)]"
    >
      <div className="grid grid-cols-5 h-16 max-w-lg mx-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <NavLink
              key={tab.to}
              to={tab.to}
              end={tab.end}
              className={({ isActive }) =>
                `hs-nav-link min-w-0 flex flex-col items-center justify-center gap-0.5 px-0.5 text-[10px] sm:text-[11px] font-semibold transition-colors ${
                  isActive
                    ? 'text-primary font-bold'
                    : 'text-on-surface-variant hover:text-primary'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="truncate max-w-full leading-tight">{tab.label}</span>
              {lang === 'en' && urduHints && (
                <span className="font-urdu text-[9px] leading-none opacity-80" dir="rtl">
                  {tab.ur}
                </span>
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
