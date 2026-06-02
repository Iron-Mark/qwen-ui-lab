# Release Notes Draft

## qwen-ui-lab v0.1.0

Release date: _TBD_

### Highlights

- Initial public baseline of `qwen-ui-lab` with Next.js App Router and TypeScript.
- Screenshot-to-UI workflow with offline demo mode by default and optional live Qwen analysis.
- Atomic design-system catalog with Laws of UX and UI Laws views.
- Health and analysis API routes for operational checks and image analysis flows.

### User-facing features

- Upload + analyze flow at `/` with generated preview and local session history.
- Design-system browsing and snippet export at `/design-system`.
- Domain views at `/design-system/laws-of-ux` and `/design-system/uilaws`.
- Theme-aware chart rendering and branded not-found UX.

### API and runtime behavior

- `GET /api/health` reports provider mode (`demo` or `qwen`) and live-analysis availability.
- `POST /api/analyze-ui` validates payloads and returns typed error codes for invalid input and upstream failures.
- Demo mode remains default unless both API key and live-analysis flag are enabled.

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
- CI workflow references in README should be treated as optional until workflow files exist in `.github/workflows`.

### Upgrade and compatibility notes

- No migration steps required for first tagged release.
- No breaking changes are expected for first public baseline.
