# Changelog

All notable changes to this project are documented here.
The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and
this project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Planned

- Multi-snippet tabs
- Optional Hindi / Hinglish UI
- Templated presets and team sharing

## [3.0.0] — 2026-11-06

### Added

- Modular architecture: Vite build, ES modules, typed configuration, explicit state store.
- Enterprise delivery layer: CI, CodeQL, Dependency Review, Lighthouse CI, OpenSSF
  Scorecard, automated GitHub Pages deployment, attested releases with SBOM.
- Quality gates: ESLint, Stylelint, html-validate, Prettier, Vitest unit tests,
  Playwright end-to-end tests and bundle-size budgets.
- Undo/redo history with burst coalescing.
- Auto-save to `localStorage`, debounced and quota-safe.
- Shareable, compressed `#s=` links with strict validation.
- Export dialog: 1–4× scale, PNG/JPEG/WebP, quality control, transparent background.
- Copy image to clipboard.
- Line numbers, window controls toggle, custom window title and watermark.
- Gradient editor (from/to/angle) plus 10 presets, solid colour mode.
- File import and drag-and-drop with language detection.
- PWA update prompt, offline banner, hourly update checks.
- Self-hosted fonts and syntax themes — zero runtime CDN dependencies.
- Accessibility pass: labelled controls, focus states, dialogs, skip link,
  reduced-motion support.
- Security: strict CSP, input normalisation, dependency and supply-chain scanning.
- Documentation: deep analysis, architecture, roadmap, operations runbook,
  enterprise readiness checklist.

### Changed

- Prism themes are now curated CSS palettes instead of remote theme stylesheets.
- html2canvas and non-default Prism grammars load on demand; initial JS is ~21 KB gzip.
- Export filenames are deterministic: `codesnap-<lang>-<timestamp>.<ext>`.
- UI rebuilt with semantic components and design tokens.

### Removed

- Tailwind CDN, Google Fonts, cdnjs and all other runtime third-party requests.
- Inline `<script>` and `onclick` handlers (CSP-safe event listeners only).

## [2.0.0] — 2025

### Added

- 10 fonts, 10 syntax themes, 10 canvas presets.
- PNG export at 3× using html2canvas.
- PWA manifest, service worker and offline banner.

## [1.0.0] — 2024

### Added

- Initial single-file code-to-image generator.
