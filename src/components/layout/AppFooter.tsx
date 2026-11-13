import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, ChevronDown, ChevronUp, PhoneCall, X } from 'lucide-react';
import { Container } from '../ui/Surface';
import { useI18n } from '../../lib/i18n';

export function AppFooter({
  withBottomNavOffset = false,
  variant = 'public',
}: {
  withBottomNavOffset?: boolean;
  variant?: 'public' | 'portal';
}) {
  const { lang, urduHints, t } = useI18n();
  const [expanded, setExpanded] = useState(false);

  const bottomOffsetClass =
    withBottomNavOffset
      ? 'bottom-16 md:bottom-0'
      : variant === 'portal'
      ? 'bottom-0 md:bottom-0'
      : 'bottom-0';

  return (
    <>
      {/* Expandable Full Directory Drawer above Frozen Footer */}
      {expanded && (
        <div
          className={`fixed inset-x-0 z-40 ${
            withBottomNavOffset ? 'bottom-[101px] md:bottom-12' : 'bottom-[37px] md:bottom-12'
          } bg-surface-container-lowest/98 backdrop-blur-xl border-t border-outline-variant/50 shadow-[0_-12px_32px_rgba(0,0,0,0.12)] max-h-[70vh] overflow-y-auto`}
          role="region"
          aria-label="Full directory footer links"
        >
          <Container className="py-6">
            <div className="flex items-center justify-between gap-3 pb-4 mb-5 border-b border-outline-variant/30">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-primary text-on-primary flex items-center justify-center">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <div dir="ltr" className="text-sm font-extrabold text-on-surface">
                    <span className="text-primary">Hello</span>{' '}
                    <span className="text-secondary-container">Sadiqabad</span>
                  </div>
                  {(lang === 'ur' || urduHints) && (
                    <p className="font-urdu text-[11px] text-on-surface-variant" dir="rtl">
                      صادق آباد کا اپنا لوکل ڈائریکٹری پورٹل
                    </p>
                  )}
                </div>
              </div>
              <button
                type="button"
                aria-label="Close directory footer"
                onClick={() => setExpanded(false)}
                className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-on-surface cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 text-xs text-on-surface-variant">
              <div className="sm:col-span-2 space-y-3">
                <p className="leading-relaxed max-w-md">
                  Trusted bilingual city phone book, verified local business directory, and 24/7
                  offline-ready emergency helplines for Tehsil Sadiqabad, District Rahim Yar Khan.
                </p>
                <Link
                  to="/emergency"
                  onClick={() => setExpanded(false)}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-error text-on-error text-xs font-bold shadow-xs"
                >
                  <PhoneCall className="w-4 h-4" />
                  <span>24/7 Emergency Helplines: 1122 / 15 / 16</span>
                </Link>
              </div>

              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-on-surface">Directory</h3>
                <ul className="space-y-1.5" onClick={() => setExpanded(false)}>
                  <li><Link to="/search" className="hover:text-primary">Search Directory</Link></li>
                  <li><Link to="/categories" className="hover:text-primary">All Categories</Link></li>
                  <li><Link to="/offers" className="hover:text-primary">Local Offers &amp; Deals</Link></li>
                  <li><Link to="/map" className="hover:text-primary">City Map Explorer</Link></li>
                  <li><Link to="/announcements" className="hover:text-primary">City Notices</Link></li>
                  <li><Link to="/add-business" className="hover:text-primary font-semibold text-primary">Add Your Business</Link></li>
                </ul>
              </div>

              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-on-surface">Civic &amp; Info</h3>
                <ul className="space-y-1.5" onClick={() => setExpanded(false)}>
                  <li><Link to="/about" className="hover:text-primary">About Us</Link></li>
                  <li><Link to="/advertise" className="hover:text-primary">Advertise &amp; Plans</Link></li>
                  <li><Link to="/contact" className="hover:text-primary">Contact Desk</Link></li>
                  <li><Link to="/faq" className="hover:text-primary">FAQ</Link></li>
                  <li><Link to="/terms" className="hover:text-primary">Terms of Use</Link></li>
                  <li><Link to="/privacy" className="hover:text-primary">Privacy Policy</Link></li>
                  <li><Link to="/listing-terms" className="hover:text-primary">Listing Guidelines</Link></li>
                  <li><Link to="/login" className="hover:text-primary font-semibold">Owner / Admin Login</Link></li>
                </ul>
              </div>
            </div>
          </Container>
        </div>
      )}

      {/* Persistent Frozen Footer Bar */}
      <footer
        data-testid="frozen-app-footer"
        className={`fixed ${bottomOffsetClass} inset-x-0 z-30 bg-surface-container-lowest/95 backdrop-blur-xl border-t border-outline-variant/40 shadow-[0_-2px_10px_rgba(0,0,0,0.06)] text-on-surface-variant`}
      >
        <div className="max-w-7xl mx-auto px-3 sm:px-6 h-9 md:h-12 flex items-center justify-between gap-2 text-[11px] sm:text-xs">
          {/* Left: Brand & Copyright */}
          <div className="flex items-center gap-2 min-w-0">
            <Link to="/" dir="ltr" className="font-extrabold text-primary whitespace-nowrap truncate">
              Hello <span className="text-secondary-container">Sadiqabad</span>
            </Link>
            <span className="hidden sm:inline text-outline-variant">|</span>
            <span className="hidden sm:inline truncate">
              © {new Date().getFullYear()} Tehsil Sadiqabad, Punjab
            </span>
          </div>

          {/* Center: Compact Civic Quick Links (Desktop) */}
          <nav
            aria-label="Footer quick links"
            className="hidden md:flex items-center gap-3 font-medium"
          >
            <Link
              to="/emergency"
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-error/10 text-error font-bold hover:bg-error hover:text-on-error transition-colors whitespace-nowrap"
            >
              <PhoneCall className="w-3 h-3" /> 1122 / 15 / 16
            </Link>
            <Link to="/about" className="hover:text-primary whitespace-nowrap">
              {t('nav.about', 'About')}
            </Link>
            <Link to="/offers" className="hover:text-primary whitespace-nowrap">
              {t('nav.offers', 'Offers')}
            </Link>
            <Link to="/add-business" className="hover:text-primary font-semibold text-primary whitespace-nowrap">
              {t('nav.addBusiness', 'Add Business')}
            </Link>
            <Link to="/faq" className="hover:text-primary whitespace-nowrap">
              {t('nav.faq', 'FAQ')}
            </Link>
            <Link to="/privacy" className="hover:text-primary whitespace-nowrap">
              {t('nav.privacy', 'Privacy')}
            </Link>
            <Link to="/terms" className="hover:text-primary whitespace-nowrap">
              {t('nav.terms', 'Terms')}
            </Link>
          </nav>

          {/* Right: Emergency Mobile Shortcut + Expand Full Footer Trigger */}
          <div className="flex items-center gap-2 shrink-0">
            <Link
              to="/emergency"
              className="md:hidden inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-error/10 text-error font-bold text-[10px] whitespace-nowrap"
            >
              <PhoneCall className="w-3 h-3" /> 1122
            </Link>
            <button
              type="button"
              onClick={() => setExpanded((prev) => !prev)}
              aria-expanded={expanded}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-semibold text-[11px] transition-colors cursor-pointer whitespace-nowrap"
            >
              <span>{expanded ? 'Hide Links' : 'All Links'}</span>
              {expanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </footer>
    </>
  );
}
