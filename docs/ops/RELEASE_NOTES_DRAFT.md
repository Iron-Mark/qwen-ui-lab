# Release Notes Draft

## qwen-ui-lab v0.4.1

Release date: 2026-06-21

Patch release for upload safety and CI runtime reliability. This release keeps the public demo behavior unchanged while preventing oversized analysis uploads from reaching expensive client/server paths and moving GitHub Actions onto the Node 24 action/runtime line.

### Fixes and hardening

- Added shared upload constraints for PNG, JPEG, SVG, and WebP analysis inputs with a 4 MB cap.
- Reused the same validation rules in the upload UI and `POST /api/analyze-ui` request normalization.
- Added localized oversized-upload feedback before analysis starts.
- Extended PR E2E smoke coverage with upload-flow checks for normal and oversized uploads.
- Modernized GitHub Actions pins to Node 24-compatible action majors and added a regression test for workflow hygiene.
- Updated CI and ops docs so the documented PR smoke suite and Node runtime match the workflows.

### Verification snapshot

- PR #7 checks passed on GitHub:
  - `Lint, test, build`
  - `E2E smoke (mobile + a11y + live contract + upload)`
  - Vercel preview deployment and preview comments
- Local verification before merge:
  - `npm run check:full` - lint, 194 unit tests, and production build passed.
  - `npm run test:e2e:pr-smoke` - 11 Playwright smoke tests passed.
  - `git diff --check` - passed.
- Release-prep verification on `0.4.1`:
  - `npm run check:full` - lint, 194 unit tests, and production build passed.
  - `npm run test:e2e` - 55 Playwright tests passed.
  - `npm run doctor` - passed in offline demo mode.
  - `npm run deploy:env:demo` - passed.
  - `git diff --check` - passed.

### Versioning

- Package metadata: `0.4.1`
- Recommended tag: `v0.4.1`
- Release type: patch, because this is a backward-compatible fix/reliability release after `v0.4.0`.

## qwen-ui-lab v0.3.0

Release date: 2026-06-20

Minor release for richer no-provider image understanding. Unknown screenshot uploads now get deterministic structure and token hints from local pixels before any live AI provider is considered.

### Highlights

- Added Otsu-style luminance thresholding to separate likely foreground from dominant surfaces without fixed color assumptions.
- Grouped active layout cells into connected regions and labeled likely header/nav, side rail, bottom nav, content panel, media/chart, text/list, and control clusters.
- Added deterministic design-token recommendations for surface, foreground, accent, muted, border, spacing, and radius values.
- Expanded fallback artifacts with `Detected Structure` and `Design Tokens` plan cards.
- Updated preview stats for inspected unknown uploads to emphasize regions, controls, density, and contrast.
- Preserved demo-safe behavior: live Qwen analysis remains opt-in and provider failures still fall back to local analysis.

### Verification snapshot

- `npm audit --omit=dev --audit-level=high` - passed.
- `npm run check:full` - lint, 176 unit tests, and production build passed.
- `npm run test:e2e` - 54 Playwright tests passed.
- `npm run doctor` - passed; live Qwen env vars are intentionally unset for offline demo mode.
- `git diff --check` - passed.

### Versioning

- Package metadata: `0.3.0`
- Recommended tag: `v0.3.0`
- Release type: minor, because this adds a notable no-provider analysis capability while keeping routes and APIs backward compatible.

## qwen-ui-lab v0.2.1

Release date: 2026-06-20

Patch release that supersedes `v0.2.0` by fixing the post-merge production dependency audit gate.

### Fixes

- Added npm overrides for patched production transitive dependencies:
  - `hono@4.12.26`
  - `js-yaml@4.2.0`
- Kept the `v0.2.0` offline pixel-signal feature unchanged.
- Updated package metadata to `0.2.1`.

### Verification snapshot

- `npm audit --omit=dev --audit-level=high` - passed.
- `npm run check:full` - lint, unit tests, and production build passed.
- GitHub main CI should pass the Security dependency policy with the patched lockfile.

## qwen-ui-lab v0.2.0

Release date: 2026-06-20

Minor release for a stronger no-provider analysis path. The app still defaults to demo-safe mode, but unknown screenshot uploads now get local image signals instead of relying only on filename and dimensions.

### Highlights

- Added deterministic canvas pixel inspection for offline analysis: palette extraction, WCAG-style contrast estimates, edge density, coarse layout bands, and dense-cluster review risk.
- Enriched fallback artifacts for unknown uploads with `Local Vision Signals` and `Local Quality Checks` plan cards.
- Replaced generic preview stats for inspected unknown uploads with palette, contrast, density, and layout signal stats.
- Fed local pixel signals into archetype scoring so dashboard, mobile, landing, settings, and catalog guesses improve without AI providers.
- Preserved the live Qwen contract: live mode remains explicit opt-in, and provider failures still fall back to local analysis.

### Verification snapshot

- `npm run check:full` - lint, 176 unit tests, and production build passed.
- `npx tsc --noEmit` - passed.
- `npm run export:demo-fixtures` - regenerated fixtures; no content changes required.
- `npm run test:e2e:pr-smoke` - 9 Playwright smoke tests passed across mobile, a11y, and mocked live-provider flows.

### Versioning

- Package metadata: `0.2.0`
- Recommended tag: `v0.2.0`
- Release type: minor, because this adds a notable no-provider feature while keeping routes and APIs backward compatible.

## Maintenance checkpoint - 2026-06-10

This checkpoint keeps the public demo stable after branch consolidation. Production remains demo-safe by default: live Qwen analysis is still opt-in, and the public Vercel deployment currently reports `provider=demo`.

### Repository and CI cleanup

- Consolidated development work back onto `main`; stale branches and old work-in-progress stashes were cleared after review.
- Fixed the Node 20 CI unit-test failure by avoiding direct `.ts` imports from Node's native test runner.
- Made Playwright visual snapshots platform-aware (`win32` and `linux`) so local Windows baselines and Ubuntu CI baselines no longer conflict.
- Kept the production LCP probe in CI as telemetry, but made it warn-only by default because live production Lighthouse measurements spiked while local build audits and production smoke checks passed. Set repository variable `PERF_LCP_STRICT=true` to make that job blocking again.
- Cleared all current ESLint warnings without changing the public product flow.

### Runtime and QA notes

- Suppressed the known dev-mode nonce hydration warning on the theme bootstrap script. The nonce is still present for CSP; the browser masks nonce attributes during hydration, which caused the warning.
- Latest verified gates for this maintenance work:
  - `npm run lint`
  - `npm run check:full`
  - `E2E_PORT=3211 npm run test:e2e`
  - Focused `/demo` E2E check on `E2E_PORT=3212`
  - `DEPLOY_URL=https://qwen-ui-lab.vercel.app npm run smoke:deploy`

### Current production readiness

- Vercel deployment is Ready and aliased to `https://qwen-ui-lab.vercel.app`.
- Vercel CLI reports no project environment variables configured. That is acceptable for the public offline demo, but `npm run validate:prod` fails until production KV and server-side `GITHUB_TOKEN` are added.
- `npm run validate:prod:preview` passes with warnings that KV and Gist export fall back to in-memory/manual behavior.

## qwen-ui-lab v0.1.1

Release date: 2026-06-03

Patch release on `main` after `v0.1.0`. Demo-safe by default — **live Qwen analysis remains opt-in** (`QWEN_LIVE_ANALYSIS` unset for public demo).

### Highlights

- Demo tour reliability: synchronous Sonner mount so the offline snackbar fires in e2e and live demos.
- Upload flow polish: merged Analyze + Preview CTA, clearer disabled states, sample CTA hidden after first use.
- Home route LCP: dashboard shell in initial HTML; deferred non-critical client bundles (offline analyze unchanged).
- UX compliance: compact summary row opens a scrollable dialog with accordion law panels.
- Layout consistency: shared `PageContainer` gutters across header, footer, dashboard, design-system, and 404.
- Theme switcher shows brand primary swatches beside palette labels.
- Operator docs: `docs/ops/POST_LAUNCH.md` for post-launch demo-safe operations.

### Fixes since v0.1.0

- Design-system excess scroll whitespace; unified preview toolbar in `ComponentPreviewCard`.
- Mobile demo snackbar placement, timing, and once-per-session copy.
- Sticky headers and scroll-to-preview on design-system lab.

### UX, performance, and accessibility

- Accordion primitive for collapsible UX law references.
- E2E coverage for UX compliance dialog (open, law names, Escape close).
- Lighthouse perf tooling and CI budgets unchanged; demo deploy lane still `deploy:env:demo`.

### API and runtime behavior

- `GET /api/health` still reports `demo` unless `QWEN_LIVE_ANALYSIS=true` and API key are set.
- `POST /api/analyze-ui` unchanged; instant offline path when live analysis is disabled.
- **No live API enablement in this release** — production demo stays offline.

### Verification snapshot

Validated against current project scripts:

- `npm run build`
- `npm test`
- `npm run lint`
- `npm run test:e2e`
- `npm run doctor`

### Upgrade notes

- No migration steps from `v0.1.0`.
- No breaking route or API changes.
- Operators: keep `QWEN_LIVE_ANALYSIS` unset on the public demo; see `docs/ops/POST_LAUNCH.md`.

---

## qwen-ui-lab v0.1.0

Release date: 2026-06-03

### Highlights

- Initial public baseline of `qwen-ui-lab` with Next.js App Router and TypeScript.
- Screenshot-to-UI workflow with offline demo mode by default and optional live Qwen analysis.
- Atomic design-system catalog with Laws of UX and UI Laws views.
- Health, analysis, and CSP-report API routes for operations and security telemetry.

### UX, performance, and accessibility (v0.1.0)

- Upload-to-scaffold flow polish with refined preview card and device preview tabs.
- Sticky design-system preview panel and mobile scroll-to-preview behavior.
- Session-scoped demo snackbar for offline-tour guidance (no live API required).
- Snippet/code preview theming with tokenized shells, Prism syntax variables, and focus rings.
- Lighthouse perf tooling and CI performance budgets on home and design-system routes.
- Demo-safe deploy validation (`deploy:env:demo`); live analysis remains opt-in via `QWEN_LIVE_ANALYSIS`.

### User-facing features

- Upload + analyze flow at `/` with generated preview and local session history.
- Design-system browsing and snippet export at `/design-system`.
- Domain views at `/design-system/laws-of-ux` and `/design-system/uilaws`.
- Theme-aware chart rendering and branded not-found UX.

### API and runtime behavior

- `GET /api/health` reports provider mode (`demo` or `qwen`) and live-analysis availability.
- `POST /api/analyze-ui` validates payloads and returns typed error codes for invalid input and upstream failures.
- `POST /api/security/csp-report` accepts CSP report-only payloads and returns `204`.
- Demo mode remains default unless both API key and live-analysis flag are enabled.

### Release package summary

- **Runtime surface:** app routes (`/`, `/design-system`, domain redirects), API routes (`/api/health`, `/api/analyze-ui`, `/api/security/csp-report`), and production metadata routes (`robots.txt`, `sitemap.xml`).
- **Operational lane:** demo-safe deploy policy (`deploy:env:demo`), optional live gate (`deploy:env:live`), and post-deploy smoke script/workflow.
- **Quality gates:** lint, unit tests, build, dependency/secrets scanning, link/perf/assets audits in CI.
- **Docs bundle:** release/process/deploy/rollback/runbook docs aligned with current scripts and workflows.

### Known operational notes

- `.env.local` contains local secrets and must not be bundled into release artifacts.
- Live Qwen usage depends on external quota/network health; demo mode remains the fallback path.
- CI workflows are present under `.github/workflows`; release notes and README references should point to existing files only.
