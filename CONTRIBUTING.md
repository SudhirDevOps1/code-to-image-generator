# Contributing to CodeSnap

Thanks for taking the time to improve CodeSnap. This document covers the local
workflow, the quality gates that CI enforces, and the conventions we follow.

## Quick start

```bash
npm ci
npm run dev        # http://localhost:5173
npm test           # unit tests (Vitest)
npm run test:e2e   # browser tests (Playwright, builds first)
npm run verify     # lint + format + unit tests + build + bundle budget
```

Requirements: Node.js 20.19+ (see `.nvmrc`; CI uses Node 22).

## Project layout

| Path               | Purpose                                           |
| ------------------ | ------------------------------------------------- |
| `index.html`       | Vite entry — markup only, no inline JS/CSS        |
| `src/main.js`      | Bootstrap, PWA update banner, observability       |
| `src/js/config.js` | Languages, fonts, themes, presets, defaults       |
| `src/js/state.js`  | Normalisation, observable store, undo/redo        |
| `src/js/ui.js`     | DOM bindings and rendering                        |
| `src/js/export.js` | html2canvas capture, encoding, download/clipboard |
| `src/js/share.js`  | Compressed share links                            |
| `src/styles/`      | Tailwind entry, design tokens, syntax palettes    |
| `tests/unit`       | Pure-logic tests                                  |
| `tests/e2e`        | Playwright user journeys                          |
| `docs/`            | Architecture, analysis, roadmap, operations       |

## Quality gates

Every pull request must pass:

1. `npm run lint` — ESLint, Stylelint, html-validate
2. `npm run format:check` — Prettier
3. `npm run test:coverage` — Vitest
4. `npm run test:e2e` — Playwright (Chromium + mobile Chrome)
5. `npm run build` and `npm run size` — production build and budgets
6. CodeQL, Dependency Review, Lighthouse CI, OpenSSF Scorecard

## Conventions

- **Zero third-party network calls.** Fonts, Prism, and renderers are bundled.
- **No `innerHTML` with user input.** Code is rendered with `textContent` or
  Prism's escaping tokenizer.
- **State is immutable and normalised.** Anything coming from storage or a URL
  goes through `normalizeState`.
- **All colours in the export path must remain hex/rgb** — html2canvas cannot
  parse modern colour functions.
- **Commit messages:** Conventional Commits (`feat:`, `fix:`, `chore:`,
  `docs:`, `test:`, `refactor:`). Releases are tagged `vX.Y.Z`.
- **Accessibility:** every control needs a label, focus state and keyboard path.

## Adding a language or theme

1. Add the entry to `src/js/config.js`.
2. Import the Prism grammar in `src/js/highlight.js` (order matters).
3. For a theme, add a palette block to `src/styles/themes.css`.
4. Extend the tests in `tests/unit/config.test.js`.
5. Add a screenshot or note to the changelog when user-visible.

## Reporting security issues

Do **not** open a public issue. Follow [SECURITY.md](SECURITY.md).
