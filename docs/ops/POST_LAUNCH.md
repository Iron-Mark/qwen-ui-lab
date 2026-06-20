# Post-Launch Guide (Demo Operators)

Use this checklist after the public demo is live. The product stays **offline-analysis-first**: no API key or live Qwen flag is required for presentations.

## Demo defaults (do not change for meetups)

| Concern | Default | Why |
|--------|---------|-----|
| Analysis | `QWEN_LIVE_ANALYSIS` unset | Instant offline demo; no API spend |
| Analytics | all `NEXT_PUBLIC_*` observability flags unset | No client telemetry |
| Experiments | `NEXT_PUBLIC_EXPERIMENTS_ENABLED` unset | UI stays on `control` |
| CSP enforce | Stage A–C via `src/proxy.ts` (HTTPS `connect-src`, `upgrade-insecure-requests`, script nonce + `strict-dynamic` without `unsafe-inline`/`unsafe-eval` in prod; style still allows `unsafe-inline`) | Avoid breaking Next/Tailwind runtime |
| CSP report-only | on in production (`CSP_REPORT_ONLY` unset or `true`) | Collect violations without blocking users |

See **[DEMO.md](../DEMO.md)** for the live click path and **[docs/ops/PRODUCTION_DEPLOY_LANE.md](./PRODUCTION_DEPLOY_LANE.md)** for deploy gates.

## Pre-demo verification (5 minutes)

```bash
npm run check:full
npm run test:e2e
npm run deploy:env:demo
npm run synthetic:health
```

Optional against production:

```bash
DEPLOY_URL=https://qwen-ui-lab.vercel.app npm run smoke:deploy
```

## When to turn things on (staging only)

- **Analytics funnel:** follow **[docs/ops/ANALYTICS_STAGING_ACTIVATION.md](./ANALYTICS_STAGING_ACTIVATION.md)** — set flags only in staging; never commit secrets.
- **A/B experiments:** follow **[docs/ops/EXPERIMENTATION.md](./EXPERIMENTATION.md)** — enable master flag, then one experiment at a time.
- **Live Qwen:** follow **[docs/ops/LIVE_QWEN_ROLLOUT.md](./LIVE_QWEN_ROLLOUT.md)** — `QWEN_LIVE_ANALYSIS=true` + `DASHSCOPE_API_KEY` (+ `QWEN_MODEL`, optional `QWEN_BASE_URL`); run `npm run deploy:env:live` before promoting.

## CSP report-only monitoring

Violations are **report-only** in production — they do not block the demo.

1. **Endpoint:** `POST /api/security/csp-report` → `204` (see `src/app/api/security/csp-report/route.ts`).
2. **Logs:** search host logs for `CSP report-only violation` (fields: `violatedDirective`, `blockedUri`, `documentUri`; IPs redact as needed).
3. **Rollout:** see **[docs/ops/CSP_HARDENING_GUIDE.md](./CSP_HARDENING_GUIDE.md)** — keep `CSP_REPORT_ONLY=false` off until violations are triaged; never tighten enforced policy during a demo window without a rehearsal build.

## Incident quick path

1. `GET /api/health` — expect `provider: "demo"` on the public demo.
2. **[docs/ops/TROUBLESHOOTING_RUNBOOK.md](./TROUBLESHOOTING_RUNBOOK.md)** — analyze/fallback issues.
3. **[docs/ops/ROLLBACK_CHECKLIST.md](./ROLLBACK_CHECKLIST.md)** — if the deployed build regresses.

## What's next (backlog, not required for demo)

- Scheduled synthetic health workflow (sketch in **[docs/ops/RELIABILITY_OPS.md](./RELIABILITY_OPS.md)**).
- Promote CSP report-only findings into enforced policy in stages (guide above).
- Optional perf checks before/after UI changes — see **[docs/ops/PERFORMANCE.md](./PERFORMANCE.md)** (`npm run analyze` for bundles; `npm run perf:lighthouse` for Lighthouse; artifacts under `.perf/`, gitignored).
- Release tagging per **[docs/ops/RELEASE_PROCESS.md](./RELEASE_PROCESS.md)** when cutting a versioned milestone.
