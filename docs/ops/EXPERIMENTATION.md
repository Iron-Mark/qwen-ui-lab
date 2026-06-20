# Experimentation Lane

This project includes lightweight A/B experiment scaffolding designed to be safe by default:

- All experiments are disabled unless explicitly enabled.
- Disabled experiments always resolve to `control`.
- Variant assignment is deterministic from a stable subject key.
- No network calls are required for assignment.

## Current experiment points

- `headerDesignSystemCta`: toggles a small `Labs` badge in the Header's Design system CTA.
- `uploadFlowHeadline`: tests upload-flow hero headline + supporting copy for stronger first-value framing.
- `uploadFlowAnalyzeCta`: tests Analyze button label (`Analyze` vs `Analyze now`).
- `uploadFlowSamplePathHint`: toggles a short helper hint near the sample screenshot button to simplify first-run path.

This point is intentionally non-invasive and low risk.

> Current implementation uses `"anonymous"` as the subject key in `Header`, which keeps behavior deterministic and safe for scaffolding. For real rollouts, replace it with a durable per-user or per-session identifier from your auth/session layer.

## Env flags

```bash
# master switch (default false)
NEXT_PUBLIC_EXPERIMENTS_ENABLED=true

# per-experiment switch (default false)
NEXT_PUBLIC_EXP_HEADER_DESIGN_SYSTEM_CTA=true
NEXT_PUBLIC_EXP_UPLOAD_FLOW_HEADLINE=true
NEXT_PUBLIC_EXP_UPLOAD_FLOW_ANALYZE_CTA=true
NEXT_PUBLIC_EXP_UPLOAD_FLOW_SAMPLE_PATH_HINT=true
```

## Safe rollout checklist

1. Keep both flags unset in local, preview, and production to preserve baseline behavior.
2. Enable only `NEXT_PUBLIC_EXPERIMENTS_ENABLED=true` first and verify nothing changes.
3. Enable one experiment-specific flag at a time.
4. Validate both control/treatment UI paths manually.
5. Keep experiment UI changes cosmetic or additive unless deeper validation is planned.
6. Remove stale experiments promptly after decisions.

## Implementation reference

- Runtime assignment logic: `src/lib/experiments.mjs`
- Type-safe app wrapper: `src/lib/experiments.ts`
- UI integration example: `src/features/shell/components/Header.tsx`
- Coverage: `tests/experiments.test.mjs`

## Local verification

```bash
npm test
npm run lint
npm run build
```
