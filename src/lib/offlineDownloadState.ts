export type OfflineDownloadStatus = 'idle' | 'downloading' | 'saving' | 'success' | 'success-with-warnings' | 'error' | 'cancelled';

export interface OfflineDownloadState {
  status: OfflineDownloadStatus;
  progress: number;
  message: string;
  estimatedBytes: number;
  startedAt: string | null;
  updatedAt: string;
}

const EVENT_NAME = 'hs:offline-download-state';
let controller: AbortController | null = null;
let state: OfflineDownloadState = {
  status: 'idle',
  progress: 0,
  message: '',
  estimatedBytes: 0,
  startedAt: null,
  updatedAt: new Date(0).toISOString(),
};

export function getOfflineDownloadState(): OfflineDownloadState {
  return { ...state };
}

export function publishOfflineDownloadState(patch: Partial<OfflineDownloadState>): void {
  state = { ...state, ...patch, updatedAt: new Date().toISOString() };
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent<OfflineDownloadState>(EVENT_NAME, { detail: { ...state } }));
  }
}

export function subscribeOfflineDownloadState(listener: (value: OfflineDownloadState) => void): () => void {
  if (typeof window === 'undefined') return () => undefined;
  const handle = (event: Event) => {
    const detail = (event as CustomEvent<OfflineDownloadState>).detail;
    listener({ ...detail });
  };
  window.addEventListener(EVENT_NAME, handle);
  listener(getOfflineDownloadState());
  return () => window.removeEventListener(EVENT_NAME, handle);
}

export function beginOfflineDownload(): AbortController | null {
  if (controller) return null;
  controller = new AbortController();
  publishOfflineDownloadState({
    status: 'downloading',
    progress: 0,
    message: '',
    estimatedBytes: 0,
    startedAt: new Date().toISOString(),
  });
  return controller;
}

export function getOfflineDownloadController(): AbortController | null {
  return controller;
}

export function finishOfflineDownload(): void {
  controller = null;
}

export function cancelOfflineDownload(): void {
  controller?.abort();
}
