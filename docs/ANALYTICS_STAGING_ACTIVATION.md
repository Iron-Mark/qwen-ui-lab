# Analytics Staging Activation

This runbook activates analytics safely in staging while keeping production-safe privacy defaults.

**Demo / production default:** leave all observability and experiment env vars unset. The app ships with analytics and error monitoring disabled; demo-mode events are suppressed unless `NEXT_PUBLIC_OBSERVABILITY_ALLOW_DEMO_MODE=true` (avoid for public demo hosts). Copy flag names from `.env.example` — never commit real keys or tokens.

## 1) Activation Flags (staging only)

Set these environment variables in staging:

```bash
NEXT_PUBLIC_OBSERVABILITY_ENABLED=true
NEXT_PUBLIC_ANALYTICS_ENABLED=true
NEXT_PUBLIC_ERROR_MONITORING_ENABLED=true
NEXT_PUBLIC_OBSERVABILITY_ALLOW_DEMO_MODE=false
NEXT_PUBLIC_OBSERVABILITY_DEBUG=false
```

Notes:

- Telemetry stays disabled by default in local/dev unless these flags are explicitly set.
- Keep `NEXT_PUBLIC_OBSERVABILITY_ALLOW_DEMO_MODE=false` for launch-quality funnels. Turn on only for dedicated demo telemetry experiments.

## 2) QA Activation Checklist

1. Open `/` and `/design-system` in staging.
2. Complete one happy-path upload/analyze/generate flow and one forced fallback flow.
3. Trigger copy and export actions from both upload preview and design-system cards.
4. Verify that no event payload contains:
   - query strings in `route`
   - freeform text (`prompt`, `notes`, user-entered strings)
   - emails, API keys, raw request/response payloads
5. Confirm event names are from the taxonomy only:
   - `upload.*`, `analysis.*`, `generate.*`, `design_system.*`, `export.triggered`
6. Confirm demo-mode suppression:
   - with `NEXT_PUBLIC_OBSERVABILITY_ALLOW_DEMO_MODE=false`, demo provider mode does not emit events.

## 3) Dashboard Starter Views

Start with these slices in your analytics tool:

### A. Upload Funnel Health

- **Filter**: `eventName in [upload.selected, analysis.started, analysis.completed, generate.completed]`
- **Breakdown**: `route`, `providerState`, `status`
- **Use**: detect drop-offs from upload to generated preview.

### B. Fallback and Reliability Signals

- **Filter**: `eventName in [analysis.failed, analysis.completed]`
- **Breakdown**: `status`, `providerState`
- **Use**: monitor fallback rate and instant-demo usage.

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
  - upload, analyze, generate, or export flows
