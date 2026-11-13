import React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { BookOpen, Moon, PlusCircle, Search, ShieldCheck, Sun, User } from 'lucide-react';
import { useTheme } from '../../lib/theme';
import { useI18n } from '../../lib/i18n';
import { useAuth } from '../../lib/auth';
import { LanguageMenu } from './LanguageMenu';

export function AppHeader() {
  const { theme, toggleTheme } = useTheme();
  const { lang, urduHints, t } = useI18n();
  const { user, role } = useAuth();
  const navigate = useNavigate();

  const portalLink = user
    ? role === 'owner'
      ? '/owner'
      : '/admin'
    : '/login';

  const navItems = [
    { to: '/', label: t('nav.home', 'Home') },
    { to: '/search', label: t('nav.search', 'Search') },
    { to: '/categories', label: t('nav.categories', 'Categories') },
    { to: '/offers', label: t('nav.offers', 'Offers') },
    { to: '/map', label: t('nav.map', 'Map') },
    { to: '/emergency', label: t('nav.emergency', 'Emergency') },
  ];

  return (
    <header
      data-testid="frozen-app-header"
      className="fixed top-0 inset-x-0 z-40 pt-safe bg-surface/95 backdrop-blur-xl border-b border-outline-variant/30 shadow-xs"
    >
      {/* Stitch Civic Strip */}
      <div className="bg-primary text-on-primary px-4 py-1 flex items-center justify-center gap-2 text-center overflow-hidden">
        <ShieldCheck className="w-3.5 h-3.5 text-primary-fixed shrink-0" />
        {(lang === 'ur' || urduHints) && (
          <span className="font-urdu text-[11px] font-semibold tracking-wide truncate" dir="rtl">
            صادق آباد کا اپنا لوکل ڈائریکٹری پورٹل
          </span>
        )}
        {lang === 'en' && urduHints && <span className="opacity-50 text-[10px]">|</span>}
        {lang === 'en' && (
          <span className="text-[11px] font-semibold tracking-tight whitespace-nowrap">
            {t('brand.civicStrip', 'Sadiqabad Local Directory')}
          </span>
        )}
      </div>

      {/* Main Nav Row */}
      <div className="max-w-6xl mx-auto h-14 sm:h-16 px-3 sm:px-6 flex items-center justify-between gap-2 sm:gap-3 min-w-0">
        <Link to="/" className="flex items-center gap-2 sm:gap-2.5 min-w-0 shrink">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-primary flex items-center justify-center shadow-sm text-on-primary shrink-0">
            <BookOpen className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="flex flex-col leading-none min-w-0">
            <div
              dir="ltr"
              className="flex items-center gap-1 text-[15px] sm:text-lg font-extrabold tracking-tight truncate"
            >
              <span className="text-primary">Hello</span>
              <span className="text-secondary-container">Sadiqabad</span>
            </div>
            {(lang === 'ur' || urduHints) ? (
              <span className="font-urdu text-[10px] text-on-surface-variant leading-relaxed -mt-0.5 truncate" dir="rtl">
                رحیم یار خان، پنجاب
              </span>
            ) : (
              <span className="text-[10px] text-on-surface-variant font-medium truncate">
                Rahim Yar Khan, Punjab
              </span>
            )}
          </div>
        </Link>

        {/* Desktop Nav Links */}
        <nav className="hidden lg:flex items-center gap-1" aria-label="Main navigation">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `px-3 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-primary text-on-primary shadow-xs'
                    : 'text-on-surface-variant hover:text-primary hover:bg-surface-container-low'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          <Link
            to="/add-business"
            className="hidden md:inline-flex items-center gap-1.5 h-10 px-3.5 rounded-xl bg-secondary-fixed text-on-secondary-fixed text-xs font-bold hover:brightness-95 transition-all whitespace-nowrap shrink-0"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{t('nav.addBusiness', 'Add Business')}</span>
          </Link>

          <LanguageMenu />

          <button
            type="button"
            aria-label="Quick Search"
            onClick={() => navigate('/search')}
            className="hidden sm:flex w-10 h-10 rounded-full items-center justify-center text-on-surface-variant hover:bg-surface-container-low hover:text-primary transition-colors cursor-pointer shrink-0"
          >
            <Search className="w-5 h-5" />
          </button>

          <button
            type="button"
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            onClick={toggleTheme}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container-low hover:text-primary transition-colors cursor-pointer shrink-0"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 sm:w-5 sm:h-5" /> : <Moon className="w-4 h-4 sm:w-5 sm:h-5" />}
          </button>

          <Link
            to={portalLink}
            aria-label={user ? 'Open Portal' : 'Portal Login'}
            title={user ? 'Open Portal' : 'Portal Login'}
            className="w-9 h-9 sm:w-auto sm:h-10 sm:px-3 rounded-full bg-primary text-on-primary flex items-center justify-center gap-1.5 shadow-sm hover:bg-primary-container transition-colors shrink-0"
          >
            <User className="w-4 h-4" />
            <span className="hidden sm:inline text-xs font-bold whitespace-nowrap">
              {user ? (role === 'owner' ? 'Owner' : 'Admin') : 'Portal'}
            </span>
          </Link>
        </div>
      </div>
    </header>
  );
}
