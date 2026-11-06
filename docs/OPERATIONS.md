# Operations runbook

This document is for maintainers. It covers local setup, the CI/CD topology,
release and rollback, and the failure modes specific to a static PWA.

---

## 1. Local environment

| Requirement | Version                                                     |
| ----------- | ----------------------------------------------------------- |
| Node.js     | 20.19+ locally, 22 in CI (`.nvmrc`)                         |
| npm         | 10+ (comes with Node 22)                                    |
| OS          | Windows, macOS or Linux                                     |
| Browsers    | Chromium for Playwright (`npx playwright install chromium`) |

```bash
npm ci
npm run dev          # http://localhost:5173
```

The dev server has no service worker by design (`devOptions.enabled: false`), so
caching never masks a change. Test PWA behaviour against `npm run preview`.

---

## 2. Command reference

| Command                 | What it does                                                | When to use                    |
| ----------------------- | ----------------------------------------------------------- | ------------------------------ |
| `npm run dev`           | Vite dev server with HMR                                    | Day-to-day                     |
| `npm run build`         | Regenerates icons, builds `dist/`, emits PWA worker         | Before preview / release       |
| `npm run preview`       | Serves `dist/` on 4173                                      | Manual verification, PWA       |
| `npm run icons`         | Regenerates favicons, PWA icons, OG image from the SVG mark | After changing the brand mark  |
| `npm run lint`          | ESLint + Stylelint + html-validate                          | Before every commit            |
| `npm run format`        | Prettier write                                              | Before every commit            |
| `npm run format:check`  | Prettier check (CI mode)                                    | CI / pre-push                  |
| `npm test`              | Vitest unit suite                                           | Fast feedback                  |
| `npm run test:coverage` | Vitest + V8 coverage + JUnit in CI                          | CI                             |
| `npm run test:e2e`      | Builds, starts preview, runs Playwright desktop + mobile    | Before a PR                    |
| `npm run size`          | Enforces JS/CSS/asset/total budgets                         | CI and deploy                  |
| `npm run verify`        | lint → format check → unit → build → size                   | Single local gate              |
| `npm run lighthouse`    | Lighthouse CI against `dist/`                               | Performance/accessibility work |

`npm run verify` does **not** run Playwright. Run `npm run test:e2e` explicitly;
it builds first and is slower.

---

## 3. CI/CD topology

| Workflow                | Trigger                          | Gate                                                        |
| ----------------------- | -------------------------------- | ----------------------------------------------------------- |
| `ci.yml` → quality      | push to `main`, any PR           | lint, format, coverage, build, bundle budgets               |
| `ci.yml` → e2e          | push to `main`, any PR           | Playwright Chromium + Pixel 7                               |
| `codeql.yml`            | push/PR to `main`, weekly        | JavaScript/TypeScript security-and-quality queries          |
| `dependency-review.yml` | PR                               | blocks high/critical vulnerable dependency changes          |
| `lighthouse.yml`        | PR touching app/config, manual   | perf ≥ 0.90, a11y ≥ 0.95, best practices/SEO ≥ 0.90         |
| `deploy-pages.yml`      | push to `main`, manual           | builds with `VITE_BASE`, enforces budgets, deploys artifact |
| `release.yml`           | tag `v*.*.*`, manual             | verifies, zips, SBOM, provenance attestation, publishes     |
| `scorecard.yml`         | weekly, push, branch rule change | OpenSSF Scorecard SARIF upload                              |

All workflows use least-privilege `permissions:` blocks and concurrency groups
that cancel superseded runs.

---

## 4. Branch protection (repository admin, one-time)

Configure `main` with:

- Require a pull request before merging (1 approval).
- Require status checks: **quality**, **e2e**, **Analyze JavaScript/TypeScript**,
  **Review dependency changes**, **Lighthouse audit**.
- Require branches to be up to date before merging.
- Require conversation resolution.
- Dismiss stale approvals on new commits.
- Block force pushes and deletion.
- Require signed commits if the organisation mandates it.

Without these settings the workflows still run, but nothing prevents a direct
push to `main`.

---

## 5. Deployment

### GitHub Pages (default)

1. Repository → Settings → Pages → Source: **GitHub Actions**.
2. Push to `main` or run **Deploy to GitHub Pages** manually.
3. `deploy-pages.yml` builds with `VITE_BASE=/<repository-name>/`.
4. The deploy job publishes the `dist` artifact; `public/.nojekyll` keeps
   Vite's asset folders intact.

Expected URL: `https://<owner>.github.io/<repository-name>/`.

### Custom domain / root path

Set `VITE_BASE=/` for the build (or omit it) and configure the domain in Pages.
`public/_headers` is ignored by GitHub Pages; use Netlify or Cloudflare Pages if
you need HSTS, `X-Frame-Options` or `Permissions-Policy` as response headers.

### Other static hosts

Upload `dist/` after `npm run build`. Honour:

- SPA fallback to `index.html` (or rely on the Workbox navigation fallback),
- `_headers` for security and immutable caching,
- HTTPS (required for service workers and clipboard APIs).

---

## 6. Release

```bash
npm run verify
npm run test:e2e
npm version minor        # bumps package.json + creates tag vX.Y.Z
git push --follow-tags
```

`release.yml` then:

1. installs with `npm ci` and re-runs lint/unit/build/budget checks,
2. zips `dist/` as `codesnap-dist.zip`,
3. generates `sbom.spdx.json` (SPDX JSON),
4. attests build provenance for the zip,
5. publishes a GitHub release with generated notes.

Pre-release tags (e.g. `v3.1.0-rc.1`) are marked as prereleases automatically.

**Post-release checks**

- Download the zip and open `index.html` through a static server; verify the app
  boots and the manifest resolves.
- Confirm the Pages deployment points at the same commit.
- Confirm the SBOM and attestation are attached.

---

## 7. Rollback

### Bad application deploy (Pages)

1. Revert the offending commit on `main` (do not force-push).
2. Let `deploy-pages.yml` rebuild and deploy.
3. If the revert is not immediate, re-run the last known-good workflow run from
   the Actions tab — it redeploys its original artifact.

### Bad release tag

1. Delete the GitHub release and tag (`git push --delete origin vX.Y.Z`).
2. Revert the commit, tag again with the next patch version.
3. Never move a published tag; consumers may have pinned it.

### Service worker serving a stale or broken build

Symptoms: users see an old UI after a deploy, or a blank page after an update.

1. Confirm the new `sw.js` is served (Cache-Control: no-cache on hosts that
   support `_headers`).
2. Ask affected users to reload once; the update banner should appear when the
   new worker is waiting.
3. If a bad worker was shipped, deploy a fix immediately. Workbox's
   `cleanupOutdatedCaches` removes superseded precaches on activation.
4. Emergency escape hatch for a single user: DevTools → Application → Service
   Workers → Unregister, then hard reload.

### Broken share link

Share links are self-contained. If normalization rejects a payload, the app
falls back to saved state. There is no server-side link registry to repair.
Communicate that links are immutable snapshots.

---

## 8. Incident playbooks

### S1 — High/critical dependency advisory

1. Dependency Review blocks the PR that introduces it; Dependabot opens an update
   PR for existing pins.
2. Confirm exploitability in this app (is the vulnerable path bundled and
   reachable?).
3. Prefer a patched upgrade. If unavailable, remove the feature or pin a safe
   range with a documented exception.
4. If the advisory affects a shipped version, publish a patch release and note it
   in `CHANGELOG.md` and the release notes.

### S2 — CodeQL or Scorecard regression

1. Open the code-scanning alert and read the data flow, not just the rule name.
2. Reproduce with a minimal case in a branch if the path is unclear.
3. Fix the root cause; do not dismiss without a written rationale and owner.
4. Re-run the workflow on the fix commit before merging.

### S3 — Lighthouse score drop

1. Compare the uploaded report with the previous run; identify the regressing
   metric (LCP, CLS, TBT, a11y node).
2. Check for a new font subset, a new dependency, a layout shift from a late
   font/dialog, or an unlabelled control.
3. Fix or deliberately adjust the threshold in `lighthouserc.json` with a note in
   the PR. Budgets are contracts, not suggestions.

### S4 — Bundle budget failure

1. `npm run build && npm run size` locally; identify the bucket (JS, CSS,
   assets, total).
2. Common causes: a full font import instead of `latin-*.css`, a new heavy
   dependency, source maps counted as assets, or an unoptimised image.
3. Fix the cause. Raising a budget requires a written justification in the PR and
   a follow-up issue to recover the headroom.

### S5 — Export failures reported by users

1. Ask for browser/OS, snippet length, scale, format, and the exact toast text.
2. Reproduce with the same snippet; check the preview dimensions in the export
   dialog.
3. If dimensions exceed 40 MP, the guard is working — advise a lower scale or
   padding.
4. If the image is blank but the download succeeds, suspect fonts not loaded or
   an unsupported CSS feature (modern colour function, filter). Reduce to a
   minimal snippet and compare with `npm run preview`.
5. Add a regression test before fixing.

### S6 — Hosting outage

The app is static and installable. Existing installations keep working offline.
Status communication is the only action; there is no server to fail over.
If the outage is prolonged, publish the release zip as an alternative download.

---

## 9. Monitoring and observability

| Signal            | Where                                             |
| ----------------- | ------------------------------------------------- |
| Build/test health | GitHub Actions                                    |
| Security alerts   | Code scanning, Dependabot, Scorecard              |
| Performance/a11y  | Lighthouse CI artifacts (`lhci_reports/`)         |
| Runtime errors    | Browser console only (`[codesnap]` prefix)        |
| Core Web Vitals   | Opt-in beacon if `VITE_ANALYTICS_ENDPOINT` is set |
| Availability      | GitHub Pages status / external uptime check       |

There is no server-side logging. Do not add analytics that capture code, share
fragments, clipboard contents, or identifiers.

**Recommended external check:** a 5-minute HTTP monitor on the Pages URL
asserting status 200 and the presence of the app title. Alert to the maintainer;
no auto-remediation.

---

## 10. Backup and recovery

| Asset             | Backup                                                    |
| ----------------- | --------------------------------------------------------- |
| Source code       | GitHub repository + local clones                          |
| Release artifacts | GitHub Releases (zip + SBOM, retained)                    |
| Build environment | `package-lock.json` + `.nvmrc` make rebuilds reproducible |
| User data         | None by design — snippets live only in the user's browser |

There is nothing to restore server-side. A total loss of CI/hosting is recovered
by rebuilding from the repository and re-pointing the host.

---

## 11. Cost and capacity

- Hosting: GitHub Pages free tier for public repositories.
- CI: GitHub-hosted minutes; the E2E job dominates (~3–6 minutes).
- No database, queue, CDN contract, or third-party API keys.
- Scaling is static-file scaling; there is no capacity planning beyond host
  limits.

---

## 12. Maintenance calendar

| Cadence     | Task                                                              |
| ----------- | ----------------------------------------------------------------- |
| Weekly      | Review Dependabot PRs, CodeQL and Scorecard alerts                |
| Monthly     | Run Lighthouse locally, review bundle report, prune unused fonts  |
| Quarterly   | Browser matrix review, accessibility spot-check, roadmap grooming |
| Per release | Changelog, SBOM, provenance, post-release smoke test              |
