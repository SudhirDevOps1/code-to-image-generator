import { onCLS, onFCP, onINP, onLCP, onTTFB } from 'web-vitals';

/**
 * Privacy-first, opt-in Core Web Vitals reporting.
 *
 * Nothing is sent unless `VITE_ANALYTICS_ENDPOINT` is set at build time, and
 * only aggregate metric values are transmitted — never code or user content.
 */
export function initWebVitals() {
  const endpoint = import.meta.env.VITE_ANALYTICS_ENDPOINT;

  const report = (metric) => {
    if (endpoint && navigator.sendBeacon) {
      const payload = JSON.stringify({
        name: metric.name,
        value: metric.value,
        rating: metric.rating,
        id: metric.id,
        path: window.location.pathname,
      });
      navigator.sendBeacon(endpoint, new Blob([payload], { type: 'application/json' }));
      return;
    }

    if (import.meta.env.DEV) {
      console.debug('[vitals]', metric.name, Math.round(metric.value));
    }
  };

  for (const measure of [onCLS, onFCP, onINP, onLCP, onTTFB]) measure(report);
}
