import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { RefreshCw, WifiOff } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useOnlineStatus } from '../../lib/hooks';
import { useI18n } from '../../lib/i18n';
import { AppHeader } from './AppHeader';
import { AnnouncementBar } from './AnnouncementBar';
import { AppBottomNav } from './AppBottomNav';
import { AppFooter } from './AppFooter';
import { PopupAdModal } from '../directory/AdBanner';
import { DemoModeNotice } from '../ui/DemoModeNotice';
import { ChatbotWidget } from './ChatbotWidget';
import { checkForOfflineContentUpdates } from '../../lib/offlineUpdates';

export function PwaUpdateToast() {
  const [hasUpdate, setHasUpdate] = useState(false);

  useEffect(() => {
    const onUpdate = () => setHasUpdate(true);
    window.addEventListener('hs-sw-update', onUpdate);
    return () => window.removeEventListener('hs-sw-update', onUpdate);
  }, []);

  if (!hasUpdate) return null;

  return (
    <div className="fixed top-20 end-4 z-50 bg-inverse-surface text-inverse-on-surface px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3 text-xs font-semibold">
      <span>Directory update available</span>
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="px-3 py-1.5 rounded-lg bg-primary text-on-primary inline-flex items-center gap-1 cursor-pointer"
      >
        <RefreshCw className="w-3.5 h-3.5" /> Refresh
      </button>
    </div>
  );
}

export function AppShell({
  children,
  hideFooter = false,
  hideBottomNav = false,
  hideHeader = false,
}: {
  children: React.ReactNode;
  hideFooter?: boolean;
  hideBottomNav?: boolean;
  hideHeader?: boolean;
}) {
  const location = useLocation();
  const isOnline = useOnlineStatus();
  const { t } = useI18n();
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  useEffect(() => {
    let active = true;
    import('../../lib/api').then(({ fetchPublicSiteSettings }) =>
      fetchPublicSiteSettings()
        .then((s) => {
          if (active) setMaintenanceMode(Boolean(s.maintenance_mode));
        })
        .catch(() => undefined)
    );
    return () => {
      active = false;
    };
  }, []);

  const showFooter = !hideFooter;
  const showBottomNav = !hideBottomNav;
  const isAdminPath = location.pathname === '/admin' || location.pathname.startsWith('/admin/');
  const isOwnerPortalPath = location.pathname === '/owner' || location.pathname.startsWith('/owner/');
  useEffect(() => {
    if (isAdminPath || isOwnerPortalPath) return;
    const check = () => { void checkForOfflineContentUpdates(); };
    check();
    window.addEventListener('online', check);
    const timer = window.setInterval(check, 10 * 60 * 1000);
    return () => {
      window.removeEventListener('online', check);
      window.clearInterval(timer);
    };
  }, [isAdminPath, isOwnerPortalPath]);

  const showChatbot = !hideHeader && !isAdminPath && !isOwnerPortalPath &&
    !['/login', '/owner-register', '/forgot-password', '/reset-password', '/change-password'].includes(location.pathname);

  return (
    <div className="min-h-screen flex flex-col bg-surface text-on-surface overflow-x-clip">
      {!hideHeader && <AppHeader />}

      {/* Clearance for fixed AppHeader (~92px mobile / ~100px desktop) and frozen footer / bottom nav */}
      {!hideHeader && <div className="pt-[93px] sm:pt-[102px]">
        <DemoModeNotice />
        <AnnouncementBar />

        {maintenanceMode && (
          <div className="bg-secondary-fixed text-on-secondary-fixed px-4 py-2 text-xs font-semibold border-b border-secondary/30">
            <div className="max-w-6xl mx-auto flex items-center justify-between gap-2">
              <span>
                Scheduled Directory Maintenance Active — Public lookup &amp; 24/7 emergency helplines remain open.
              </span>
              <Link to="/emergency" className="underline font-bold shrink-0">
                1122 / 15
              </Link>
            </div>
          </div>
        )}

        {!isOnline && (
          <div className="bg-amber-100 dark:bg-amber-950/70 text-amber-950 dark:text-amber-100 px-4 py-2 text-xs font-semibold border-b border-amber-300/60">
            <div className="max-w-6xl mx-auto flex items-center justify-between gap-2">
              <span className="flex items-center gap-2">
                <WifiOff className="w-4 h-4 shrink-0" />
                {t('offline.banner', 'You are offline. Emergency numbers remain available.')}
              </span>
              <Link to="/emergency" className="underline font-bold shrink-0">
                Open Emergency
              </Link>
            </div>
          </div>
        )}
      </div>}

      <main
        className={`flex-1 w-full min-w-0 ${
          showBottomNav && showFooter
            ? 'pb-28 md:pb-16'
            : showBottomNav
            ? 'pb-20 md:pb-8'
            : showFooter
            ? 'pb-14 md:pb-16'
            : 'pb-8'
        }`}
      >
        <div key={location.pathname} className="hs-page-enter">
          {children}
        </div>
      </main>

      {showFooter && <AppFooter withBottomNavOffset={showBottomNav} />}
      {showBottomNav && <AppBottomNav />}
      <PwaUpdateToast />
      {!hideHeader && <PopupAdModal />}
      {showChatbot && <ChatbotWidget />}
    </div>
  );
}
