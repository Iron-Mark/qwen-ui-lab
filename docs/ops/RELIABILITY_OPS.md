# Reliability and Ops Lane

This playbook defines synthetic checks, health-monitoring thresholds, and incident response guidance for `qwen-ui-lab`.

It extends existing behavior built around `GET /api/health` and complements `docs/ops/TROUBLESHOOTING_RUNBOOK.md`.

## Operational Baseline

- Health source of truth: `GET /api/health`
- CSP report-only sink: `POST /api/security/csp-report` (production report-only header; see `docs/ops/CSP_HARDENING_GUIDE.md` for log monitoring — violations are warn-level, not user-facing errors)
- Expected healthy payload:
  - `ok: true`
  - `provider: "demo"` or `provider: "qwen"`
  - `liveAnalysisEnabled` reflects environment intent
- Local diagnostic helper: `npm run doctor`
- Synthetic checker: `npm run synthetic:health`

## Synthetic Check Implementation

The repository includes `scripts/synthetic-health-check.mjs` for repeatable probe checks.

### Local usage

```bash
npm run synthetic:health
```

### Staging/production usage

```bash
node scripts/synthetic-health-check.mjs \
  --base-url https://qwen-ui-lab.vercel.app \
  --attempts 5 \
  --warn-latency-ms 1000 \
  --max-latency-ms 2000
```

Optional mode assertion:

```bash
node scripts/synthetic-health-check.mjs \
  --base-url https://qwen-ui-lab.vercel.app \
  --expect-live false
```

## Monitoring and Alert Thresholds

Use these thresholds as the default incident policy:

- **Critical (page immediately)**
  - Synthetic success rate < 100% in a single run (any failed `/api/health` probe)
  - `p95_latency_ms > 2000`
  - `liveAnalysisEnabled` mismatches expected mode for the environment
- **Warning (create incident ticket + investigate within same business day)**
  - `p95_latency_ms > 1000` and `<= 2000`
  - Health endpoint remains healthy but mode flips unexpectedly between checks

## Scheduled Production Monitor

GitHub Actions runs [Production Reliability Monitor](../../.github/workflows/production-reliability.yml) daily at 07:30 UTC and on manual dispatch. It checks:

- `/api/health` with `scripts/synthetic-health-check.mjs`
- Deployed share/export behavior with `npm run smoke:share-live`

The workflow uses `vars.PRODUCTION_DEPLOY_URL` when present and otherwise falls back to `https://qwen-ui-lab.vercel.app`. On failure it uploads logs and opens or comments on a single GitHub issue titled `Production reliability monitor failure`. The issue body includes only the target URL, expected mode, workflow run URL, workflow name, and commit SHA.

## Incident Response Targets

- **Acknowledge (critical):** within 10 minutes
- **Mitigation start (critical):** within 15 minutes
- **Target mitigation completion (critical):** within 60 minutes
- **Warning triage target:** within 4 business hours

## Runbook Integration

When an alert fires:

1. Run synthetic probe manually against the affected environment.
2. Capture `/api/health` payload and latency summary.
3. Follow `docs/ops/TROUBLESHOOTING_RUNBOOK.md`:
   - "Incident: Analyze is not using live Qwen"
   - "Incident: Analyze call fails or falls back unexpectedly"
   - "Handoff Notes"
4. If mitigation requires rollback, use `docs/ops/ROLLBACK_CHECKLIST.md`.
5. Record root cause and threshold adjustments in release notes.

## Concrete Integration Ideas

### 1) Post-deploy gate

During deployment, run:

```bash
node scripts/synthetic-health-check.mjs --base-url <deployed-url> --attempts 5
```

Do not declare deployment healthy until this check passes.

### 2) External uptime service

Use any uptime monitor to probe `/api/health` every 1-5 minutes. Keep it lightweight and pair it with this repository's synthetic script for deeper triage details.
