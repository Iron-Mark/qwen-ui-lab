# Continuous Integration

GitHub Actions workflows under [`.github/workflows/`](../.github/workflows/) gate merges, main-branch quality, scheduled E2E, and post-deploy smoke.

## Workflow map

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| [pr-checks.yml](../.github/workflows/pr-checks.yml) | `pull_request`, `workflow_dispatch` | Fast PR gate: lint, unit tests, build (no E2E) |
| [ci.yml](../.github/workflows/ci.yml) | `push` to `main`/`master`, `workflow_dispatch` | Security scan, quality, web audits, visual regression, production LCP budget |
| [e2e-nightly.yml](../.github/workflows/e2e-nightly.yml) | Daily schedule (06:00 UTC), `workflow_dispatch` | Full `CI=1 npm run test:e2e` Playwright suite |
| [post-deploy-smoke.yml](../.github/workflows/post-deploy-smoke.yml) | `workflow_dispatch`, `repository_dispatch` | Route smoke against a deployed URL |

PR checks stay fast on purpose. Heavier browser work runs on main or on the nightly schedule.

## E2E nightly

**Workflow:** `e2e-nightly.yml`

Runs the complete Playwright suite with `CI=1` (production build + `next start`, offline mocks, one retry). On failure, `test-results/` artifacts are uploaded for 14 days.

Manual run: **Actions → E2E Nightly → Run workflow**.

Local equivalent:

```bash
CI=1 npm run test:e2e
```

## Visual regression gate

**Job:** `visual-regression` in `ci.yml` (main push only)

Runs `e2e/visual-regression.spec.ts` against a CI production server. Baselines live in `e2e/visual-regression.spec.ts-snapshots/`.

Refresh snapshots locally:

```bash
npx playwright test e2e/visual-regression.spec.ts --update-snapshots
```

On failure, GitHub uploads `test-results/` (expected, actual, and diff images) as `visual-regression-diffs-*` artifacts.

Local equivalent:

```bash
npm run test:e2e:visual
```

## Production LCP budget

**Job:** `perf-lcp-budget` in `ci.yml` (main push, **warn-only** initially)

Uses [`scripts/perf-lcp-budget.mjs`](../scripts/perf-lcp-budget.mjs) to run Lighthouse against the production origin. Default URL is `https://qwen-ui-lab.vercel.app`; override with repository variable `PRODUCTION_DEPLOY_URL` (same as post-deploy smoke).

| Setting | Default | Notes |
|---------|---------|-------|
| `PERF_MAX_LCP_MS` | `2500` | Fail threshold when strict mode is on |
| `PERF_LCP_STRICT` | `false` in CI | Warn and pass; flip to `true` to enforce |

Local examples:

```bash
# Warn-only (matches current CI)
npm run perf:lcp-budget

# Enforce budget
PERF_LCP_STRICT=1 npm run perf:lcp-budget
node scripts/perf-lcp-budget.mjs --strict --url https://qwen-ui-lab.vercel.app
```

Reports are written to `.perf/lighthouse-lcp-budget.json` (gitignored). CI uploads this file when present.

To promote warn-only to a hard gate, set `PERF_LCP_STRICT: "true"` on the **Check production LCP budget** step in `ci.yml`.

## Related scripts

| Script | Use |
|--------|-----|
| `npm run test:e2e` | Full Playwright suite |
| `npm run test:e2e:visual` | Visual regression spec only |
| `npm run perf:lcp-budget` | Production LCP check |
| `npm run perf:lighthouse` | Local build + Lighthouse (see [POST_LAUNCH.md](./POST_LAUNCH.md)) |

## See also

- [OFFLINE_DEMO_E2E.md](./OFFLINE_DEMO_E2E.md) — offline E2E strategy and snapshot workflow
- [PRODUCTION_DEPLOY_LANE.md](./PRODUCTION_DEPLOY_LANE.md) — deploy env gates and smoke hooks
- [RELIABILITY_OPS.md](./RELIABILITY_OPS.md) — synthetic health and ops playbooks
