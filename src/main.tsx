import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Recover once when a tab still references a chunk from an older deployment.
// The short-lived guard prevents a broken deployment from causing reload loops.
const CHUNK_RELOAD_KEY = 'hs:chunk-reload-at';
window.addEventListener('vite:preloadError', (event) => {
  event.preventDefault();
  try {
    const previousAttempt = Number(sessionStorage.getItem(CHUNK_RELOAD_KEY) || 0);
    if (Date.now() - previousAttempt > 30_000) {
      sessionStorage.setItem(CHUNK_RELOAD_KEY, String(Date.now()));
      window.location.reload();
    }
  } catch {
    window.location.reload();
  }
});

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => {
        reg.addEventListener('updatefound', () => {
          const worker = reg.installing;
          if (!worker) return;
          worker.addEventListener('statechange', () => {
            if (worker.state === 'installed' && navigator.serviceWorker.controller) {
              window.dispatchEvent(new Event('hs-sw-update'));
            }
          });
        });
      })
      .catch(() => undefined);
  });
}

createRoot(document.getElementById('root')!).render(<App />);
