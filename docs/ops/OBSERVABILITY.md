# Observability (errors + analytics)

Client observability in `qwen-ui-lab` is **opt-in** and **quiet by default**. Nothing is sent to Sentry, a generic reporting URL, or analytics sinks until you set explicit `NEXT_PUBLIC_*` flags in the deployment environment.

Related docs:

- [ANALYTICS_TAXONOMY.md](./ANALYTICS_TAXONOMY.md) - event names and allowlisted metadata
- [ANALYTICS_STAGING_ACTIVATION.md](./ANALYTICS_STAGING_ACTIVATION.md) - staging rollout checklist
- [RELIABILITY_OPS.md](./RELIABILITY_OPS.md) - health probes and incident thresholds

## Default Behavior

When all observability env vars are **unset**:

- No Sentry initialization
- No outbound error beacons
- `captureError` / `trackEvent` are no-ops
- Local-analysis provider mode never emits telemetry unless `NEXT_PUBLIC_OBSERVABILITY_ALLOW_LOCAL_ANALYSIS=true`

## Activation flags

Master switch (required for anything observability-related):

```bash
NEXT_PUBLIC_OBSERVABILITY_ENABLED=true
```

Error monitoring (requires master + this flag):

```bash
NEXT_PUBLIC_ERROR_MONITORING_ENABLED=true
```

Analytics (separate sub-switch):

```bash
NEXT_PUBLIC_ANALYTICS_ENABLED=true
```

Optional sinks (only consulted when error monitoring is enabled):

```bash
NEXT_PUBLIC_SENTRY_DSN=https://examplePublicKey@o0.ingest.sentry.io/0
NEXT_PUBLIC_SENTRY_ENVIRONMENT=staging
NEXT_PUBLIC_ERROR_REPORTING_URL=https://your-collector.example/errors
```

Debug logging to the browser console:

```bash
NEXT_PUBLIC_OBSERVABILITY_DEBUG=true
```

Copy names from `.env.example` - never commit real DSNs, tokens, or collector secrets.

## What gets reported

### React error boundaries

`ObservabilityErrorBoundary` wraps high-risk previews (design-system catalog, dashboard charts). On render failure it calls `captureError` with `source: error_boundary` and the current pathname (query strings stripped).

### Analyze route failures

`UploadFlow` reports **unexpected** analyze outcomes via `src/features/analysis/lib/analyze-observability.mjs`:

| Outcome | Reported? |
| --- | --- |
| Live Qwen success (`providerState: qwen`) | No |
| Expected local analysis (sample run, missing key, live disabled) | No |
| Live call failed -> offline fallback | Yes |
| Client could not read the uploaded image | Yes |

Errors are sanitized in `src/lib/observability.mjs` (truncated message/stack, no query strings on routes).

### Global client errors

`ObservabilityProvider` listens for `window.error` and `unhandledrejection` when monitoring is enabled.

## Architecture

```text
ObservabilityProvider
  |-- createObservabilityConfig(env)
  |-- createClientErrorDispatch(config, env)  -> console / generic URL / Sentry
  `-- createMonitoringHooks({ config, dispatchError })

ObservabilityErrorBoundary -> captureError (error_boundary)
UploadFlow                 -> captureError (analyze_route) on reportable fallbacks
```

Implementation files:

- `src/lib/observability.mjs` - gating, sanitization, hooks
- `src/lib/error-reporting.mjs` - generic beacon (node-testable)
- `src/lib/error-reporting.client.ts` - lazy `@sentry/browser` init
- `src/features/analysis/lib/analyze-observability.mjs` - analyze failure classification
- `src/lib/analytics-event-buffer.mjs` - optional browser-local event ring buffer (staging QA)
- `/admin/analytics` - docs-only funnel reference by default; live buffer when observability + analytics flags are set (`noindex`)

## Staging verification

1. Set master + `NEXT_PUBLIC_ERROR_MONITORING_ENABLED=true` and your Sentry DSN (or generic URL).
2. Keep `NEXT_PUBLIC_OBSERVABILITY_ALLOW_LOCAL_ANALYSIS=false` on public hosts.
3. Force a live analyze failure and confirm one issue/beacon with `source: analyze_route`.
4. Confirm normal public traffic with unset flags produces **zero** outbound error traffic.

## Privacy notes

- Only allowlisted analytics keys are emitted (see taxonomy doc).
- Error payloads exclude user prompts, raw images, and API keys.
- Sentry `sendDefaultPii` is disabled; request URLs are stripped of query strings in `beforeSend`.
