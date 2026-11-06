import './styles/app.css';
import { initApp } from './js/ui.js';
import { initWebVitals } from './js/telemetry.js';

const { showToast } = initApp();

// ---------- PWA update prompt ----------

const updateBanner = document.getElementById('update-banner');
const updateReload = document.getElementById('update-reload');
const updateDismiss = document.getElementById('update-dismiss');

let updateSW = () => {};

const scheduleIdle = (callback, timeout = 2000) => {
  if ('requestIdleCallback' in window) requestIdleCallback(callback, { timeout });
  else setTimeout(callback, 1200);
};

// Registration is not needed for first paint. Loading workbox and registering
// after the page is interactive keeps the critical path short and TBT low.
const bootPwa = () => {
  scheduleIdle(async () => {
    try {
      const { initPwa } = await import('./js/pwa.js');
      updateSW = initPwa({
        onNeedRefresh: () => {
          if (updateBanner) updateBanner.hidden = false;
        },
        onOfflineReady: () => showToast('Offline ready'),
      });
    } catch (error) {
      console.warn('[codesnap] service worker setup failed', error);
    }
  });
};

if (document.readyState === 'complete') bootPwa();
else window.addEventListener('load', bootPwa, { once: true });

updateReload?.addEventListener('click', () => {
  updateBanner.hidden = true;
  updateSW(true);
});

updateDismiss?.addEventListener('click', () => {
  updateBanner.hidden = true;
});

// ---------- Observability ----------

window.addEventListener('load', initWebVitals, { once: true });

window.addEventListener('error', (event) => {
  console.error('[codesnap] uncaught error', event.error ?? event.message);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('[codesnap] unhandled rejection', event.reason);
});
