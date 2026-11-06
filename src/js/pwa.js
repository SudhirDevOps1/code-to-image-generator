import { registerSW } from 'virtual:pwa-register';

/**
 * Register the generated service worker and expose an explicit update flow.
 * `registerType: 'prompt'` in vite.config.js keeps the running tab stable until
 * the user chooses to reload.
 */
export function initPwa({ onNeedRefresh, onOfflineReady } = {}) {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
    return () => {};
  }

  const updateSW = registerSW({
    immediate: true,
    onNeedRefresh,
    onOfflineReady,
    onRegisteredSW(_swUrl, registration) {
      if (!registration) return;
      // Periodically check for a new deployment (hourly, low cost).
      setInterval(
        () => {
          registration.update().catch(() => {});
        },
        60 * 60 * 1000,
      );
    },
    onRegisterError(error) {
      console.warn('[codesnap] service worker registration failed', error);
    },
  });

  return updateSW;
}
