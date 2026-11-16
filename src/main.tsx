import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);

// Automatic Over-The-Air (OTA) PWA Update Sync for Phone, Tablet & Desktop installs
if ('serviceWorker' in navigator && process.env.NODE_ENV !== 'test') {
  window.addEventListener('load', async () => {
    try {
      const hadController = !!navigator.serviceWorker.controller;
      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (hadController && !refreshing) {
          refreshing = true;
          window.location.reload();
        }
      });

      const reg = await navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' });
      await reg.update();

      let knownBuildId: string | null = null;
      const checkServerVersion = async () => {
        try {
          reg.update().catch(() => {});
          const res = await fetch('/api/app-version', { cache: 'no-store' });
          if (!res.ok) return;
          const data = (await res.json()) as { version?: string };
          if (!data.version) return;
          if (!knownBuildId) {
            knownBuildId = data.version;
          } else if (knownBuildId !== data.version) {
            if (reg.waiting) {
              reg.waiting.postMessage({ type: 'SKIP_WAITING' });
            } else {
              window.location.reload();
            }
          }
        } catch {
          // Offline mode — continue running seamlessly from local cache
        }
      };

      checkServerVersion();
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') checkServerVersion();
      });
      window.setInterval(checkServerVersion, 60_000);
    } catch (err) {
      console.warn('SW registration failed:', err);
    }
  });
}
