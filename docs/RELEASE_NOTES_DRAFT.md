# Release Notes Draft

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

### Verification snapshot

Validated against current project scripts:

- `npm run build`
- `npm test`
- `npm run lint`
- `npm run test:e2e`
- `npm run doctor`

### Known operational notes

- `.env.local` contains local secrets and must not be bundled into release artifacts.
- Live Qwen usage depends on external quota/network health; demo mode remains the fallback path.
- CI workflows are present under `.github/workflows`; release notes and README references should point to existing files only.

### Upgrade and compatibility notes

- No migration steps required for first tagged release.
- No breaking changes are expected for first public baseline.
