# Continuous Integration

GitHub Actions workflows under [`.github/workflows/`](../../.github/workflows/) gate merges, main-branch quality, scheduled E2E, and post-deploy smoke. Workflows run on the Node 24 action/runtime line so CI avoids deprecated Node 20 JavaScript actions.

Branch policy: normal work starts on `dev`; production promotion is a protected `dev` -> `main` PR. Treat `main` as production-only, and create release tags only from `main` commits.

## Workflow map

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| [pr-checks.yml](../../.github/workflows/pr-checks.yml) | `pull_request`, `workflow_dispatch` | Fast PR gate: lint, unit tests, docs link validation, build (no E2E) |
| [pr-e2e-smoke.yml](../../.github/workflows/pr-e2e-smoke.yml) | `pull_request`, `workflow_dispatch` | Optional E2E smoke: mobile + a11y + live-qwen-contract + upload-flow (warn-only on PRs; strict when `PR_E2E_STRICT=true`) |
| [ci.yml](../../.github/workflows/ci.yml) | `push` to `main`/`master`, `workflow_dispatch` | Security scan, quality, web audits, visual regression, production LCP budget |
| [e2e-nightly.yml](../../.github/workflows/e2e-nightly.yml) | Daily schedule (06:00 UTC), `workflow_dispatch` | Full `CI=1 npm run test:e2e` Playwright suite |
| [post-deploy-smoke.yml](../../.github/workflows/post-deploy-smoke.yml) | `workflow_dispatch`, `repository_dispatch` | Route/API smoke plus browser share/export smoke against a deployed URL |
| [production-reliability.yml](../../.github/workflows/production-reliability.yml) | Daily schedule (07:30 UTC), `workflow_dispatch` | Production health probe plus share/export browser smoke; opens or comments on a failure issue |

PR checks stay fast on purpose. Heavier browser work runs on main or on the nightly schedule.

## Protected main

`main` is protected in GitHub branch settings:

- Pull requests are required before changes reach `main`.
- Required status checks must pass before merge.
- Required checks are evaluated against the latest `main` before merge.
- Direct pushes, force pushes, and branch deletion are blocked.

Use `dev` for day-to-day work. When `dev` is ready, open the release PR into `main` and tag only after the PR has merged.

## PR E2E smoke (optional)

**Workflow:** `pr-e2e-smoke.yml`

Runs a **fast subset** of Playwright specs on every pull request:

- `e2e/mobile.spec.ts` - mobile viewport flows
- `e2e/a11y.spec.ts` - accessibility checks
- `e2e/live-qwen-contract.spec.ts` - live-path contract (mocked JSON, no API key)
- `e2e/upload-flow.spec.ts` - upload size guard and sample-picker flow

**Warn-only on PRs (default):** the job uses `continue-on-error` so failures show as a yellow check and do **not** block merge. Required PR gate remains `pr-checks.yml` (lint, unit tests, docs links, build).

**Strict on PRs:** set repository variable **`PR_E2E_STRICT`** to `true` under **Settings -> Secrets and variables -> Actions -> Variables** to fail the job on test errors and block merge (same pattern as `PERF_LCP_STRICT` for the LCP budget).

**Strict on manual run:** **Actions -> PR E2E Smoke -> Run workflow** always fails the workflow on test errors (useful before merge or when debugging CI).

| Setting | Default | Notes |
|---------|---------|-------|
| `PR_E2E_STRICT` | off (warn-only on PRs) | Set to `true` to hard-fail PR smoke on errors |

Local equivalent:

```bash
CI=1 npm run test:e2e:pr-smoke
```

On failure, `test-results/` artifacts are uploaded for 7 days.

### Why visual regression is not on PR checks

`pr-checks.yml` intentionally skips Playwright visual regression:

- **Time:** building, starting the app, and running Chromium adds several minutes to every PR.
- **Noise:** snapshot baselines are tuned for the CI production server; feature-branch UI work often produces expected diffs that block merges without catching real regressions.
- **Coverage:** `visual-regression` in `ci.yml` runs on every `main` push (hard fail). Nightly `e2e-nightly.yml` runs the full suite.

To run visual checks on a branch before merge:

```bash
npm run test:e2e:visual
```

## E2E nightly

**Workflow:** `e2e-nightly.yml`

Runs the complete Playwright suite with `CI=1` (production build + `next start`, offline mocks, one retry). On failure, `test-results/` artifacts are uploaded for 14 days.

Manual run: **Actions -> E2E Nightly -> Run workflow**.

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

**Job:** `perf-lcp-budget` in `ci.yml` (main push, warn-only by default)

Uses [`scripts/perf-lcp-budget.mjs`](../../scripts/perf-lcp-budget.mjs) to run Lighthouse against the production origin. Default URL is `https://qwen-ui-lab.vercel.app`; override with repository variable `PRODUCTION_DEPLOY_URL` (same as post-deploy smoke).

| Setting | Default | Notes |
|---------|---------|-------|
| `PERF_MAX_LCP_MS` | `2500` | Fail threshold when strict mode is on |
| `PERF_LCP_STRICT` | `false` in CI | Warns by default because live production probes can spike; set repo variable `PERF_LCP_STRICT=true` to fail on breach |

Local examples:

```bash
# Warn-only (local default; script exits 0 on breach)
npm run perf:lcp-budget

# Enforce budget
PERF_LCP_STRICT=1 npm run perf:lcp-budget
node scripts/perf-lcp-budget.mjs --strict --url https://qwen-ui-lab.vercel.app
```

Reports are written to `.perf/lighthouse-lcp-budget.json` (gitignored). CI uploads this file when present.

To make production LCP breaches block CI without changing workflow YAML, set repository variable **`PERF_LCP_STRICT`** to `true` under **Settings -> Secrets and variables -> Actions -> Variables**.

## Related scripts

| Script | Use |
|--------|-----|
| `npm run test:e2e` | Full Playwright suite |
| `npm run test:e2e:pr-smoke` | PR smoke subset (mobile + a11y + live-qwen-contract + upload-flow) |
| `npm run test:e2e:visual` | Visual regression spec only |
| `npm run smoke:share-live` | Browser smoke for deployed share/export behavior |
| `npm run synthetic:health` | Synthetic `/api/health` probe |
| `npm run perf:lcp-budget` | Production LCP check |
| `npm run perf:lighthouse` | Local build + Lighthouse (see [POST_LAUNCH.md](./POST_LAUNCH.md)) |

## See also

- [LOCAL_ANALYSIS_E2E.md](./LOCAL_ANALYSIS_E2E.md) - local-analysis E2E strategy and snapshot workflow
- [PRODUCTION_DEPLOY_LANE.md](./PRODUCTION_DEPLOY_LANE.md) - deploy env gates and smoke hooks
- [RELIABILITY_OPS.md](./RELIABILITY_OPS.md) - synthetic health and ops playbooks
