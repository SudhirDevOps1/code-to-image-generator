# Deep analysis — CodeSnap v2 → v3

**Status:** complete  
**Scope:** the repository as shipped before v3 (`index.html`, `manifest.json`, `sw.js`, README, screenshots)  
**Method:** static review of every tracked file, manual runtime reasoning against the
browser platform, and dependency inspection. No production telemetry existed, so
findings are based on code evidence rather than field data.

---

## 1. Executive summary

The v2 app did one thing well: it turned a code snippet into a PNG with attractive
themes, and it did so with no backend. That focus is the product's main asset and
was preserved in v3.

The implementation, however, carried structural risks that would block a team from
shipping it repeatedly with confidence:

| Area                 | v2 reality                                                                 | Consequence                                                           |
| -------------------- | -------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| Architecture         | One 635-line HTML file with inline CSS, inline JS and 30+ `onclick=` hooks | No module boundaries, no reuse, no unit-testable logic                |
| Delivery             | No build step, no lockfile, no CI                                          | "Works on my machine" only; regressions reach users unnoticed         |
| Offline promise      | Service worker listed CDN assets in an unused constant                     | A first visit without network could not boot; the PWA claim was false |
| Runtime dependencies | Tailwind CDN, Google Fonts, cdnjs Prism/autoloader/html2canvas             | Slow cold start, third-party tracking surface, supply-chain risk      |
| Security             | No CSP, no SRI, inline handlers require `unsafe-inline`                    | Any injected script would execute with full page privileges           |
| Data safety          | Nothing persisted; changing language overwrote the editor                  | Accidental data loss was the default behaviour                        |
| Export               | Fixed 3× PNG only, no size guard                                           | Blank/failed exports on large snippets; no format choice              |
| Quality              | Zero automated tests, linting, formatting or budget gates                  | Every change was a manual regression risk                             |

v3 closes the structural gaps. It keeps the zero-backend, privacy-first contract,
but adds a build pipeline, an explicit state model, a test pyramid, supply-chain
controls, and a delivery path that can be audited.

---

## 2. What v2 actually contained

| File            | Size / role                                                                                     |
| --------------- | ----------------------------------------------------------------------------------------------- |
| `index.html`    | 635 lines — markup, Tailwind utility classes, ~140 lines of inline CSS, ~215 lines of inline JS |
| `manifest.json` | Minimal install metadata                                                                        |
| `sw.js`         | Hand-written cache-first/network-first service worker                                           |
| `README.md`     | 537 lines of setup and GitHub Pages instructions                                                |
| `screenshots/`  | Four PNGs, no automated capture                                                                 |
| `LICENSE`       | MIT                                                                                             |

There was no `package.json`, lockfile, test, linter, formatter, workflow, or
architecture document.

---

## 3. Findings

Severity uses a simple scale: **Critical** (data loss / exploitable / product
promise broken), **High** (likely user-visible failure), **Medium** (maintenance
or performance drag), **Low** (polish).

### F-01 — The offline claim was not true on first load · Critical

`sw.js` defined `CDN_ASSETS` but **never used it**. The install handler only
pre-cached `./`, `./index.html` and `./manifest.json`. The document itself then
requested five cross-origin scripts/styles. On a cold, offline first visit the
service worker could not intercept requests it had never seen, and the app had no
Tailwind, Prism or html2canvas.

Additionally, the local strategy was network-first, so even a cached app waited
for a failing network round trip before falling back to cache.

**v3:** all runtime code, fonts and styles are bundled; Workbox pre-caches 42
same-origin entries (≈895 KiB). Offline boot is verified by an end-to-end test.

### F-02 — Third-party runtime supply chain · High

Every page load depended on `cdn.tailwindcss.com`, `fonts.googleapis.com`,
`fonts.gstatic.com`, and four `cdnjs.cloudflare.com` URLs. None had
Subresource Integrity. A compromise or outage at any of those origins changed or
broke the app without a deploy.

The Tailwind CDN also compiles CSS in the browser at runtime, which produces a
flash of unstyled content and ships a much larger payload than a compiled
stylesheet.

**v3:** Tailwind is compiled at build time; fonts are `@fontsource` packages;
Prism and html2canvas are npm dependencies with a lockfile. The CSP allows
`'self'` only.

### F-03 — No Content Security Policy and inline event handlers · High

The page used `onclick="..."` throughout. That forces any future CSP to allow
`'unsafe-inline'` for scripts, which removes most of the protection a CSP
provides. There was no `Content-Security-Policy`, `X-Content-Type-Options`, or
frame-ancestors control.

**v3:** zero inline handlers, one module entry point, a restrictive meta CSP, and
`public/_headers` for hosts that support response headers.

### F-04 — Changing language destroyed the snippet · High

`onLanguageChange()` replaced the textarea with the example for the selected
language, with no confirmation, undo, or backup. A stray change could erase a
long paste. There was also no persistence: a reload lost everything.

**v3:** language changes never touch the code; state is auto-saved (debounced,
quota-safe), and undo/redo covers both code and settings.

### F-05 — Export could fail silently or produce blank images · High

`downloadPNG()` always requested `scale: 3` and had no guard for canvas
dimensions. Large snippets, high padding, or a small viewport can exceed browser
canvas limits (notably Safari/iOS); the failure path only logged to the console
and showed "Capture Failed". The clone workaround (`display: inline-block`) was
fragile, and the filename was an opaque `Date.now()`.

**v3:** export measures the preview first, rejects outputs above 40 MP, exposes
1–4× scale plus PNG/JPEG/WebP and quality, copies to the clipboard where
supported, and uses deterministic filenames. The export dialog shows the exact
pixel dimensions before rendering.

### F-06 — Theme switching depended on a network round trip and a timer · Medium

`applyTheme()` swapped a remote stylesheet `href` and then waited a fixed 150 ms
before re-highlighting. On a slow connection the preview could render with the
previous palette, and the theme was not available offline unless previously
cached. Theme background colours lived in a second, hand-maintained map.

**v3:** themes are local CSS-variable palettes applied by `data-theme`; no
network, no timer, no palette drift.

### F-07 — Cold-start performance was uncontrolled · Medium

The critical path included: HTML → Tailwind runtime → Google Fonts CSS (10
families, all subsets) → 10 font files → Prism core → autoloader → grammar →
html2canvas. No budgets existed, so regressions were invisible.

**v3:** one JS bundle (≈84 KB gzip including the PWA runtime), one CSS file
(≈7 KB gzip), latin-only WOFF2 fonts, and a budget gate that fails CI above
260 KB JS / 60 KB CSS / 2.6 MB assets.

### F-08 — Accessibility was incidental · Medium

Emoji-only buttons (`⚙️`) had no accessible name, the sidebar toggle did not
expose state, the preview updated silently, and focus management for overlays
was absent. There was no skip link or reduced-motion handling.

**v3:** labelled controls, `aria-expanded`/`aria-pressed`, native `<dialog>`
focus trapping, a skip link, visible focus rings, status toasts, and a
`prefers-reduced-motion` block. Lighthouse accessibility is gated at ≥0.95.

### F-09 — No automated quality signal · High (organisational)

With no tests, linting, formatting, or CI, every change relied on the author
remembering to click through the app. There was no dependency update process and
no security scanning.

**v3:** unit tests for state/share/detection/render/storage/config, Playwright
journeys on desktop and mobile Chromium, ESLint/Stylelint/html-validate,
Prettier, CodeQL, Dependency Review, Lighthouse CI, OpenSSF Scorecard, and
Dependabot.

### F-10 — Manual, undocumented deployment · Medium

The README instructed users to upload files through the GitHub UI and enable
Pages from the repository root. That works for a demo but has no reproducibility,
no artifact, no rollback, and no environment separation.

**v3:** `deploy-pages.yml` builds with the correct `VITE_BASE`, enforces budgets,
uploads a Pages artifact and deploys through the official action. Releases are
tag-driven, produce a zip + SPDX SBOM, and carry build provenance attestation.

### F-11 — SEO and metadata were thin · Low

The document had a title and basic description, but no canonical URL, Open Graph
or Twitter cards, no structured data, and no `robots.txt`/`sitemap.xml`.

**v3:** full social metadata, canonical link, `robots.txt`, `sitemap.xml`,
generated OG image, and install screenshots in the manifest.

### F-12 — Service worker lifecycle was unsafe · Medium

`skipWaiting()` ran during install, so a new worker could take control while old
pages were still running, mixing asset versions. There was no update prompt and
no cache expiry policy.

**v3:** `registerType: 'prompt'`, an explicit update banner, `cleanupOutdatedCaches`,
and hourly update checks.

---

## 4. Risk matrix (v2, before remediation)

| Likelihood ↓ / Impact → | Low  | Medium           | High             | Critical |
| ----------------------- | ---- | ---------------- | ---------------- | -------- |
| **High**                | F-11 | F-06, F-07, F-12 | F-02, F-04, F-09 | F-01     |
| **Medium**              |      | F-08             | F-03, F-05       |          |
| **Low**                 |      | F-10             |                  |          |

---

## 5. What changed, and why it is better

| Finding | v3 control                                                     | Verification                         |
| ------- | -------------------------------------------------------------- | ------------------------------------ |
| F-01    | Same-origin Workbox precache; no runtime CDN                   | `npm run build`, offline E2E         |
| F-02    | npm + lockfile, Dependency Review, Dependabot, Scorecard       | CI workflows                         |
| F-03    | CSP meta + `_headers`, no inline handlers                      | `index.html`, Lighthouse             |
| F-04    | Persistence + undo/redo, non-destructive language switch       | unit + E2E tests                     |
| F-05    | Size guard, format/scale/quality controls, deterministic names | unit tests + export E2E              |
| F-06    | Local CSS-variable themes                                      | theme E2E                            |
| F-07    | Bundled assets, latin fonts, bundle budgets                    | `npm run size`                       |
| F-08    | Labels, dialogs, focus, reduced motion                         | Lighthouse + manual audit            |
| F-09    | Test pyramid + 7 workflows                                     | CI status                            |
| F-10    | Pages deploy + attested releases                               | workflow logs                        |
| F-11    | Metadata, sitemap, robots, OG image                            | build output                         |
| F-12    | Prompt-based SW updates                                        | update banner + SW registration test |

---

## 6. Residual risks and honest limitations

These are not regressions; they are boundaries of a static, client-side product.

1. **html2canvas is a best-effort renderer.** It re-implements CSS layout in
   JavaScript. Modern colour functions (`oklch`, `color-mix`), some filters and
   advanced typography are unsupported. v3 constrains the export path to
   hex/rgb and documents the rule in `CONTRIBUTING.md`.
2. **Canvas limits are browser-specific.** The 40 MP guard is conservative but
   cannot guarantee every device. The UI explains the limit and lets the user
   reduce scale.
3. **Shared links are not secrets.** A `#s=` fragment contains the snippet. It is
   not sent to a server, but it is visible to anyone with the URL and may appear
   in browser history. The UI does not imply confidentiality.
4. **GitHub Pages cannot set response headers.** The meta CSP works, but HSTS,
   `X-Frame-Options` and `Permissions-Policy` only apply on hosts that honour
   `_headers` (Netlify, Cloudflare Pages).
5. **No field telemetry by default.** There is no RUM dataset. Core Web Vitals
   reporting is opt-in via `VITE_ANALYTICS_ENDPOINT` and only sends aggregate
   metrics.
6. **Chromium is the tested browser.** Firefox and WebKit are supported by the
   code but not yet in the CI matrix.

---

## 7. Success metrics for v3

| Metric                              | Target                 | Source                    |
| ----------------------------------- | ---------------------- | ------------------------- |
| JS payload (gzip)                   | ≤ 260 KB               | `npm run size`            |
| CSS payload (gzip)                  | ≤ 60 KB                | `npm run size`            |
| Total build output                  | ≤ 3.4 MB               | `npm run size`            |
| Lighthouse performance              | ≥ 0.90                 | Lighthouse CI (best of 3) |
| Lighthouse accessibility            | ≥ 0.95                 | Lighthouse CI             |
| Unit test pass rate                 | 100%                   | Vitest                    |
| Desktop + mobile E2E                | 100%                   | Playwright                |
| Offline boot after first visit      | passes                 | Playwright SW test        |
| High/critical dependency advisories | 0 unmerged             | Dependency Review         |
| Release provenance                  | attested for every tag | `release.yml`             |

---

## 8. Conclusion

v2 was a strong single-purpose demo with a misleading PWA claim and no
engineering safety net. v3 is the same product with the safety net installed:
deterministic builds, an explicit state model, enforceable budgets, a test
pyramid, and a supply chain that can be reviewed. The remaining gaps are
product-scope decisions (renderer fidelity, browser matrix, i18n) rather than
structural debt.
