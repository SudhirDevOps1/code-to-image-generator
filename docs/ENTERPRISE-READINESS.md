# Enterprise readiness

This is a candid assessment, not a certification claim. CodeSnap is a static,
open-source, client-side tool. It can satisfy many engineering controls by
construction, but it is not a SaaS platform and does not perform regulated
processing.

**Assessment date:** 2026-11-06 · **Version:** 3.0.0

---

## 1. Maturity model used

| Level | Meaning                                                    |
| ----- | ---------------------------------------------------------- |
| L1    | Ad hoc — depends on individual memory                      |
| L2    | Defined — documented, manually followed                    |
| L3    | Automated — enforced by tooling on every change            |
| L4    | Measured — trends, budgets and alerts drive decisions      |
| L5    | Optimised — continuously improved with evidence and review |

---

## 2. Scorecard

| Area                  | Level | Evidence                                                                 | Main gap                                         |
| --------------------- | :---: | ------------------------------------------------------------------------ | ------------------------------------------------ |
| Source control        |  L3   | Git, conventional commits, PR workflow, Dependabot                       | Branch protection is repository config, not code |
| Build reproducibility |  L3   | `npm ci`, lockfile, `.nvmrc`, Node 22 in CI, deterministic Vite build    | No build provenance for PR artifacts             |
| Change management     |  L3   | CI gates on every PR, required checks documented, CODEOWNERS present     | Branch protection is repository config, not code |
| Test automation       |  L3   | 35 unit tests, 14 E2E journeys, coverage and JUnit artifacts             | No visual regression, no Firefox/WebKit          |
| Static analysis       |  L3   | ESLint, Stylelint, html-validate, CodeQL security-and-quality            | No TypeScript or formal types                    |
| Supply chain          |  L3   | Lockfile, Dependency Review, Dependabot, SBOM, provenance, Scorecard     | Actions pinned by major tag, not commit SHA      |
| Security architecture |  L3   | Strict CSP, allow-list input, no runtime network, no backend             | Headers limited on GitHub Pages                  |
| Secrets management    |  L3   | No secrets in the app; workflows use `GITHUB_TOKEN` with least privilege | Release signing keys not applicable yet          |
| Privacy               |  L4   | No accounts, no analytics by default, no upload, local-only state        | Share links are visible to URL holders           |
| Accessibility         |  L2   | Labels, dialogs, focus styles, reduced motion, Lighthouse ≥0.95          | No WCAG 2.2 AA audit or axe gate                 |
| Performance           |  L3   | 21 KB initial JS, lazy export/grammars, budgets, Lighthouse thresholds   | No field RUM data                                |
| Observability         |  L2   | Actions logs, Lighthouse artifacts, local error hooks                    | No alerting; no server telemetry by design       |
| Incident response     |  L2   | Runbook in `OPERATIONS.md`, security policy with SLAs                    | No game-day exercise or on-call rotation         |
| Release management    |  L3   | Tag-driven release, SBOM, attestation, rollback procedure                | No staged/canary environment                     |
| Documentation         |  L3   | README, analysis, architecture, roadmap, operations, security, changelog | No ADR log yet                                   |
| Internationalisation  |  L1   | English-only, UTF-8, lang attribute                                      | No locale catalogs or RTL strategy               |
| Vendor management     |  L3   | Runtime vendors: none; build vendors documented in the lockfile          | No formal vendor risk register                   |

**Overall:** L3 for engineering delivery, L2 for assurance activities that need
human process. The product is suitable for internal adoption and public hosting;
it is not positioned as a regulated data processor.

---

## 3. Control mapping (informative)

Mapped to common SOC 2 / ISO 27001 themes for procurement conversations. This
table is explanatory only and does not constitute an audit opinion.

| Theme                    | Control expectation                             | How CodeSnap addresses it                                               |
| ------------------------ | ----------------------------------------------- | ----------------------------------------------------------------------- |
| Change management        | Changes reviewed and tested before production   | PR + required CI + branch protection + tag-driven release               |
| Segregation of duties    | Author cannot unilaterally ship unreviewed code | Branch protection / required approvals (admin-configured)               |
| Vulnerability management | Known vulnerabilities detected and remediated   | Dependabot, Dependency Review, CodeQL, Scorecard, documented SLA        |
| Secure SDLC              | Security requirements embedded in the lifecycle | Threat model in `SECURITY.md`, input allow-lists, CSP, security tests   |
| Logical access           | Least privilege                                 | Static site, no accounts; workflow `permissions:` minimised             |
| Data protection          | No unnecessary collection                       | No backend, no cookies, no analytics by default, no PII                 |
| Availability             | Recovery from failure                           | Static hosting, offline PWA, release artifacts, documented rollback     |
| Monitoring               | Detect operational issues                       | Actions, code scanning, Lighthouse, external uptime check (recommended) |
| Incident response        | Documented response and communication           | `SECURITY.md` SLAs, `OPERATIONS.md` playbooks                           |
| Configuration management | Environment defined as code                     | `package.json`, lockfile, `.nvmrc`, Vite/Tailwind/ESLint configs        |
| Asset inventory          | Know what is deployed                           | Lockfile + SPDX SBOM per release                                        |
| Supplier management      | Assess third parties                            | Zero runtime suppliers; build dependencies reviewed via PRs             |
| Business continuity      | Rebuild from source                             | Reproducible build, release zip, no server state                        |

---

## 4. Gap register

| ID   | Gap                                | Risk                                 | Priority | Proposed action                                              | Target    |
| ---- | ---------------------------------- | ------------------------------------ | :------: | ------------------------------------------------------------ | --------- |
| G-01 | Branch protection is not versioned | Review rules drift between forks     |    P2    | Document required checks in `OPERATIONS.md`; audit quarterly | 90 days   |
| G-02 | No visual regression suite         | Theme/export regressions reach users |    P1    | Add Playwright screenshot baselines (roadmap 1.3)            | 60 days   |
| G-03 | No WCAG 2.2 AA audit               | Accessibility claims are unverified  |    P1    | Axe gate + manual keyboard/zoom audit (roadmap 1.2)          | 60 days   |
| G-04 | Chromium-only E2E                  | Firefox/WebKit breakage is invisible |    P2    | Extend Playwright projects (roadmap 1.1)                     | 90 days   |
| G-05 | Actions pinned by major tag        | Mutable tag supply-chain risk        |    P2    | Pin third-party actions to commit SHAs, Dependabot updates   | 90 days   |
| G-06 | No ADR log                         | Decisions lose their rationale       |    P2    | Add `docs/adr/` with the initial five decisions              | 90 days   |
| G-07 | No external uptime alert           | Outage detected by users             |    P2    | Add a 5-minute HTTP check with maintainer alert              | 90 days   |
| G-08 | No i18n catalogs                   | Hindi/Hinglish audience unserved     |    P3    | Extract strings, add `en`/`hi` (roadmap 1.5)                 | 180 days  |
| G-09 | No incident exercise               | Runbook is untested                  |    P3    | Quarterly tabletop: bad deploy + SW rollback                 | 180 days  |
| G-10 | No commit signing policy           | Provenance depends on platform       |    P3    | Require signed commits if organisational policy demands it   | As needed |

---

## 5. Adoption checklist (for an organisation)

### Repository

- [ ] Fork or mirror into the organisation; keep the license and attribution.
- [ ] Enable branch protection and the required checks from `OPERATIONS.md`.
- [ ] Add `CODEOWNERS` for `src/`, `.github/`, `docs/` and security-sensitive files.
- [ ] Restrict who can push tags and publish releases.
- [ ] Enable secret scanning and push protection.
- [ ] Confirm Dependabot alerts and code scanning are enabled.

### Build and release

- [ ] Pin the Node version used by the organisation (`.nvmrc`).
- [ ] Mirror npm dependencies if the network is restricted; keep the lockfile.
- [ ] Retain release artifacts and SBOMs per the organisation's retention policy.
- [ ] Ingest `sbom.spdx.json` into the dependency inventory.
- [ ] Decide whether to verify build provenance in the deployment pipeline.

### Hosting

- [ ] Choose GitHub Pages (simple) or a host that supports `_headers` (stronger).
- [ ] Confirm HTTPS and HSTS.
- [ ] Verify the CSP is present in the served document.
- [ ] Add an uptime check and an owner for alerts.
- [ ] Document the rollback path and who can execute it.

### Security and privacy review

- [ ] Confirm no snippet, share fragment or clipboard content leaves the browser.
- [ ] Confirm the telemetry endpoint is unset, or review the payload and retention.
- [ ] Assess share links against the organisation's data classification.
- [ ] Review third-party licenses in the SBOM.
- [ ] Record the tool in the internal software inventory.

### Operations

- [ ] Assign an owner and a backup.
- [ ] Schedule monthly dependency and quarterly access/roadmap reviews.
- [ ] Run one rollback exercise before the first production depend.
- [ ] Publish an internal support channel and expected response time.

---

## 6. Ownership model (suggested)

| Role             | Responsibility                                            |
| ---------------- | --------------------------------------------------------- |
| Maintainer       | Architecture, releases, security triage                   |
| Reviewer         | PR quality, accessibility, tests                          |
| Release manager  | Versioning, changelog, post-release verification          |
| Security contact | Advisories, dependency exceptions, incident communication |
| Platform owner   | Hosting, headers, uptime monitoring, access control       |

A single person may hold several roles in a small team, but the release and
review roles should not be the same person for production changes.

---

## 7. What would move this to L4

1. Visual regression and cross-browser results tracked over time, not just pass/fail.
2. Accessibility conformance evidence (axe + manual audit) attached to releases.
3. A dependency and vulnerability trend dashboard with mean-time-to-remediate.
4. Field performance data (opt-in, aggregate) with budgets tied to real users.
5. Exercised incident playbooks with recorded outcomes.
6. CODEOWNERS and signed commits enforced by repository policy.
7. A decision log (ADRs) that explains why the architecture is what it is.

None of these require a backend. They require sustained process, which is the
honest boundary between "enterprise-grade repository" and "enterprise-certified
service".
