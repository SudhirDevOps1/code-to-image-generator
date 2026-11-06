# Architecture

CodeSnap is a **static, offline-first single-page application**. It has no
server, no account system, and no data store outside the browser. Everything
below is designed around that constraint.

---

## 1. System context

```
┌────────────────────────────────────────────────────────────────────┐
│ Browser                                                            │
│                                                                    │
│  index.html ──► main.js ──► ui.js ──► state.js (single source)     │
│                    │           │                                   │
│                    │           ├── highlight.js ──► Prism (local)  │
│                    │           ├── render.js   (pure helpers)      │
│                    │           ├── share.js    (lz-string)         │
│                    │           ├── storage.js  (localStorage)      │
│                    │           └── export.js   (html2canvas)       │
│                    │                                               │
│                    ├── pwa.js ──► Workbox-generated service worker │
│                    └── telemetry.js (opt-in Web Vitals only)       │
│                                                                    │
│  CSS: Tailwind build + design tokens + local theme palettes        │
│  Fonts: @fontsource WOFF2, latin subsets, same origin              │
└────────────────────────────────────────────────────────────────────┘
              │
              ▼
   Static host (GitHub Pages / Netlify / Cloudflare Pages)
   No API, no cookies, no server-side session
```

**Trust boundary:** the deployed bundle and the browser. Snippets, share links,
imported files and `localStorage` are all untrusted input and pass through
`normalizeState`.

---

## 2. Module map

| Module                | Responsibility                                                                      | Tested |
| --------------------- | ----------------------------------------------------------------------------------- | ------ |
| `src/main.js`         | Imports CSS, boots the UI, wires the PWA update banner and global error hooks       | E2E    |
| `src/js/config.js`    | Pure data: languages, fonts, themes, gradients, examples, formats, limits, defaults | unit   |
| `src/js/state.js`     | Normalisation, defaults, observable store, undo/redo with coalescing                | unit   |
| `src/js/storage.js`   | Defensive `localStorage` wrapper; never throws                                      | unit   |
| `src/js/share.js`     | `#s=` encode/decode with size cap                                                   | unit   |
| `src/js/detect.js`    | Filename-extension and content-signature language detection                         | unit   |
| `src/js/render.js`    | Pure presentation helpers: gradients, line numbers, counts, filenames, labels       | unit   |
| `src/js/highlight.js` | Escaping tokenizer plus an on-demand loader for non-core Prism grammars             | via UI |
| `src/js/prism.js`     | Prism core configured for the browser, no autoloader                                | via UI |
| `src/js/export.js`    | Preview measurement, canvas capture, encoding, download and clipboard               | E2E    |
| `src/js/ui.js`        | All DOM bindings, rendering, dialogs, import, shortcuts, persistence scheduling     | E2E    |
| `src/js/pwa.js`       | Service worker registration, update prompt, hourly update check                     | E2E    |
| `src/js/telemetry.js` | Opt-in Core Web Vitals beacon; no-op unless an endpoint is configured               | —      |

Dependency direction is one-way: `ui.js` depends on pure modules; pure modules
never import UI or DOM code. This is what makes the core unit-testable in jsdom
without rendering the whole app.

---

## 3. Boot sequence

1. `index.html` loads the module entry. A strict CSP is already in effect.
2. `main.js` imports the compiled CSS (fonts, tokens, components, themes).
3. `initApp()`:
   - creates the storage adapter,
   - resolves initial state: **share hash → saved session → defaults**,
   - fills selects from `config.js`, builds preset swatches,
   - subscribes rendering and debounced persistence to the store,
   - binds every control with `addEventListener` (no inline handlers),
   - registers keyboard shortcuts, offline state, drag-and-drop and dialogs,
   - performs the first render.
4. `initPwa()` registers the generated worker with `registerType: 'prompt'`.
5. On `load`, `initWebVitals()` attaches observers. Nothing leaves the browser
   unless `VITE_ANALYTICS_ENDPOINT` was set at build time.
6. When `document.fonts.ready` resolves, the preview is re-rendered once so
   measurements and canvas output use the final font metrics.

---

## 4. State model

State is a **single flat object** with a fixed allow-list:

```
code, language, font, theme, fontSize, padding, shadow, shadowColor,
bgMode, bgFrom, bgTo, bgAngle, bgColor, showLineNumbers,
showWindowControls, windowTitle, watermark, exportScale, exportFormat,
exportQuality, transparent
```

Rules enforced by `normalizeState`:

- unknown keys are dropped (no prototype pollution, no accidental persistence),
- every enum is checked against the configuration allow-list,
- every colour must match `#rrggbb`,
- every number is clamped to `LIMITS`,
- strings are truncated to their limit (`code` 200,000 chars, watermark 60,
  window title 80).

The store is intentionally small:

```
set(patch) ──► normalize ──► equal? stop
                 │
                 ├─ history push (unless coalesced)
                 ├─ redo stack cleared
                 └─ notify subscribers
```

- **Coalescing:** consecutive edits to the same field within 600 ms share one
  undo step. Slider drags and fast typing do not create 50 history entries.
- **Limit:** 50 undo steps.
- **Immutable:** each update produces a new object, so rendering is a pure
  function of the current snapshot.

Undo/redo is not bound while focus is inside an input, textarea or select, so
native text undo keeps working.

---

## 5. Rendering pipeline

```
state ──► renderCode()   ──► Prism tokenizer ──► <code> innerHTML (escaped)
      ├─► renderStyles() ──► CSS custom properties / inline hex-rgb values
      ├─► syncControls() ──► form state (guards focused fields)
      └─► updateExportInfo() ──► measured dimensions + budget warning
```

Key decisions:

- **Code is data.** `highlightCode` assigns `textContent` first; Prism escapes
  the source while tokenising. No user string is concatenated into HTML.
- **Themes are local.** `data-theme` on the export container selects a palette in
  `src/styles/themes.css`. Switching does not fetch anything and cannot race.
- **Export colours stay legacy.** The export path uses hex/rgb only because
  html2canvas cannot parse `oklch()` or `color-mix()`. This is a documented
  contribution rule, not an accident.
- **Preview is the source of truth for size.** Export dimensions come from
  `getBoundingClientRect()` of the actual preview, so what the dialog reports is
  what gets rendered.

---

## 6. Export pipeline

```
open dialog ──► measure preview × scale
                     │
                     ├─ > 40 MP ──► block, explain, suggest lower scale
                     └─ OK
                          │
                          ▼
             await document.fonts.ready
                          │
                          ▼
        html2canvas(preview, { scale, backgroundColor: null })
                          │
          ┌───────────────┴───────────────┐
          ▼                               ▼
   canvas.toBlob(format, quality)   clipboard.write(PNG blob)
          │                               │
          ▼                               ▼
   <a download="codesnap-…">        toast confirmation
```

Guards:

- zero-sized preview → `NOT_READY` (prevents blank images during layout),
- pixel count above `LIMITS.maxCanvasPixels` → `TOO_LARGE`,
- unsupported clipboard → `COPY_UNSUPPORTED` with a user-facing message,
- font load failure never blocks the export.

Filenames are deterministic and sortable:
`codesnap-<ext>-YYYYMMDD-HHMMSS.<png|jpg|webp>`.

---

## 7. Sharing and persistence

**Share link**

```
state ──JSON──► lz-string compressToEncodedURIComponent ──► #s=<payload>
```

- The payload is capped at 8,000 encoded characters; larger snippets get an
  explicit error instead of a broken URL.
- Decoding validates the prefix, decompresses, parses, and normalises. A corrupt
  or hostile link falls back to saved state or defaults; it cannot inject fields.
- The URL is updated with `history.replaceState`, so the back button is not
  polluted.
- A share link is **not** encrypted. It is a clipboard convenience, not a secret
  channel.

**Persistence**

- Key: `codesnap.state.v3`.
- Code edits are debounced (160 ms) before entering the store; the store writes
  to `localStorage` after a further 400 ms, and on `pagehide` /
  `visibilitychange`.
- Quota, private mode and disabled storage degrade to a no-op. The editor never
  crashes because persistence is unavailable.

---

## 8. PWA and caching

- `vite-plugin-pwa` generates the worker at build time from the actual asset
  manifest; there is no hand-maintained file list to drift.
- Precache: JS, CSS, HTML, fonts, icons, manifest, `robots.txt`, `sitemap.xml`
  (42 entries, ≈895 KiB at v3.0.0).
- Navigation falls back to `index.html`.
- `registerType: 'prompt'` keeps the running tab stable; the UI shows an update
  banner and reloads only on confirmation.
- `cleanupOutdatedCaches` removes superseded precaches.
- The registration checks for a new deployment hourly.
- Offline state is surfaced by a banner driven by `online`/`offline` events.

---

## 9. Security architecture

| Layer           | Control                                                                |
| --------------- | ---------------------------------------------------------------------- |
| Transport       | HTTPS on all supported hosts; HSTS via `_headers` where available      |
| Document        | CSP `default-src 'self'`; no inline scripts; `object-src 'none'`       |
| Framing         | `frame-ancestors 'none'` (meta) + `X-Frame-Options: DENY` (`_headers`) |
| Input           | Allow-list normalisation; length/range caps; no HTML concatenation     |
| Rendering       | `textContent` + Prism escaping; no `innerHTML` with user data          |
| Dependencies    | Lockfile, Dependabot, Dependency Review, CodeQL, Scorecard             |
| Runtime network | None. No analytics unless explicitly configured at build time          |
| Browser storage | Only the app state; no tokens, no identifiers, no PII                  |
| Export          | Canvas-only; user content never uploaded                               |

**What is deliberately not present:** authentication, authorization, server-side
sessions, database, file upload endpoint, third-party embeds. Their absence is a
security property, not a missing feature.

---

## 10. Build and delivery topology

```
PR ──► CI (lint, format, unit, build, budgets, E2E)
   ├──► CodeQL
   ├──► Dependency Review
   ├──► Lighthouse CI
   └──► merge to main
             │
             ├──► Deploy to GitHub Pages (artifact, VITE_BASE=/<repo>/)
             └──► tag vX.Y.Z ──► Release (verify, zip, SBOM, provenance)
```

- **Base path:** `VITE_BASE` controls `base`. Pages uses
  `/<repository-name>/`; custom domains use `/`.
- **Determinism:** Node 22, `npm ci`, lockfile, fixed Actions majors.
- **Artifacts:** `dist/` for Pages; `codesnap-dist.zip` + `sbom.spdx.json` for
  releases.
- **Budgets:** failing `npm run size` blocks both CI and deploy.

---

## 11. Extension points

| Change               | Where                                                                  |
| -------------------- | ---------------------------------------------------------------------- |
| New language         | `config.js` + loader entry in `highlight.js` + E2E test                |
| New theme            | `themes.css` palette + `THEMES` metadata + test                        |
| New gradient preset  | `GRADIENTS` in `config.js`                                             |
| New export format    | `EXPORT_FORMATS` + `canvasToBlob` mapping                              |
| New persisted field  | `DEFAULT_STATE` + `normalizeState` + `LIMITS` + tests                  |
| Alternative renderer | Replace `captureCanvas` behind the same `ExportError` contract         |
| Localisation         | Extract strings from `index.html`/`ui.js`; keep state language-neutral |

The architecture intentionally keeps the pure core independent of the DOM so a
future renderer (SVG, OffscreenCanvas, WASM) can be swapped without rewriting
state, sharing, or controls.
