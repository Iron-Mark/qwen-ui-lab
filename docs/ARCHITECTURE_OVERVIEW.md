# Architecture Overview

This document summarizes the current `qwen-ui-lab` runtime design for contributors and handoff.

## System Intent

The app converts a UI screenshot into a scaffold plan and preview while keeping demo reliability high:

- Default behavior is instant offline demo.
- Live Qwen calls are explicit opt-in.
- UI flow still works end-to-end in both modes.

## High-Level Runtime

1. User uploads screenshot on `/`.
2. Client preprocesses image data.
3. Client checks provider status via `GET /api/health`.
4. Analyze path resolves to:
   - demo artifact (default), or
   - `POST /api/analyze-ui` for live Qwen.
5. Result artifact drives plan cards, generated scaffold, and stats preview.
6. Session is stored in localStorage for restore/replay.

## Routing Map

### App Routes

- `/` - main dashboard and screenshot-to-scaffold flow.
- `/design-system` - component catalog and UX law domains.
- `/design-system/uilaws` - redirect to `?domain=uilaws`.
- `/design-system/laws-of-ux` - redirect to `?domain=laws-of-ux`.
- fallback not-found page provides return links.

### API Routes

- `GET /api/health`
  - returns provider mode fields (`provider`, `hasApiKey`, `liveAnalysisEnabled`, model/baseUrl when live-enabled).
- `POST /api/analyze-ui`
  - validates request body and image metadata.
  - enforces file size guard (4 MB max).
  - delegates to server-side Qwen analysis module.

## Mode and Provider Control

Provider logic lives in `src/lib/qwen-analyze.mjs`.

- `isLiveQwenAnalysisEnabled()` checks `QWEN_LIVE_ANALYSIS` or `USE_LIVE_QWEN`.
- `canUseLiveQwen()` requires both key + explicit live toggle.
- if live is not enabled, analysis returns deterministic demo artifact.

This ensures demos and CI do not accidentally consume external API credits.

## Main Code Boundaries

- `src/app`
  - route entries, metadata, API handlers.
- `src/components`
  - UI tiers (`ui`, `atoms`, `molecules`, `organisms`) and provider wrappers.
- `src/lib`
  - provider-mode logic, analyze orchestration, preprocess, env validation, session helpers.
- `src/data`
  - dashboard and catalog data backing previews.
- `tests` + `e2e`
  - unit and end-to-end confidence checks.

## Reliability and Fallback

- Client flow handles errors by resolving to local demo artifacts when analyze calls fail.
- API route converts parse/network/provider failures into structured error responses.
- `instrumentation.ts` invokes env validation on boot (dev-focused warnings).
- `npm run doctor` gives quick local diagnostics plus optional live ping.

## Offline-Safe E2E Strategy

Playwright is configured to avoid live provider dependency:

- web server env removes Qwen-related variables.
- e2e helpers mock analyze and health endpoints.

This keeps test runs deterministic in local and CI contexts.

## Related Docs

- `README.md` - product-level overview and setup.
- `CONTRIBUTING.md` - contributor workflow and expectations.
- `docs/TROUBLESHOOTING_RUNBOOK.md` - incident-style diagnosis and fixes.
- `docs/RELIABILITY_OPS.md` - synthetic checks, thresholds, and response targets.
- `docs/ATOMIC_DESIGN.md` - component-tier conventions.
