import React, { useEffect, useState } from 'react';
import { Download, HardDrive, Wifi, WifiOff, XCircle } from 'lucide-react';
import { AppShell } from '../components/layout/AppShell';
import { fetchActiveAds, fetchAllAreas, fetchAllCategories, fetchAnnouncementsForOffline, fetchAuthorityProfiles, fetchBusinessBySlug, fetchBusinessProductsForOffline, fetchBusinessesForOfflineDownload, fetchEmergencyContacts, fetchLocalAuthorities, fetchPublishedGovernmentJobs, fetchPublishedNewsArticles, fetchPublishedPagesForOffline, fetchPublicBusinessProductImageUrls, fetchPublicOwnerProfilesForOffline, fetchSiteSettings, getPublicOfflineContentVersion, searchBusinesses } from '../lib/api';
import { fetchPublishedGovernmentSchemes } from '../lib/governmentSchemes';
import { cacheOfflineImages, getOfflineImageDisplayUrl } from '../lib/offlineImages';
import { beginOfflineDownload, cancelOfflineDownload, finishOfflineDownload, getOfflineDownloadController, getOfflineDownloadState, publishOfflineDownloadState, subscribeOfflineDownloadState } from '../lib/offlineDownloadState';
import { clearOfflineUpdateAvailable } from '../lib/offlineUpdates';
import { useI18n } from '../lib/i18n';
import {
  getOfflineDirectoryMetadata,
  isOfflineDirectorySupported,
  saveOfflineDirectorySnapshot,
  toOfflineArea,
  toOfflineBusiness,
  toOfflineCategory,
  toOfflineEmergencyContact,
  validateOfflineDirectorySnapshot,
  OFFLINE_DIRECTORY_SCHEMA_VERSION,
  type OfflineSnapshotMetadata,
} from '../lib/offlineDirectory';

type DownloadStatus = 'idle' | 'downloading' | 'saving' | 'success' | 'success-with-warnings' | 'error' | 'cancelled';

type OfflineReadinessReport = {
  serviceWorkerSupported: boolean;
  indexedDbWriteReadPassed: boolean;
  indexedDbAbortRollbackPassed: boolean;
  indexedDbConcurrentTransactionsPassed: boolean;
  activeWorker: boolean;
  waitingWorker: boolean;
  appShellCached: boolean;
  emergencyFallbackCached: boolean;
  manifestAssetCount: number;
  cachedAssetCount: number;
  missingAssets: string[];
  directoryPackageSaved: boolean;
  offlineReadAdaptersPassed: boolean;
  offlineReadCounts?: {
    businesses: number;
    categories: number;
    areas: number;
    emergencyContacts: number;
  };
  error?: string;
  checkedAt: string;
};

async function runOfflineReadAdapterProbe(): Promise<{
  passed: boolean;
  counts: { businesses: number; categories: number; areas: number; emergencyContacts: number };
}> {
  const empty = { businesses: 0, categories: 0, areas: 0, emergencyContacts: 0 };
  const originalDescriptor = Object.getOwnPropertyDescriptor(navigator, 'onLine');
  let overrideApplied = false;

  try {
    Object.defineProperty(navigator, 'onLine', { configurable: true, value: false });
    overrideApplied = navigator.onLine === false;
    if (!overrideApplied) return { passed: false, counts: empty };

    const [searchResult, categories, areas, emergency] = await Promise.all([
      searchBusinesses({}, { page: 1, limit: 1, logSearch: false }),
      fetchAllCategories(),
      fetchAllAreas(),
      fetchEmergencyContacts(),
    ]);
    const firstBusiness = searchResult.items[0];
    const businessDetail = firstBusiness ? await fetchBusinessBySlug(firstBusiness.slug) : null;
    const metadata = await getOfflineDirectoryMetadata();
    const counts = {
      businesses: searchResult.total,
      categories: categories.length,
      areas: areas.length,
      emergencyContacts: emergency.items.length,
    };

    return {
      passed: metadata !== null &&
        counts.businesses === metadata.counts.businesses &&
        counts.categories === metadata.counts.categories &&
        counts.areas === metadata.counts.areas &&
        counts.emergencyContacts === metadata.counts.emergency_contacts &&
        (!firstBusiness || businessDetail?.id === firstBusiness.id),
      counts,
    };
  } catch {
    return { passed: false, counts: empty };
  } finally {
    if (originalDescriptor) {
      Object.defineProperty(navigator, 'onLine', originalDescriptor);
    } else if (overrideApplied) {
      delete (navigator as unknown as { onLine?: boolean }).onLine;
    }
  }
}

async function runNativeIndexedDbProbe(): Promise<{
  writeReadPassed: boolean;
  abortRollbackPassed: boolean;
  concurrentTransactionsPassed: boolean;
}> {
  if (typeof indexedDB === 'undefined') {
    return { writeReadPassed: false, abortRollbackPassed: false, concurrentTransactionsPassed: false };
  }

  const databaseName = 'hs-offline-readiness-probe-' +
    Date.now().toString(36) + '-' + Math.random().toString(36).slice(2);
  let database: IDBDatabase | null = null;

  try {
    database = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open(databaseName, 1);
      request.onupgradeneeded = () => {
        request.result.createObjectStore('probe', { keyPath: 'id' });
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error ?? new Error('IndexedDB open failed.'));
      request.onblocked = () => reject(new Error('Temporary IndexedDB probe was blocked.'));
    });

    await new Promise<void>((resolve, reject) => {
      const transaction = database!.transaction('probe', 'readwrite');
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error ?? new Error('IndexedDB write failed.'));
      transaction.onabort = () => reject(transaction.error ?? new Error('IndexedDB write aborted.'));
      transaction.objectStore('probe').put({ id: 'committed', value: 'verified' });
    });

    const storedValue = await new Promise<unknown>((resolve, reject) => {
      const transaction = database!.transaction('probe', 'readonly');
      const request = transaction.objectStore('probe').get('committed');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error ?? new Error('IndexedDB read failed.'));
    });
    const writeReadPassed = Boolean(
      storedValue && typeof storedValue === 'object' &&
      (storedValue as { value?: unknown }).value === 'verified'
    );

    const abortEventObserved = await new Promise<boolean>((resolve) => {
      const transaction = database!.transaction('probe', 'readwrite');
      transaction.onabort = () => resolve(true);
      transaction.onerror = () => undefined;
      transaction.oncomplete = () => resolve(false);
      transaction.objectStore('probe').put({ id: 'aborted', value: 'must-not-persist' });
      transaction.abort();
    });

    const abortedValue = await new Promise<unknown>((resolve, reject) => {
      const transaction = database!.transaction('probe', 'readonly');
      const request = transaction.objectStore('probe').get('aborted');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error ?? new Error('IndexedDB abort verification failed.'));
    });

    const writeConcurrentRecord = (id: string) => new Promise<void>((resolve, reject) => {
      const transaction = database!.transaction('probe', 'readwrite');
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error ?? new Error('Concurrent IndexedDB write failed.'));
      transaction.onabort = () => reject(transaction.error ?? new Error('Concurrent IndexedDB write aborted.'));
      transaction.objectStore('probe').put({ id, value: id });
    });
    await Promise.all([
      writeConcurrentRecord('concurrent-a'),
      writeConcurrentRecord('concurrent-b'),
    ]);
    const concurrentValues = await Promise.all(['concurrent-a', 'concurrent-b'].map((id) =>
      new Promise<unknown>((resolve, reject) => {
        const transaction = database!.transaction('probe', 'readonly');
        const request = transaction.objectStore('probe').get(id);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error ?? new Error('Concurrent IndexedDB read failed.'));
      })
    ));
    const concurrentTransactionsPassed = concurrentValues.every((value, index) =>
      Boolean(value && typeof value === 'object' && (value as { value?: unknown }).value ===
        (index === 0 ? 'concurrent-a' : 'concurrent-b'))
    );

    return {
      writeReadPassed,
      abortRollbackPassed: abortEventObserved && abortedValue === undefined,
      concurrentTransactionsPassed,
    };
  } catch {
    return { writeReadPassed: false, abortRollbackPassed: false, concurrentTransactionsPassed: false };
  } finally {
    database?.close();
    await new Promise<void>((resolve) => {
      const request = indexedDB.deleteDatabase(databaseName);
      request.onsuccess = () => resolve();
      request.onerror = () => resolve();
      request.onblocked = () => resolve();
    });
  }
}

function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '—';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

function raceWithAbort<T>(promise: Promise<T>, signal: AbortSignal): Promise<T> {
  if (signal.aborted) return Promise.reject(new DOMException('Download cancelled.', 'AbortError'));
  return new Promise((resolve, reject) => {
    const onAbort = () => {
      signal.removeEventListener('abort', onAbort);
      reject(new DOMException('Download cancelled.', 'AbortError'));
    };
    signal.addEventListener('abort', onAbort, { once: true });
    promise.then(
      (value) => {
        signal.removeEventListener('abort', onAbort);
        resolve(value);
      },
      (error) => {
        signal.removeEventListener('abort', onAbort);
        reject(error);
      }
    );
  });
}

export function OfflineData() {
  const { lang } = useI18n();
  const isUrdu = lang === 'ur';
  const [isOnline, setIsOnline] = useState(() => typeof navigator === 'undefined' || navigator.onLine);
  const initialDownloadState = getOfflineDownloadState();
  const [status, setStatusLocal] = useState<DownloadStatus>(initialDownloadState.status);
  const [progress, setProgressLocal] = useState(initialDownloadState.progress);
  const [message, setMessageLocal] = useState(initialDownloadState.message);
  const [estimatedBytes, setEstimatedBytesLocal] = useState(initialDownloadState.estimatedBytes);
  const setStatus = (value: DownloadStatus) => { setStatusLocal(value); publishOfflineDownloadState({ status: value }); };
  const setProgress = (value: number) => { setProgressLocal(value); publishOfflineDownloadState({ progress: value }); };
  const setMessage = (value: string) => { setMessageLocal(value); publishOfflineDownloadState({ message: value }); };
  const setEstimatedBytes = (value: number) => { setEstimatedBytesLocal(value); publishOfflineDownloadState({ estimatedBytes: value }); }
  const [storageUsage, setStorageUsage] = useState<{ usage: number; quota: number } | null>(null);
  const [metadata, setMetadata] = useState<OfflineSnapshotMetadata | null>(null);
  const [readiness, setReadiness] = useState<OfflineReadinessReport | null>(null);
  const [checkingReadiness, setCheckingReadiness] = useState(false);

  useEffect(() => {
    const unsubscribeDownload = subscribeOfflineDownloadState((value) => {
      setStatusLocal(value.status);
      setProgressLocal(value.progress);
      setMessageLocal(value.message);
      setEstimatedBytesLocal(value.estimatedBytes);
    });
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);

    if (isOfflineDirectorySupported()) {
      getOfflineDirectoryMetadata().then(setMetadata).catch(() => setMetadata(null));
      void refreshStorageEstimate();
    }

    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
      unsubscribeDownload();
    };
  }, []);

  const busy = status === 'downloading' || status === 'saving';
  const supported = isOfflineDirectorySupported();

  const refreshStorageEstimate = async () => {
    if (typeof navigator === 'undefined' || !navigator.storage?.estimate) {
      setStorageUsage(null);
      return;
    }
    try {
      const estimate = await navigator.storage.estimate();
      if (typeof estimate.usage === 'number' && typeof estimate.quota === 'number' && estimate.quota > 0) {
        setStorageUsage({ usage: estimate.usage, quota: estimate.quota });
      } else {
        setStorageUsage(null);
      }
    } catch {
      setStorageUsage(null);
    }
  };

  const runReadinessCheck = async () => {
    setCheckingReadiness(true);
    try {
      if (!('serviceWorker' in navigator) || !('caches' in window)) {
        const idbProbe = await runNativeIndexedDbProbe();
        setReadiness({
          serviceWorkerSupported: false,
          indexedDbWriteReadPassed: idbProbe.writeReadPassed,
          indexedDbAbortRollbackPassed: idbProbe.abortRollbackPassed,
          indexedDbConcurrentTransactionsPassed: idbProbe.concurrentTransactionsPassed,
          activeWorker: false,
          waitingWorker: false,
          appShellCached: false,
          emergencyFallbackCached: false,
          manifestAssetCount: 0,
          cachedAssetCount: 0,
          missingAssets: [],
          directoryPackageSaved: Boolean(await getOfflineDirectoryMetadata().catch(() => null)),
          offlineReadAdaptersPassed: false,
          error: 'This browser does not expose Service Worker and Cache Storage APIs.',
          checkedAt: new Date().toISOString(),
        });
        return;
      }

      let registration = await navigator.serviceWorker.getRegistration('/');
      if (!registration) registration = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;

      const cache = await caches.open('hs-sadiqabad-shell-v4');
      const [appShell, emergencyFallback] = await Promise.all([
        cache.match(new URL('/', window.location.origin).href),
        cache.match(new URL('/offline.html', window.location.origin).href),
      ]);

      let manifestResponse = await cache.match(new URL('/offline-precache.json', window.location.origin).href);
      if (!manifestResponse) {
        const networkManifest = await fetch('/offline-precache.json', { cache: 'no-store', signal: AbortSignal.timeout(8000) });
        if (!networkManifest.ok) throw new Error('The app asset manifest is not available in this browser.');
        manifestResponse = networkManifest;
      }

      const manifestValue: unknown = await manifestResponse.json();
      const manifestAssets = Array.isArray(manifestValue)
        ? manifestValue.filter((path): path is string =>
            typeof path === 'string' &&
            path.startsWith('/assets/') &&
            /-[A-Za-z0-9_-]{6,}\.(?:js|css)$/.test(path)
          )
        : [];
      const cachedRequests = await cache.keys();
      const cachedPaths = new Set(cachedRequests.map((request) => new URL(request.url).pathname));
      const missingAssets = manifestAssets.filter((path) => !cachedPaths.has(path));
      const savedMetadata = await getOfflineDirectoryMetadata().catch(() => null);
      const idbProbe = await runNativeIndexedDbProbe();
      const offlineReadProbe = savedMetadata
        ? await runOfflineReadAdapterProbe()
        : { passed: false, counts: { businesses: 0, categories: 0, areas: 0, emergencyContacts: 0 } };

      setMetadata(savedMetadata);
      setReadiness({
        serviceWorkerSupported: true,
        indexedDbWriteReadPassed: idbProbe.writeReadPassed,
        indexedDbAbortRollbackPassed: idbProbe.abortRollbackPassed,
        indexedDbConcurrentTransactionsPassed: idbProbe.concurrentTransactionsPassed,
        activeWorker: Boolean(registration.active),
        waitingWorker: Boolean(registration.waiting),
        appShellCached: Boolean(appShell),
        emergencyFallbackCached: Boolean(emergencyFallback),
        manifestAssetCount: manifestAssets.length,
        cachedAssetCount: manifestAssets.length - missingAssets.length,
        missingAssets,
        directoryPackageSaved: Boolean(savedMetadata),
        offlineReadAdaptersPassed: offlineReadProbe.passed,
        offlineReadCounts: offlineReadProbe.counts,
        checkedAt: new Date().toISOString(),
      });
      await refreshStorageEstimate();
    } catch (error) {
      const idbProbe = await runNativeIndexedDbProbe();
      setReadiness({
        serviceWorkerSupported: 'serviceWorker' in navigator && 'caches' in window,
        indexedDbWriteReadPassed: idbProbe.writeReadPassed,
        indexedDbAbortRollbackPassed: idbProbe.abortRollbackPassed,
        indexedDbConcurrentTransactionsPassed: idbProbe.concurrentTransactionsPassed,
        activeWorker: false,
        waitingWorker: false,
        appShellCached: false,
        emergencyFallbackCached: false,
        manifestAssetCount: 0,
        cachedAssetCount: 0,
        missingAssets: [],
        directoryPackageSaved: Boolean(await getOfflineDirectoryMetadata().catch(() => null)),
        offlineReadAdaptersPassed: false,
        error: error instanceof Error ? error.message : 'Offline readiness could not be checked.',
        checkedAt: new Date().toISOString(),
      });
    } finally {
      setCheckingReadiness(false);
    }
  };

  const startDownload = async () => {
    if (getOfflineDownloadController()) return;
    if (!isOnline) {
      setStatus('error');
      setMessage(isUrdu ? 'آف لائن ڈیٹا ڈاؤن لوڈ کرنے کے لیے پہلے انٹرنیٹ سے منسلک ہوں۔' : 'Connect to the internet before downloading the offline directory.');
      return;
    }
    if (!supported) {
      setStatus('error');
      setMessage(isUrdu ? 'یہ براؤزر آف لائن اسٹوریج کو سپورٹ نہیں کرتا۔' : 'This browser does not support the required offline storage.');
      return;
    }

    const controller = beginOfflineDownload();
    if (!controller) return;
    const signal = controller.signal;
    setStatus('downloading');
    setProgress(5);
    setEstimatedBytes(0);
    try {
      setMessage(isUrdu ? 'عوامی مواد کی تازہ فہرست حاصل کی جا رہی ہے…' : 'Checking the latest public content version…');
      const versionBefore = await raceWithAbort(getPublicOfflineContentVersion(), signal);
      setMessage(isUrdu ? 'عوامی کاروباری ڈائریکٹری حاصل کی جا رہی ہے…' : 'Fetching the published public business directory…');
      const businesses = await raceWithAbort(fetchBusinessesForOfflineDownload(), signal);
      if (!businesses.length) throw new Error('No published business records were returned. The previous offline package was kept.');
      setProgress(38);

      setMessage(isUrdu ? 'فعال کیٹیگریز حاصل کی جا رہی ہیں…' : 'Fetching active categories…');
      const categories = await raceWithAbort(fetchAllCategories(), signal);
      if (!categories.length) throw new Error('Active categories could not be verified. The previous offline package was kept.');
      setProgress(52);

      setMessage(isUrdu ? 'علاقوں کی فہرست حاصل کی جا رہی ہے…' : 'Fetching active areas…');
      const areas = await raceWithAbort(fetchAllAreas(), signal);
      if (!areas.length) throw new Error('Active areas could not be verified. The previous offline package was kept.');
      setProgress(66);

      setMessage(isUrdu ? 'ایمرجنسی نمبرز تازہ کیے جا رہے ہیں…' : 'Refreshing emergency contacts…');
      const emergency = await raceWithAbort(fetchEmergencyContacts(), signal);
      if (emergency.fromCache) throw new Error('Emergency contacts could not be refreshed from the live public source. The previous offline package was kept.');
      if (!emergency.items.length) throw new Error('No active emergency contacts were returned. The previous offline package was kept.');
      setProgress(78);

      setMessage(isUrdu ? 'عوامی تصاویر اور بینرز حاصل کیے جا رہے ہیں…' : 'Collecting public images and banners…');
      const [siteSettings, publishedNews, authorityProfiles, activeAds, productImageUrls, announcements, localAuthorities, governmentJobs, governmentSchemes, publicPages, businessProducts, ownerPublicProfiles] = await Promise.all([
        raceWithAbort(fetchSiteSettings(), signal),
        raceWithAbort(fetchPublishedNewsArticles(500), signal),
        raceWithAbort(fetchAuthorityProfiles(), signal),
        raceWithAbort(fetchActiveAds(), signal),
        raceWithAbort(fetchPublicBusinessProductImageUrls(businesses.map((business) => business.id)), signal),
        raceWithAbort(fetchAnnouncementsForOffline(), signal),
        raceWithAbort(fetchLocalAuthorities(), signal),
        raceWithAbort(fetchPublishedGovernmentJobs(), signal),
        raceWithAbort(fetchPublishedGovernmentSchemes(), signal),
        raceWithAbort(fetchPublishedPagesForOffline(), signal),
        raceWithAbort(fetchBusinessProductsForOffline(businesses.map((business) => business.id)), signal),
        raceWithAbort(fetchPublicOwnerProfilesForOffline(), signal),
      ]);

      if (signal.aborted) throw new DOMException('Download cancelled.', 'AbortError');
      const versionAfter = await raceWithAbort(getPublicOfflineContentVersion(), signal);
      if (versionBefore !== versionAfter) {
        throw new Error('Public content changed while downloading. Please retry so every section belongs to the same update.');
      }

      const publicContent = {
        news_articles: publishedNews.map(({ created_by, updated_by, ...row }) => row),
        announcements: announcements.map(({ created_by, ...row }) => row),
        local_authorities: localAuthorities.map(({ email, ...row }) => ({ ...row, public_email: email })),
        authority_profiles: authorityProfiles.map(({ email, created_by, updated_by, ...row }) => ({
          ...row, contact_email: row.show_contact ? email : null,
        })),
        government_jobs: governmentJobs.map(({ created_by, updated_by, published_by, ...row }) => row),
        government_schemes: governmentSchemes.map(({ created_by, updated_by, published_by, ...row }) => row),
        pages: publicPages.map(({ updated_by, ...row }) => row),
        business_products: businessProducts,
        active_ads: activeAds.map(({ notes, impressions, clicks, created_by, reviewed_by, ...row }) => row),
        owner_public_profiles: ownerPublicProfiles,
      };

      const snapshot = {
        schema_version: OFFLINE_DIRECTORY_SCHEMA_VERSION,
        downloaded_at: new Date().toISOString(),
        content_version: versionBefore,
        hero_banner_url: siteSettings.hero_banner_url,
        public_settings: {
          site_name: siteSettings.site_name,
          contact_phone: siteSettings.contact_phone,
          contact_whatsapp: siteSettings.contact_whatsapp,
          public_contact_email: siteSettings.contact_email,
          social_links: siteSettings.social_links,
          default_language: siteSettings.default_language,
          ads_enabled: siteSettings.ads_enabled,
          maintenance_mode: siteSettings.maintenance_mode,
        },
        public_content: publicContent,
        businesses: businesses.map(toOfflineBusiness),
        categories: categories.filter((item) => item.is_active).map(toOfflineCategory),
        areas: areas.filter((item) => item.is_active).map(toOfflineArea),
        emergency_contacts: emergency.items.map(toOfflineEmergencyContact),
        directory_image_urls: siteSettings.directory_image_urls,
      };

      if (!validateOfflineDirectorySnapshot(snapshot)) {
        throw new Error('The downloaded public data did not pass validation. The previous offline package was kept.');
      }

      const directoryImages = siteSettings.directory_image_urls;
      const manifestResponse = await raceWithAbort(fetch('/offline-precache.json', { cache: 'no-store', signal: AbortSignal.timeout(8000) }), signal);
      if (!manifestResponse.ok) throw new Error('The public image manifest could not be verified. The previous offline package was kept.');
      const manifestValue: unknown = await raceWithAbort(manifestResponse.json(), signal);
      const staticImagePaths = Array.isArray(manifestValue)
        ? manifestValue.filter((path): path is string =>
            typeof path === 'string' && path.startsWith('/') &&
            /\.(?:avif|gif|jpe?g|png|svg|webp|ico)$/i.test(path)
          )
        : [];
      const publicImageUrls = [
        ...staticImagePaths,
        '/assets/hero-sadiqabad.svg',
        '/favicon.png',
        '/icons/groceries.svg',
        '/icons/healthcare.svg',
        '/icons/icon-192.png',
        '/icons/icon-512.png',
        '/icons/pharmacy.svg',
        '/icons/restaurant.svg',
        '/site-logo.png',
        ...businesses.flatMap((business) => [business.logo_url, business.cover_url, ...(business.gallery_urls ?? []), ...(business.active_offers ?? []).map((offer) => offer.image_url)]),
        ...productImageUrls,
        ...businessProducts.map((product) => product.image_url),
        siteSettings.hero_banner_url,
        ...Object.values(directoryImages).flatMap((items) => Object.values(items ?? {})),
        // Pre-cache same-origin proxy URLs for category and helpline cards.
        // Service Workers cannot intercept direct cross-origin Supabase image requests.
        ...[...Object.values(directoryImages.categories), ...Object.values(directoryImages.helplines)]
          .map((url) => getOfflineImageDisplayUrl(url, window.location.origin)),
        ...publishedNews.flatMap((article) => [
          article.cover_image_url,
          ...(article.image_urls ?? []),
          ...[article.content_en, article.content_ur].flatMap((content) =>
            [...(content ?? '').matchAll(/!\[[^\]]*\]\((https:\/\/[^)]+)\)/g)].map((match) => match[1])
          ),
        ]),
        ...authorityProfiles.map((profile) => profile.photo_url),
        ...ownerPublicProfiles.map((profile) => typeof profile.photo_url === 'string' ? profile.photo_url : null),
        ...governmentJobs.map((job) => job.image_url),
        ...governmentSchemes.map((scheme) => scheme.image_url),
        ...publicPages.flatMap((page) => {
          const markdown = [page.body_md_en, page.body_md_ur].join('\n');
          return [...markdown.matchAll(/!\[[^\]]*\]\((https:\/\/[^)]+)\)/g)].map((match) => match[1]);
        }),
        ...activeAds.map((ad) => ad.image_url),
      ].filter((url): url is string => typeof url === 'string' && url.trim().length > 0);
      const imageResult = await cacheOfflineImages(publicImageUrls, signal, (completed, total) => {
        if (total > 0) setProgress(78 + Math.round((completed / total) * 10));
      });
      const bytes = new Blob([JSON.stringify(snapshot)]).size + imageResult.bytes;
      setEstimatedBytes(bytes);
      setProgress(90);
      setMessage(isUrdu ? 'ڈیٹا اور تصاویر کی تصدیق مکمل؛ محفوظ کیا جا رہا ہے…' : 'Directory and public images verified. Saving the offline package…');
      setStatus('saving');

      if (signal.aborted) throw new DOMException('Download cancelled.', 'AbortError');
      const saved = await saveOfflineDirectorySnapshot(snapshot);
      setMetadata(saved);
      clearOfflineUpdateAvailable();
      await refreshStorageEstimate();
      setProgress(100);
      const cachedImageCount = imageResult.downloaded + imageResult.alreadyCached;
      const hasImageWarnings = imageResult.skipped > 0;
      setStatus(hasImageWarnings ? 'success-with-warnings' : 'success');
      setMessage(isUrdu
        ? hasImageWarnings
          ? `آف لائن ڈائریکٹری محفوظ ہو گئی۔ ${cachedImageCount} تصاویر محفوظ ہوئیں؛ ${imageResult.skipped} تصاویر دستیاب یا قابلِ کیش نہیں تھیں۔ ڈائریکٹری، تلاش، کیٹیگریز اور عوامی مواد آف لائن دستیاب رہیں گے؛ غیر محفوظ تصاویر انٹرنیٹ کے بغیر نظر نہیں آئیں گی۔`
          : `آف لائن ڈائریکٹری محفوظ ہو گئی۔ تمام ${cachedImageCount} عوامی تصاویر دستیاب ہیں۔`
        : hasImageWarnings
          ? `Offline directory saved with an image warning. ${cachedImageCount} images are cached; ${imageResult.skipped} were unavailable or unsupported. Your public directory, search, categories and public content are saved; missing images may not appear offline.`
          : `Offline directory saved. All ${cachedImageCount} public images are cached.`);
    } catch (error) {
      if (signal.aborted || (error instanceof DOMException && error.name === 'AbortError')) {
        setStatus('cancelled');
        setMessage(isUrdu ? 'ڈاؤن لوڈ منسوخ ہو گیا؛ پچھلا محفوظ ڈیٹا برقرار ہے۔' : 'Download cancelled. Your previous saved offline data was kept.');
      } else {
        setStatus('error');
        setMessage(error instanceof Error ? error.message : 'The offline directory could not be downloaded. Your previous saved data was kept.');
      }
    } finally {
      finishOfflineDownload();
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('offline-download-check') === '1') {
      void (async () => {
        await startDownload();
        await runReadinessCheck();
      })();
    } else if (params.get('offline-check') === '1') {
      void runReadinessCheck();
    }
  }, []);

  const cancelDownload = () => cancelOfflineDownload();

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto px-4 py-6 sm:py-10 space-y-6">
        <header className="space-y-2">
          <div className="inline-flex items-center gap-2 text-primary text-xs font-bold uppercase tracking-wider">
            <HardDrive className="w-4 h-4" />
            {isUrdu ? 'آف لائن ڈائریکٹری' : 'Offline Directory'}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-on-surface">
            {isUrdu ? 'انٹرنیٹ کے بغیر صادق آباد ڈائریکٹری استعمال کریں' : 'Use the Sadiqabad directory without internet'}
          </h1>
          <p className="text-sm leading-6 text-on-surface-variant">
            {isUrdu
              ? 'عوامی ڈائریکٹری، خبریں، اعلانات، سرکاری نوکریاں اور اسکیمیں، سرکاری اداروں کے رابطے، کاروباری مصنوعات اور دستیاب تصاویر ایک ساتھ محفوظ کریں۔'
              : 'Download the complete public directory, news, announcements, government jobs and schemes, authority contacts, business products and cacheable images. Your saved public content can then be browsed without internet.'}
          </p>
        </header>

        <section className="rounded-3xl border border-outline-variant/50 bg-surface-container-lowest p-5 sm:p-7 space-y-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm font-bold text-on-surface">
              {isOnline ? <Wifi className="w-4 h-4 text-primary" /> : <WifiOff className="w-4 h-4 text-error" />}
              {isOnline ? (isUrdu ? 'انٹرنیٹ منسلک ہے' : 'You are online') : (isUrdu ? 'انٹرنیٹ منقطع ہے' : 'You are offline')}
            </div>
            <span className="text-xs text-on-surface-variant">
              {supported ? (isUrdu ? 'اسٹوریج دستیاب' : 'Local storage supported') : (isUrdu ? 'اسٹوریج دستیاب نہیں' : 'Storage unavailable')}
            </span>
          </div>

          {!supported && (
            <p className="rounded-xl bg-error/10 text-error p-3 text-sm">
              {isUrdu ? 'اس براؤزر میں IndexedDB دستیاب نہیں؛ آف لائن پیکج محفوظ نہیں کیا جا سکتا۔' : 'IndexedDB is unavailable in this browser, so an offline package cannot be saved.'}
            </p>
          )}

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3 text-xs font-semibold">
              <span>{isUrdu ? 'ڈاؤن لوڈ کی پیش رفت' : 'Download progress'}</span>
              <span>{progress}%</span>
            </div>
            <div className="h-2.5 rounded-full bg-surface-container overflow-hidden" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}>
              <div className="h-full rounded-full bg-primary transition-all duration-300" style={{ width: progress + '%' }} />
            </div>
          </div>

          {message && (
            <p aria-live="polite" className={status === 'error' ? 'rounded-xl p-3 text-sm leading-6 bg-error/10 text-error' : status === 'success' ? 'rounded-xl p-3 text-sm leading-6 bg-primary/10 text-primary' : status === 'success-with-warnings' ? 'rounded-xl p-3 text-sm leading-6 bg-secondary/10 text-secondary' : 'rounded-xl p-3 text-sm leading-6 bg-surface-container text-on-surface-variant'}>
              {message}
            </p>
          )}

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={startDownload}
              disabled={!isOnline || !supported || busy}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-on-primary shadow-sm transition-colors hover:bg-primary-container disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              {isUrdu ? 'ڈائریکٹری ڈاؤن لوڈ کریں' : 'Download public directory'}
            </button>
            {status === 'downloading' && (
              <button
                type="button"
                onClick={cancelDownload}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-outline-variant px-4 py-3 text-sm font-semibold text-on-surface hover:bg-surface-container"
              >
                <XCircle className="w-4 h-4" />
                {isUrdu ? 'منسوخ کریں' : 'Cancel download'}
              </button>
            )}
          </div>

          {storageUsage && (
            <p className="text-xs text-on-surface-variant">
              {isUrdu ? 'اس براؤزر کا استعمال شدہ اسٹوریج: ' : 'Browser storage currently used: '}
              <strong>{formatBytes(storageUsage.usage)}</strong>
              {' / '}
              <strong>{formatBytes(storageUsage.quota)}</strong>
              <span> ({Math.round((storageUsage.usage / storageUsage.quota) * 100)}%)</span>
            </p>
          )}

          {estimatedBytes > 0 && (
            <p className="text-xs text-on-surface-variant">
              {isUrdu ? 'محفوظ کیے جانے والے ڈیٹا کا تخمینہ: ' : 'Estimated package size: '}
              <strong>{formatBytes(estimatedBytes)}</strong>
            </p>
          )}
        </section>

        <section className="rounded-3xl border border-outline-variant/50 bg-surface-container-lowest p-5 sm:p-7 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-1">
              <h2 className="text-base font-extrabold text-on-surface">
                {isUrdu ? 'آف لائن تیاری چیک کریں' : 'Offline readiness check'}
              </h2>
              <p className="text-xs leading-5 text-on-surface-variant">
                {isUrdu ? 'ایپ فائلز، ایمرجنسی صفحہ اور محفوظ ڈائریکٹری کی دستیابی چیک کریں۔' : 'Check that app files, the emergency fallback and your saved directory are available in this browser.'}
              </p>
            </div>
            <button
              type="button"
              onClick={runReadinessCheck}
              disabled={checkingReadiness}
              className="inline-flex min-h-10 items-center justify-center rounded-xl border border-outline-variant px-4 py-2 text-xs font-bold text-primary hover:bg-surface-container disabled:opacity-50"
            >
              {checkingReadiness
                ? (isUrdu ? 'چیک ہو رہا ہے…' : 'Checking…')
                : (isUrdu ? 'تیاری چیک کریں' : 'Check readiness')}
            </button>
          </div>
          {readiness && (
            <div data-testid="offline-readiness-report" aria-live="polite" className="rounded-2xl bg-surface-container p-4 space-y-2 text-xs">
              <p className="font-bold text-on-surface">
                {readiness.serviceWorkerSupported
                  ? (readiness.activeWorker ? (isUrdu ? 'سروس ورکر فعال ہے' : 'Service Worker is active') : (isUrdu ? 'سروس ورکر فعال نہیں' : 'Service Worker is not active'))
                  : (isUrdu ? 'یہ براؤزر سروس ورکر کو سپورٹ نہیں کرتا' : 'Service Worker is not supported')}
              </p>
              <p className="text-on-surface-variant">
                {isUrdu ? 'IndexedDB لکھنے/پڑھنے کا ٹیسٹ: ' : 'IndexedDB write/read test: '}
                <strong>{readiness.indexedDbWriteReadPassed ? (isUrdu ? 'کامیاب' : 'Passed') : (isUrdu ? 'ناکام' : 'Failed')}</strong>
              </p>
              <p className="text-on-surface-variant">
                {isUrdu ? 'ٹرانزیکشن منسوخی کا ٹیسٹ: ' : 'Transaction abort rollback test: '}
                <strong>{readiness.indexedDbAbortRollbackPassed ? (isUrdu ? 'کامیاب' : 'Passed') : (isUrdu ? 'ناکام' : 'Failed')}</strong>
              </p>
              <p className="text-on-surface-variant">
                {isUrdu ? 'متوازی ٹرانزیکشنز کا ٹیسٹ: ' : 'Concurrent transactions test: '}
                <strong>{readiness.indexedDbConcurrentTransactionsPassed ? (isUrdu ? 'کامیاب' : 'Passed') : (isUrdu ? 'ناکام' : 'Failed')}</strong>
              </p>
              <p className="text-on-surface-variant">
                {isUrdu ? 'ایپ کا مرکزی صفحہ: ' : 'App shell: '}
                <strong>{readiness.appShellCached ? (isUrdu ? 'محفوظ' : 'Cached') : (isUrdu ? 'غائب' : 'Missing')}</strong>
              </p>
              <p className="text-on-surface-variant">
                {isUrdu ? 'ایمرجنسی صفحہ: ' : 'Emergency fallback: '}
                <strong>{readiness.emergencyFallbackCached ? (isUrdu ? 'محفوظ' : 'Cached') : (isUrdu ? 'غائب' : 'Missing')}</strong>
              </p>
              <p className="text-on-surface-variant">
                {isUrdu ? 'ایپ فائلز: ' : 'App files: '}
                <strong>{readiness.cachedAssetCount}/{readiness.manifestAssetCount}</strong>
                {readiness.waitingWorker && <span> · {isUrdu ? 'اپ ڈیٹ منتظر ہے' : 'An update is waiting'}</span>}
              </p>
              <p className="text-on-surface-variant">
                {isUrdu ? 'ڈائریکٹری ڈیٹا: ' : 'Directory data: '}
                <strong>{readiness.directoryPackageSaved ? (isUrdu ? 'محفوظ ہے' : 'Saved') : (isUrdu ? 'ڈاؤن لوڈ نہیں ہوا' : 'Not downloaded')}</strong>
              </p>
              {readiness.directoryPackageSaved && (
                <p className="text-on-surface-variant">
                  {isUrdu ? 'آف لائن سرچ اور ڈائریکٹری ریڈ ٹیسٹ: ' : 'Offline search and directory read test: '}
                  <strong>{readiness.offlineReadAdaptersPassed ? (isUrdu ? 'کامیاب' : 'Passed') : (isUrdu ? 'ناکام' : 'Failed')}</strong>
                  {readiness.offlineReadCounts && (
                    <span> · {readiness.offlineReadCounts.businesses} {isUrdu ? 'کاروبار' : 'businesses'}, {readiness.offlineReadCounts.categories} {isUrdu ? 'کیٹیگریز' : 'categories'}, {readiness.offlineReadCounts.areas} {isUrdu ? 'علاقے' : 'areas'}, {readiness.offlineReadCounts.emergencyContacts} {isUrdu ? 'ایمرجنسی رابطے' : 'emergency contacts'}</span>
                  )}
                </p>
              )}
              {readiness.missingAssets.length > 0 && (
                <p className="text-error">
                  {isUrdu ? 'غائب فائلز: ' : 'Missing app files: '}
                  {readiness.missingAssets.slice(0, 4).join(', ')}
                  {readiness.missingAssets.length > 4 ? '…' : ''}
                </p>
              )}
              {readiness.error && <p className="text-error">{readiness.error}</p>}
              <p className="text-[10px] text-on-surface-variant">
                {isUrdu ? 'چیک کا وقت: ' : 'Checked: '}{new Date(readiness.checkedAt).toLocaleString()}
              </p>
              <p className="text-[10px] text-on-surface-variant">
                {isUrdu ? 'یہ چیک حقیقی ایئرپلین موڈ ری لوڈ کی جگہ نہیں لیتا۔' : 'This check does not replace a real airplane-mode reload test.'}
              </p>
            </div>
          )}
        </section>

        <section className="rounded-3xl border border-outline-variant/50 bg-surface-container-lowest p-5 sm:p-7 space-y-4">
          <h2 className="text-base font-extrabold text-on-surface">
            {isUrdu ? 'آخری کامیاب ڈاؤن لوڈ' : 'Last successful download'}
          </h2>
          {metadata ? (
            <>
              <p className="text-sm text-on-surface-variant">{new Date(metadata.downloaded_at).toLocaleString()}</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  [isUrdu ? 'کاروبار' : 'Businesses', metadata.counts.businesses],
                  [isUrdu ? 'کیٹیگریز' : 'Categories', metadata.counts.categories],
                  [isUrdu ? 'علاقے' : 'Areas', metadata.counts.areas],
                  [isUrdu ? 'ایمرجنسی' : 'Emergency', metadata.counts.emergency_contacts],
                ].map(([label, count]) => (
                  <div key={String(label)} className="rounded-xl bg-surface-container p-3">
                    <div className="text-xl font-extrabold tabular-nums text-on-surface">{count}</div>
                    <div className="text-[11px] text-on-surface-variant">{label}</div>
                  </div>
                ))}
              </div>
              {metadata.counts.public_content && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[
                    [isUrdu ? 'خبریں' : 'News', metadata.counts.public_content.news_articles],
                    [isUrdu ? 'اعلانات' : 'Announcements', metadata.counts.public_content.announcements],
                    [isUrdu ? 'مقامی ادارے' : 'Authorities', metadata.counts.public_content.local_authorities],
                    [isUrdu ? 'عہدیدار پروفائلز' : 'Authority profiles', metadata.counts.public_content.authority_profiles],
                    [isUrdu ? 'سرکاری نوکریاں' : 'Government jobs', metadata.counts.public_content.government_jobs],
                    [isUrdu ? 'سرکاری اسکیمیں' : 'Government schemes', metadata.counts.public_content.government_schemes],
                    [isUrdu ? 'کاروباری مصنوعات' : 'Business products', metadata.counts.public_content.business_products],
                    [isUrdu ? 'عوامی صفحات' : 'Public pages', metadata.counts.public_content.pages],
                    [isUrdu ? 'فعال اشتہارات' : 'Active ads', metadata.counts.public_content.active_ads],
                    [isUrdu ? 'عوامی مالک پروفائلز' : 'Public owner profiles', metadata.counts.public_content.owner_public_profiles],
                  ].map(([label, count]) => (
                    <div key={String(label)} className="rounded-xl bg-surface-container p-3">
                      <div className="text-xl font-extrabold tabular-nums text-on-surface">{count}</div>
                      <div className="text-[11px] text-on-surface-variant">{label}</div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <p className="text-sm text-on-surface-variant">
              {isUrdu ? 'ابھی کوئی آف لائن ڈائریکٹری محفوظ نہیں۔' : 'No offline directory package has been saved on this device yet.'}
            </p>
          )}
        </section>

        <aside className="rounded-2xl bg-surface-container p-4 text-xs leading-6 text-on-surface-variant">
          <strong className="text-on-surface">{isUrdu ? 'اہم حفاظتی وضاحت' : 'Important privacy and usage note'}</strong>
          <p>
            {isUrdu
              ? 'تمام محفوظ شدہ مواد عوامی صفحات کے لیے ہے۔ جو بیرونی تصویر محفوظ کرنے کی اجازت یا تکنیکی سہولت نہ دے، وہ آف لائن دستیاب نہیں ہو سکتی۔ ایڈمن/مالک پورٹل، لاگ اِن سیشنز، نجی پروفائلز اور فارم جمع کرانے کا ڈیٹا کبھی محفوظ نہیں ہوتا؛ فارم جمع کرانے کے لیے انٹرنیٹ ضروری ہے۔'
              : 'Only public visitor content is stored. An external image may remain unavailable if its host blocks caching or does not permit it. Admin/owner portals, login sessions, private profiles and form submissions are never stored. Submissions always require an internet connection.'}
          </p>
        </aside>
      </div>
    </AppShell>
  );
}
