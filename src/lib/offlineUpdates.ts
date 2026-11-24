import { getPublicOfflineContentVersion } from './api';
import { getOfflineDirectoryMetadata } from './offlineDirectory';

export interface OfflineUpdateStatus {
  available: boolean;
  checkedAt: string | null;
  error: string | null;
}

const EVENT_NAME = 'hs:offline-update-status';
let status: OfflineUpdateStatus = { available: false, checkedAt: null, error: null };
let activeCheck: Promise<OfflineUpdateStatus> | null = null;
let lastCheckAt = 0;
const CHECK_INTERVAL_MS = 5 * 60 * 1000;

function publish(next: OfflineUpdateStatus): OfflineUpdateStatus {
  status = next;
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent<OfflineUpdateStatus>(EVENT_NAME, { detail: { ...status } }));
  }
  return { ...status };
}

export function getOfflineUpdateStatus(): OfflineUpdateStatus {
  return { ...status };
}

export function subscribeOfflineUpdateStatus(listener: (value: OfflineUpdateStatus) => void): () => void {
  if (typeof window === 'undefined') return () => undefined;
  const handle = (event: Event) => listener({ ...(event as CustomEvent<OfflineUpdateStatus>).detail });
  window.addEventListener(EVENT_NAME, handle);
  listener(getOfflineUpdateStatus());
  return () => window.removeEventListener(EVENT_NAME, handle);
}

export async function checkForOfflineContentUpdates(): Promise<OfflineUpdateStatus> {
  if (activeCheck) return activeCheck;
  if (typeof navigator !== 'undefined' && !navigator.onLine) return getOfflineUpdateStatus();
  if (Date.now() - lastCheckAt < CHECK_INTERVAL_MS) return getOfflineUpdateStatus();
  activeCheck = (async () => {
    try {
      const saved = await getOfflineDirectoryMetadata();
      if (!saved?.content_version) return publish({ available: false, checkedAt: new Date().toISOString(), error: null });
      const latest = await getPublicOfflineContentVersion();
      return publish({
        available: latest !== saved.content_version,
        checkedAt: new Date().toISOString(),
        error: null,
      });
    } catch (error) {
      return publish({
        ...status,
        checkedAt: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Offline update check failed.',
      });
    }
  })();
  try {
    return await activeCheck;
  } finally {
    lastCheckAt = Date.now();
    activeCheck = null;
  }
}

export function clearOfflineUpdateAvailable(): void {
  publish({ available: false, checkedAt: new Date().toISOString(), error: null });
}
