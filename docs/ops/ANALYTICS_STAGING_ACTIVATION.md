# Analytics Staging Activation

This runbook activates analytics safely in staging while keeping production-safe privacy defaults.

**Local-analysis / production default:** leave all observability and experiment env vars unset. The app ships with analytics and error monitoring disabled; local-analysis events are suppressed unless `NEXT_PUBLIC_OBSERVABILITY_ALLOW_LOCAL_ANALYSIS=true` (avoid for public app hosts). Copy flag names from `.env.example` - never commit real keys or tokens. See [OBSERVABILITY.md](./OBSERVABILITY.md) for Sentry and generic error reporting.

## 1) Activation Flags (staging only)

Set these environment variables in staging:

```bash
NEXT_PUBLIC_OBSERVABILITY_ENABLED=true
NEXT_PUBLIC_ANALYTICS_ENABLED=true
NEXT_PUBLIC_ERROR_MONITORING_ENABLED=true
NEXT_PUBLIC_OBSERVABILITY_ALLOW_LOCAL_ANALYSIS=false
NEXT_PUBLIC_OBSERVABILITY_DEBUG=false
```

Notes:

- Telemetry stays disabled by default in local/dev unless these flags are explicitly set.
- Keep `NEXT_PUBLIC_OBSERVABILITY_ALLOW_LOCAL_ANALYSIS=false` for launch-quality funnels. Turn on only for dedicated local-analysis telemetry experiments.

## 2) QA Activation Checklist

1. Open `/admin/analytics` to confirm docs-only mode (default) or the live local buffer after flags are set.
2. Open `/` and `/design-system` in staging.
3. Complete one happy-path upload/analyze/preview flow and one forced live-error recovery flow.
4. Trigger copy and export actions from both upload preview and design-system cards.
5. Verify that no event payload contains:
   - query strings in `route`
   - freeform text (`prompt`, `notes`, user-entered strings)
   - emails, API keys, raw request/response payloads
6. Confirm event names are from the taxonomy only:
   - `upload.*`, `analysis.*`, `generate.*`, `design_system.*`, `export.triggered`
7. Confirm local-analysis suppression:
   - with `NEXT_PUBLIC_OBSERVABILITY_ALLOW_LOCAL_ANALYSIS=false`, local-analysis provider mode does not emit events.

## 3) Dashboard Starter Views

Start with these slices in your analytics tool:

### A. Upload Funnel Health

- **Filter**: `eventName in [upload.selected, analysis.started, analysis.completed, generate.completed]`
- **Breakdown**: `route`, `providerState`, `status`
- **Use**: detect drop-offs from upload to starter preview.

### B. Fallback and Reliability Signals

- **Filter**: `eventName in [analysis.failed, analysis.completed]`
- **Breakdown**: `status`, `providerState`
- **Use**: monitor fallback rate and sample-run usage.

### C. Export Intent vs Success

- **Filter**: `eventName = export.triggered`
- **Breakdown**: `trigger`, `feature`, `status`, `source`
- **Use**: compare copy vs export behavior and failure rates.

### D. Design System Discovery

- **Filter**: `eventName in [design_system.viewed, design_system.search_updated, design_system.domain_changed, design_system.level_changed, design_system.variant_changed]`
- **Breakdown**: `domain`, `level`, `entryId`, `queryLength`, `totalVisible`
- **Use**: understand catalog navigation and search friction.

### E. Route Coverage Sanity Check

- **Filter**: all analytics events
- **Breakdown**: `route`
- **Use**: ensure only expected route paths are present and no query-string leakage exists.

## 4) Suggested Staging QA Cadence

- Run this activation checklist at least once per release candidate.
- Re-run after any change to:
  - analytics event names
  - metadata schema/allowlist
  - provider-mode gating
  - upload, analyze, preview, or export flows
