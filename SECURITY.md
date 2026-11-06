# Security policy

## Supported versions

| Version | Supported              |
| ------- | ---------------------- |
| 3.x     | ✅                     |
| 2.x     | ⚠️ critical fixes only |
| < 2.0   | ❌                     |

## Reporting a vulnerability

Please **do not** open a public issue. Report privately via
[GitHub Security Advisories](https://github.com/SudhirDevOps1/code-to-image-generator/security/advisories/new)
or email **sudhirdevops1@gmail.com** with:

- affected version / commit,
- reproduction steps or a proof of concept,
- impact assessment,
- any suggested remediation.

You will receive an acknowledgement within **48 hours** and a remediation plan
within **7 days**. We aim to ship a fix within **30 days** for confirmed issues.
Credit is given in the release notes unless you prefer to stay anonymous.

## Threat model

CodeSnap is a fully static, client-side application. There is **no backend, no
account system, no analytics by default, and no upload endpoint**. The relevant
assets are the user's browser, the deployed static bundle, and the dependencies
that end up in that bundle.

| Threat                                                    | Control                                                                                                                                  |
| --------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Stored XSS through a snippet, share link, or localStorage | Untrusted input is rendered with `textContent` / Prism's escaping tokenizer; state is normalised and bounded                             |
| Malicious share link                                      | `#s=` payloads are decompressed, parsed and passed through `normalizeState` with enum/colour/length allow-lists                          |
| Supply-chain compromise                                   | Dependencies are pinned by lockfile, reviewed by Dependabot + Dependency Review, scanned by CodeQL and OpenSSF Scorecard; no runtime CDN |
| Third-party data leakage                                  | No external fonts, scripts, or images at runtime; CSP blocks non-self origins                                                            |
| Clickjacking / MIME sniffing                              | CSP `frame-ancestors`, `X-Frame-Options`, `X-Content-Type-Options` (host headers)                                                        |
| Prototype pollution via JSON state                        | Only an explicit allow-list of primitive fields is copied into state                                                                     |
| Denial of service via huge exports                        | Code length, canvas dimensions and share-link size are capped                                                                            |

## Security headers

`index.html` ships a restrictive CSP meta tag. Static hosts that support
`_headers` (Netlify, Cloudflare Pages) additionally apply HSTS, `X-Frame-Options`,
`Permissions-Policy`, and immutable asset caching. GitHub Pages cannot set custom
headers; the meta CSP remains effective there.

## Dependency policy

- Runtime dependencies are limited to `prismjs`, `html2canvas`, `lz-string`,
  `web-vitals` and self-hosted fonts.
- No dependency may introduce a runtime network request without review.
- High/critical advisories block merges through Dependency Review.
- GitHub Actions are version-tagged and updated weekly by Dependabot. Pinning
  third-party actions to commit SHAs is recommended for forks.

## Out of scope

- Issues requiring a compromised browser extension or compromised device.
- Attacks that require the user to paste and run code outside CodeSnap.
- Denial of service against GitHub Pages infrastructure.
