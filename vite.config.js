import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

/**
 * `VITE_BASE` lets the same build target a project page
 * (e.g. `/code-to-image-generator/`) or a custom domain (`/`).
 */
const base = process.env.VITE_BASE || '/';

export default defineConfig({
  base,

  build: {
    target: 'es2022',
    sourcemap: true,
    cssCodeSplit: false,
    chunkSizeWarningLimit: 900,
  },

  plugins: [
    VitePWA({
      registerType: 'prompt',
      injectRegister: false,
      includeAssets: ['favicon.svg', 'favicon-32.png', 'icons/apple-touch-icon.png', 'robots.txt'],
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,webmanifest,woff,woff2,txt}'],
        // Install screenshots are fetched by the browser UI while online and
        // are large; they do not need to live in the offline precache.
        globIgnores: ['screenshots/**'],
        navigateFallback: 'index.html',
        cleanupOutdatedCaches: true,
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],

  server: {
    port: 5173,
  },

  preview: {
    port: 4173,
  },
});
