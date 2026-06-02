# Reliability and Ops Lane

This playbook defines synthetic checks, health-monitoring thresholds, and incident response guidance for `qwen-ui-lab`.

It extends existing behavior built around `GET /api/health` and complements `docs/TROUBLESHOOTING_RUNBOOK.md`.

## Operational Baseline

- Health source of truth: `GET /api/health`
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

## Incident Response Targets

- **Acknowledge (critical):** within 10 minutes
- **Mitigation start (critical):** within 15 minutes
- **Target mitigation completion (critical):** within 60 minutes
- **Warning triage target:** within 4 business hours

## Runbook Integration

When an alert fires:

1. Run synthetic probe manually against the affected environment.
2. Capture `/api/health` payload and latency summary.
3. Follow `docs/TROUBLESHOOTING_RUNBOOK.md`:
   - "Incident: Analyze is not using live Qwen"
   - "Incident: Analyze call fails or falls back unexpectedly"
   - "Handoff Notes"
4. If mitigation requires rollback, use `docs/ROLLBACK_CHECKLIST.md`.
5. Record root cause and threshold adjustments in release notes.

## Concrete Integration Ideas

### 1) Scheduled CI synthetic check

Add a scheduled GitHub Action that runs `npm run synthetic:health` against production and fails loudly on threshold breaches.

Example sketch:

```yaml
name: synthetic-health
on:
  schedule:
    - cron: "*/15 * * * *"
  workflow_dispatch:
jobs:
  probe:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: node scripts/synthetic-health-check.mjs --base-url "${{ secrets.SYNTHETIC_BASE_URL }}"
```

### 2) Post-deploy gate

During deployment, run:

```bash
node scripts/synthetic-health-check.mjs --base-url <deployed-url> --attempts 5
```

Do not declare deployment healthy until this check passes.

### 3) External uptime service

Use any uptime monitor to probe `/api/health` every 1-5 minutes. Keep it lightweight and pair it with this repository's synthetic script for deeper triage details.
