# Troubleshooting and Runbook

Operational runbook for local development, demo prep, and common incidents.

For alert thresholds, synthetic-check usage, and response-time targets, see `docs/ops/RELIABILITY_OPS.md`.

## Fast Triage Checklist

1. Confirm Node dependencies installed:
   - `npm install`
2. Run baseline checks:
   - `npm run doctor`
   - `npm test`
   - `npm run lint`
3. Validate app surfaces manually:
   - `/`
   - `/design-system`
   - unknown route for not-found behavior
4. Confirm current mode:
   - `GET /api/health` should report `provider: "demo"` unless live toggle is enabled.

## Incident: Analyze is not using live Qwen

### Symptoms

- Badge or banner indicates demo/offline mode.
- Analyze completes instantly with fallback messaging.
- `/api/health` returns `liveAnalysisEnabled: false`.

### Likely Causes

- `QWEN_LIVE_ANALYSIS` (or `USE_LIVE_QWEN`) not enabled.
- `DASHSCOPE_API_KEY` missing in server environment.
- local env file not loaded as expected.

### Actions

1. Set in `.env.local`:

```bash
DASHSCOPE_API_KEY=<your-key>
QWEN_LIVE_ANALYSIS=true
QWEN_MODEL=qwen3-vl-plus
QWEN_BASE_URL=https://dashscope-intl.aliyuncs.com/compatible-mode/v1
```

2. Restart dev server.
3. Re-check `GET /api/health`.
4. Run `npm run doctor` and confirm live checks.

## Incident: Analyze call fails or falls back unexpectedly

### Symptoms

- Error toast, then demo fallback artifact.
- Response from `/api/analyze-ui` with `qwen_network_error`, `qwen_request_failed`, or `invalid_qwen_json`.
- HTTP **429** with `rate_limit_exceeded` during live preview rehearsal (rapid Analyze clicks).

### Actions

1. Confirm internet access and API key validity.
2. Check `QWEN_BASE_URL` format (valid URL).
3. Confirm request payload limits:
   - image data URL present
   - image MIME type
   - file size <= 4 MB (larger files are rejected in the browser before analysis starts)
4. Retry with a smaller image to avoid payload pressure.
5. Use demo mode for presentation continuity while investigating.
6. For **429 rate_limit_exceeded**: wait for `Retry-After` seconds or raise `ANALYZE_UI_RATE_LIMIT_MAX` on Preview only (see `docs/ops/LIVE_QWEN_ROLLOUT.md`). Demo mode is never rate-limited on this route.

## Incident: `npm run doctor` fails

### Actions

1. Read failed line item output first (deps/env/tests/ping).
2. If dependency check fails:
   - reinstall with `npm install`
3. If sample tests fail:
   - run `npm test` and inspect failing test file in `tests/`.
4. If API ping fails:
   - verify live mode variables and external connectivity.
5. If you do not need live provider now:
   - unset live toggles and continue in demo mode.

## Incident: E2E failures in CI/local

### Expected Behavior

- E2E should run offline-safe without live Qwen credentials.
- Playwright server env clears Qwen-related variables.
- Helper mocks intercept health and analyze endpoints.

### Actions

1. Run `npm run test:e2e` locally.
2. Confirm no local process is conflicting with the Playwright web server.
3. Verify helper mocks are active in `e2e/helpers/mock-analyze-api.ts`.
4. Ensure tests do not rely on external API timing.

## Incident: Sample screenshot does not load

### Symptoms

- "Could not load sample screenshot" toast.

### Actions

1. Verify static file exists:
   - `public/references/dashboard-reference.svg`
2. Refresh dev server and reload page.
3. Continue by uploading your own image to validate the flow.

## Incident: Session history confusion

### Symptoms

- unexpected old analysis cards in "Recent analyses".

### Actions

1. Use per-session delete buttons in UI.
2. If needed, clear site localStorage in browser dev tools.
3. Re-run a fresh analyze session.

## Incident: PWA/service worker confusion in development

### Notes

- Service worker behavior is production-oriented.
- If stale assets are suspected, run a clean production build check:
  - `npm run build`
  - `npm run start`

Then hard-refresh and inspect service worker state.

## Handoff Notes

When escalating or handing off, include:

- exact failing command and output snippet
- current mode (`demo` or `live`)
- `/api/health` response payload
- whether issue reproduces with sample screenshot and custom upload
- what was already tried from this runbook

## Monitoring-Triggered Incident Flow

Use this path when alerts are raised by `/api/health` synthetic checks:

1. Run `npm run synthetic:health` (or `node scripts/synthetic-health-check.mjs --base-url <env-url>`).
2. Compare observed `provider` and `liveAnalysisEnabled` to expected environment mode.
3. If failures or mode mismatch persist:
   - treat as **critical** and start mitigation immediately.
4. If probes pass but latency warning threshold is exceeded:
   - treat as **warning**, open an incident ticket, and investigate the same day.
5. Record findings and attach the synthetic output summary to the incident notes.
