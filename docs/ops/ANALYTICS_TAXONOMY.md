# Analytics Taxonomy

This project uses a privacy-safe analytics layer built on top of the observability hooks.

By default, analytics is disabled. Nothing is emitted unless you explicitly turn on env flags.

## Setup (opt-in only)

Add these flags to `.env.local`:

```bash
# Master observability switch
NEXT_PUBLIC_OBSERVABILITY_ENABLED=true

# Enable analytics events
NEXT_PUBLIC_ANALYTICS_ENABLED=true

# Optional: keep local-analysis telemetry off unless intentionally needed
NEXT_PUBLIC_OBSERVABILITY_ALLOW_LOCAL_ANALYSIS=false

# Optional debug logs in browser console
NEXT_PUBLIC_OBSERVABILITY_DEBUG=false
```

For a staging activation checklist and dashboard setup, see `docs/ops/ANALYTICS_STAGING_ACTIVATION.md`.

## Privacy Guardrails

- Event names are constrained to predefined constants in `src/lib/analytics.ts`.
- Metadata is allowlisted in `src/lib/observability.mjs`; unknown keys are dropped.
- Query strings are stripped from routes.
- Sensitive values like freeform text, prompts, emails, and API payloads are not tracked.
- Local-analysis mode remains excluded unless `NEXT_PUBLIC_OBSERVABILITY_ALLOW_LOCAL_ANALYSIS=true`.

## Event Taxonomy

### Home hero (`/`)

- `home.hero_viewed` - marketing hero rendered (once per mount).
- `home.hero_cta_clicked` - primary or secondary hero CTA clicked (`feature`: `try_live_flow` | `explore_design_system`).

### Upload + Analyze Funnel (`/`)

- `upload.selected` - user selected a valid image.
- `upload.rejected` - invalid file type, empty file, or oversized file was rejected before analysis.
- `upload.sample_loaded` - sample run was loaded.
- `analysis.started` - analyze request flow started.
- `analysis.completed` - analyze finished (Qwen or local-analysis path).
- `analysis.failed` - analyze failed and fallback path was used.
- `generate.started` - preview preparation started.
- `generate.completed` - starter preview is ready.
- `export.triggered` - copy/export action on starter scaffold.

### Design System (`/design-system`)

- `design_system.viewed` - design-system page viewed.
- `design_system.domain_changed` - domain tab changed.
- `design_system.level_changed` - atomic level filter changed.
- `design_system.search_updated` - search value updated (tracked on input blur).
- `design_system.variant_changed` - component variant toggled.
- `export.triggered` - snippet/catalog export interactions.

## Allowlisted Metadata Keys

Only these keys are accepted:

- `source`
- `providerState`
- `fileType`
- `fileSize`
- `route`
- `status`
- `durationMs`
- `step`
- `result`
- `trigger`
- `feature`
- `domain`
- `level`
- `entryId`
- `sampleId`
- `queryLength`
- `totalVisible`

## Consistency Conventions

- Keep telemetry disabled by default. Only enable in environments that intentionally opt in.
- Use `status` values from this set: `started`, `completed`, `accepted`, `rejected`, `changed`, `selected`, `view`, `success`, `failed`, `fallback`, `sample_run`, `updated`, `downloaded`.
- Use `trigger` for explicit user actions (`copy`, `export`) and `step` for funnel stage (`upload`, `analyze`, `generate`).
- Route metadata must be path-only (query strings are stripped before dispatch).

## Key Files

- `src/lib/analytics.ts` - event constants and client abstraction.
- `src/lib/observability.mjs` - env gating + sanitization + dispatch hooks.
- `src/features/analysis/components/UploadFlow.tsx` - funnel instrumentation.
- `src/features/design-system/components/DesignSystemPreview.tsx` - design-system instrumentation.
- `src/features/design-system/components/ComponentPreviewCard.tsx` - variant and snippet interaction instrumentation.
- `src/features/export/components/ExportButton.tsx` - centralized copy/export event tracking.
