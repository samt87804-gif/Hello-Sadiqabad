import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
// Never force-reload the application when a deployment changes lazy-loaded chunks.
// This is especially important in the admin workspace: only the administrator may
// decide when to refresh. Keep the current document alive and expose a recoverable
// event so the UI can explain that a manual refresh may be needed for that module.
window.addEventListener('vite:preloadError', (event) => {
  event.preventDefault();
  window.dispatchEvent(new CustomEvent('hs:chunk-load-error'));
  console.error('[Hello Sadiqabad] A page module could not be loaded. The app was not reloaded; refresh manually when ready.');
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
