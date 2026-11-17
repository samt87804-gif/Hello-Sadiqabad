import React, { useEffect, useRef, useState } from 'react';
import { Download, HardDrive, Wifi, WifiOff, XCircle } from 'lucide-react';
import { AppShell } from '../components/layout/AppShell';
import { fetchAllAreas, fetchAllCategories, fetchBusinessesForOfflineDownload, fetchEmergencyContacts } from '../lib/api';
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

type DownloadStatus = 'idle' | 'downloading' | 'saving' | 'success' | 'error' | 'cancelled';

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
  const [status, setStatus] = useState<DownloadStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState('');
  const [estimatedBytes, setEstimatedBytes] = useState(0);
  const [metadata, setMetadata] = useState<OfflineSnapshotMetadata | null>(null);
  const controllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);

    if (isOfflineDirectorySupported()) {
      getOfflineDirectoryMetadata().then(setMetadata).catch(() => setMetadata(null));
    }

    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
      controllerRef.current?.abort();
    };
  }, []);

  const busy = status === 'downloading' || status === 'saving';
  const supported = isOfflineDirectorySupported();

  const startDownload = async () => {
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

    const controller = new AbortController();
    controllerRef.current = controller;
    const signal = controller.signal;
    setStatus('downloading');
    setProgress(5);
    setEstimatedBytes(0);
    setMessage(isUrdu ? 'عوامی کاروباری ڈائریکٹری حاصل کی جا رہی ہے…' : 'Fetching the published public business directory…');

    try {
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
      setProgress(80);

      const snapshot = {
        schema_version: OFFLINE_DIRECTORY_SCHEMA_VERSION,
        downloaded_at: new Date().toISOString(),
        businesses: businesses.map(toOfflineBusiness),
        categories: categories.filter((item) => item.is_active).map(toOfflineCategory),
        areas: areas.filter((item) => item.is_active).map(toOfflineArea),
        emergency_contacts: emergency.items.map(toOfflineEmergencyContact),
      };

      if (!validateOfflineDirectorySnapshot(snapshot)) {
        throw new Error('The downloaded public data did not pass validation. The previous offline package was kept.');
      }

      const bytes = new Blob([JSON.stringify(snapshot)]).size;
      setEstimatedBytes(bytes);
      setProgress(90);
      setMessage(isUrdu ? 'ڈیٹا کی تصدیق مکمل؛ محفوظ کیا جا رہا ہے…' : 'Data validated. Saving the new offline package…');
      setStatus('saving');

      const saved = await saveOfflineDirectorySnapshot(snapshot);
      setMetadata(saved);
      setProgress(100);
      setStatus('success');
      setMessage(isUrdu ? 'آف لائن ڈائریکٹری کامیابی سے محفوظ ہو گئی۔' : 'Your offline directory was saved successfully.');
    } catch (error) {
      if (signal.aborted || (error instanceof DOMException && error.name === 'AbortError')) {
        setStatus('cancelled');
        setMessage(isUrdu ? 'ڈاؤن لوڈ منسوخ ہو گیا؛ پچھلا محفوظ ڈیٹا برقرار ہے۔' : 'Download cancelled. Your previous saved offline data was kept.');
      } else {
        setStatus('error');
        setMessage(error instanceof Error ? error.message : 'The offline directory could not be downloaded. Your previous saved data was kept.');
      }
    } finally {
      controllerRef.current = null;
    }
  };

  const cancelDownload = () => controllerRef.current?.abort();

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
              ? 'ایک بار عوامی ڈائریکٹری ڈاؤن لوڈ کریں، پھر محفوظ شدہ بنیادی معلومات انٹرنیٹ کے بغیر بھی دستیاب ہوں گی۔'
              : 'Download the public directory once while online. The saved core directory package will be available for offline browsing after offline support is connected to the public pages.'}
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
            <p aria-live="polite" className={status === 'error' ? 'rounded-xl p-3 text-sm leading-6 bg-error/10 text-error' : status === 'success' ? 'rounded-xl p-3 text-sm leading-6 bg-primary/10 text-primary' : 'rounded-xl p-3 text-sm leading-6 bg-surface-container text-on-surface-variant'}>
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

          {estimatedBytes > 0 && (
            <p className="text-xs text-on-surface-variant">
              {isUrdu ? 'محفوظ کیے جانے والے ڈیٹا کا تخمینہ: ' : 'Estimated package size: '}
              <strong>{formatBytes(estimatedBytes)}</strong>
            </p>
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
              ? 'صرف عوامی کاروباری فہرستیں، فعال کیٹیگریز، علاقے اور ایمرجنسی نمبرز محفوظ ہوتے ہیں۔ ایڈمن، مالک اکاؤنٹس، لاگ اِن سیشنز، نجی پروفائلز اور فارم جمع کرانے کا ڈیٹا محفوظ نہیں ہوتا۔ فارم جمع کرانے کے لیے انٹرنیٹ ضروری رہے گا۔'
              : 'Only public business listings, active categories, areas and emergency contacts are included. Admin/owner portal data, login sessions, private profiles and form submissions are never stored in this package. Submissions will continue to require an internet connection.'}
          </p>
        </aside>
      </div>
    </AppShell>
  );
}
