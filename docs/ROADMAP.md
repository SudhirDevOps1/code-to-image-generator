# Roadmap

The roadmap is ordered by **risk reduction first, user value second**. Every item
has an observable acceptance criterion so "done" is not a matter of opinion.

Effort: `S` ≤ 2 days · `M` ≤ 1 week · `L` > 1 week (one engineer).

---

## 0. v3.0 — Foundation (shipped)

| Theme         | Delivered                                                                    |
| ------------- | ---------------------------------------------------------------------------- |
| Architecture  | Vite + ES modules, pure core, explicit store, no inline handlers             |
| Offline       | Same-origin Workbox precache, update prompt, offline banner                  |
| Editor        | Auto-save, undo/redo, share links, file import, detection                    |
| Export        | 1–4× scale, PNG/JPEG/WebP, quality, transparency, clipboard, size guard      |
| Design        | Local fonts, 10 themes, gradient editor, 10 presets, line numbers, watermark |
| Quality       | ESLint, Stylelint, html-validate, Prettier, Vitest, Playwright, budgets      |
| Security      | CSP, input allow-lists, CodeQL, Dependency Review, Scorecard, Dependabot     |
| Delivery      | Pages deploy, tag-driven release, SBOM, provenance attestation               |
| Documentation | Analysis, architecture, roadmap, operations, enterprise readiness            |

---

## 1. Next — Hardening and reach (0–3 months)

### 1.1 Browser matrix: Firefox + WebKit · M · P1

**Why:** export and clipboard behaviour differ materially outside Chromium; the
current suite proves only one engine.

**Acceptance criteria**

- Playwright projects for `firefox` and `webkit` run the desktop journeys.
- Export test accepts a downloaded file and verifies a non-zero PNG signature in
  all three engines.
- Clipboard test skips gracefully where `ClipboardItem` is unavailable.
- CI matrix completes in ≤ 20 minutes; flaky retries are reported, not hidden.

### 1.2 Accessibility conformance (WCAG 2.2 AA) · M · P1

**Why:** Lighthouse is a smoke test, not a conformance audit.

**Acceptance criteria**

- Axe scan on desktop and mobile journeys with zero serious/critical findings.
- Keyboard-only path covers import, theme, export, share, reset and dialogs.
- Focus returns to the invoking control after every dialog closes.
- `prefers-contrast: more` and 200% zoom verified.
- Documented exception list (if any) with rationale and owner.

### 1.3 Visual regression for preview and export · M · P1

**Why:** themes, fonts and gradient math are visual; unit tests cannot catch a
one-pixel regression or a wrong palette.

**Acceptance criteria**

- Playwright screenshots for 3 themes × 2 fonts × desktop/mobile, committed as
  baselines.
- Export produces a deterministic image for a fixed snippet, clock and scale.
- Diff threshold documented; failures upload actual/expected/diff artifacts.
- Baselines update through a deliberate `--update-snapshots` workflow, never
  automatically in CI.

### 1.4 Template gallery · M · P2

**Why:** the blank editor is the biggest first-use hurdle. Templates turn intent
("announce a release", "share a tip") into a result in one click.

**Acceptance criteria**

- 8–12 curated templates (announcement, tip, diff, terminal, quote, changelog).
- Templates are static data, validated by the same `normalizeState` path.
- Selecting a template is one undoable action and does not overwrite a dirty
  snippet without confirmation.
- Gallery is keyboard navigable and works offline.

### 1.5 i18n foundation (English + Hindi) · M · P2

**Why:** the primary audience includes Hinglish-speaking developers; the UI is
currently English-only and strings are scattered.

**Acceptance criteria**

- Strings extracted to locale catalogs; no user-facing literal remains in
  `ui.js` or `index.html` markup.
- `en` and `hi` locales with a language switch persisted in state.
- `lang` attribute, number/date formatting and font fallbacks verified.
- Pseudo-locale build used in CI to catch truncation and hard-coded strings.
- Share links stay language-neutral (language is a UI preference, not state).

### 1.6 Error reporting without surveillance · S · P2

**Why:** silent client failures are invisible today.

**Acceptance criteria**

- Opt-in "send diagnostics" action that shows the exact payload before sending.
- Payload contains browser version, app version, error name/message and no code,
  URL fragment, or identifiers.
- Disabled by default; documented in `SECURITY.md`.

---

## 2. Later — Capability expansion (3–9 months)

### 2.1 Multi-snippet tabs · L · P2

**Why:** users routinely prepare several images in one session.

**Acceptance criteria**

- Up to 10 tabs, each with independent state; active tab restores on reload.
- Reorder, duplicate, rename, close-with-undo.
- Share link can encode the active tab only; a "bundle" link is explicitly out
  of scope.
- Storage migration from v3 single-state is automatic and lossless.

### 2.2 Diff and annotation mode · L · P2

**Why:** "before/after" and code-review visuals are a common request.

**Acceptance criteria**

- Two-pane or unified diff with added/removed line treatments in every theme.
- Optional highlight box, arrow and blur annotation rendered into the export.
- Annotations are editable and undoable; no freehand drawing in v1.
- Export parity verified by visual regression.

### 2.3 Renderer v2 evaluation · L · P3

**Why:** html2canvas is the main fidelity and performance ceiling.

**Candidates:** SVG serialisation + `resvg`/WASM rasterisation, OffscreenCanvas,
or a purpose-built canvas text renderer.

**Acceptance criteria**

- Spike compares fidelity (ligatures, emoji, gradients, shadows), bundle cost,
  cold-start time and Safari behaviour against html2canvas.
- Decision recorded as an ADR with measured numbers.
- Migration keeps the `captureCanvas`/`ExportError` contract and all export E2E
  tests green.

### 2.4 SVG and PDF export · M · P3

**Acceptance criteria**

- SVG export preserves text as selectable text where the renderer allows it.
- PDF is a single page sized to the snippet, no server involved.
- Both formats participate in the size guard and filename scheme.
- Documented differences from raster output.

### 2.5 Team template packs · M · P3

**Why:** organisations want a consistent visual identity without a backend.

**Acceptance criteria**

- A pack is a signed, versioned JSON file containing palettes, fonts, presets and
  defaults.
- Import validates schema and rejects unknown keys/colours.
- Packs can be shared as a file or a `#p=` link under the same size cap.
- No automatic remote fetch; packs are user-supplied artifacts.

### 2.6 Desktop wrapper (optional) · M · P3

**Acceptance criteria**

- Tauri (preferred) or Electron shell loads the same static bundle.
- Native save dialog, filesystem drag-and-drop and offline updates work.
- Installer size and update channel documented.
- Web build remains the primary target; no feature forks.

---

## 3. Explicit non-goals

These are deliberately out of scope. Revisiting them requires a new ADR.

| Non-goal                          | Reason                                                          |
| --------------------------------- | --------------------------------------------------------------- |
| User accounts / cloud sync        | Breaks the zero-backend, privacy-first contract                 |
| Server-side rendering service     | Cost and attack surface with no user benefit                    |
| Analytics or ad SDKs              | Unnecessary for the product; conflicts with the privacy promise |
| Uploading snippets to a shortener | Turns a client-side tool into a data processor                  |
| Freehand image editor             | Different product; annotation mode covers the common case       |
| Native mobile apps                | The PWA already installs; maintenance cost is not justified yet |
| AI code explanation/generation    | Requires a backend or API key and changes the trust model       |

---

## 4. Sequencing and dependencies

```
1.1 browser matrix ──► 1.3 visual regression ──► 2.3 renderer evaluation
        │                      │
        └──► 1.2 accessibility ┘
1.5 i18n ──► 1.4 templates ──► 2.1 tabs ──► 2.2 diff/annotation
1.6 diagnostics ──► 2.5 template packs
```

- Visual regression (1.3) should land before any theme or renderer work.
- i18n (1.5) should land before templates so template copy is translatable from
  day one.
- Renderer evaluation (2.3) is a spike, not a commitment; it can end in "keep
  html2canvas".

---

## 5. Definition of done (every item)

1. Acceptance criteria met and demonstrated in the PR.
2. Unit and/or E2E coverage for the new behaviour.
3. No regression in bundle budgets or Lighthouse thresholds.
4. Accessibility checked (labels, focus, keyboard, reduced motion).
5. Documentation updated (`README`, relevant `docs/`, `CHANGELOG`).
6. Security review for any new dependency or data flow.
7. Rollback path stated in the PR description.
