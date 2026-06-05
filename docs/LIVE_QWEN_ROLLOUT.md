# Live Qwen Rollout Checklist

Use this guide when you intentionally enable **upstream Qwen3-VL vision** on a deployed environment. The public meetup site stays **demo-safe by default**; live mode spends Model Studio credits and depends on network quota.

Related: **[PRODUCTION_DEPLOY_LANE.md](./PRODUCTION_DEPLOY_LANE.md)** · **[DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)** · **[ROLLBACK_CHECKLIST.md](./ROLLBACK_CHECKLIST.md)** · **[TROUBLESHOOTING_RUNBOOK.md](./TROUBLESHOOTING_RUNBOOK.md)**

## When to use live mode

| Scenario | Recommendation |
|----------|----------------|
| Public meetup / offline demo | Keep `QWEN_LIVE_ANALYSIS` **unset** |
| Staging rehearsal with real vision | Enable live on **preview/staging** only |
| Production live analysis | Staged rollout (preview → limited → full) with monitoring |

An API key **alone** does not call Qwen. Both the flag and the key are required.

## Required environment (host / Vercel / equivalent)

Set **server-only** variables in the deployment environment (never `NEXT_PUBLIC_*` for secrets).

| Variable | Required for live | Notes |
|----------|-------------------|--------|
| `QWEN_LIVE_ANALYSIS` | **Yes** — `true` | Alias: `USE_LIVE_QWEN=1` / `yes` |
| `DASHSCOPE_API_KEY` | **Yes** | Model Studio key; do not commit |
| `QWEN_MODEL` | **Yes** (for `deploy:env:live`) | e.g. `qwen3-vl-plus` — must be set in host env even though the app has a runtime default |
| `QWEN_BASE_URL` | Optional | Defaults to Singapore compatible endpoint; see [`.env.example`](../.env.example) for US/Beijing URLs |

Copy [`.env.example`](../.env.example) to `.env.local` for local rehearsal:

```bash
DASHSCOPE_API_KEY=<your-key>
QWEN_LIVE_ANALYSIS=true
QWEN_MODEL=qwen3-vl-plus
QWEN_BASE_URL=https://dashscope-intl.aliyuncs.com/compatible-mode/v1
```

Restart the dev server after changing env files.

## Pre-promote gate: `deploy:env:live`

Run validation **in the same shell or CI job** that will deploy, with production secrets loaded:

```bash
npm run deploy:env:live
# equivalent:
node scripts/validate-deploy-env.mjs --target=live
```

### Expected validator behavior

The script prints a summary and exits `0` only when policy passes.

**Demo gate (default CI / local, no live env):**

```bash
npm run deploy:env:demo
```

| Check | Typical local/CI (no `.env.local`) |
|-------|-------------------------------------|
| Exit code | `0` |
| `Live analysis requested` | `no` |
| `Live calls executable` | `no` |

**Live gate without live env (expected failure — documents the gate):**

```bash
npm run deploy:env:live
```

| Check | Typical without secrets |
|-------|-------------------------|
| Exit code | `1` |
| Errors | Missing `QWEN_LIVE_ANALYSIS`, `DASHSCOPE_API_KEY`, `QWEN_MODEL`, unusable Qwen config |

**Live gate with full env (expected pass):**

```bash
# PowerShell example
$env:QWEN_LIVE_ANALYSIS='true'
$env:DASHSCOPE_API_KEY='<your-key>'
$env:QWEN_MODEL='qwen3-vl-plus'
npm run deploy:env:live
```

| Check | With valid live env |
|-------|---------------------|
| Exit code | `0` |
| `Live analysis requested` | `yes` |
| `Live calls executable` | `yes` |

**Hard failures (any target):**

- `NEXT_PUBLIC_QWEN_API_KEY` set → exit `1` (secret leakage risk)
- Invalid `QWEN_BASE_URL` → exit `1`
- `--target=demo` with `QWEN_LIVE_ANALYSIS=true` → exit `1`

**Warnings:**

- Demo target with `DASHSCOPE_API_KEY` set but live flag off → warning only; still passes demo gate

## Staged rollout

1. **Stage A — Preview**
   - [ ] Set live env vars on **preview** environment only
   - [ ] `npm run deploy:env:live` in pipeline or locally with preview secrets
   - [ ] Deploy preview build
   - [ ] `DEPLOY_URL=<preview-url> npm run smoke:deploy` (demo expectation off preview if live)
   - [ ] `EXPECT_LIVE_ANALYSIS=true DEPLOY_URL=<preview-url> npm run smoke:deploy`
   - [ ] `GET /api/health` → `liveAnalysisEnabled: true`, `provider: "qwen"`

2. **Stage B — Limited / internal**
   - [ ] Promote same env to production or internal audience
   - [ ] Header shows **Live Qwen** badge; Analyze calls `POST /api/analyze-ui`
   - [ ] Monitor error rate and Model Studio quota
   - [ ] Rollback owner on-call for first hour

3. **Stage C — Full production**
   - [ ] Expand traffic after stability window
   - [ ] Re-run live smoke and optional latency probe:
     - `node scripts/synthetic-health-check.mjs --base-url <url> --attempts 5`

Full release checklist: **[DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)** §2–5.

## Post-deploy smoke (live)

```bash
EXPECT_LIVE_ANALYSIS=true DEPLOY_URL=https://<your-deployed-host> npm run smoke:deploy
```

Smoke verifies:

- `GET /api/health` — `ok: true` and `liveAnalysisEnabled` matches `EXPECT_LIVE_ANALYSIS`
- `/`, `/design-system`, laws-of-ux / uilaws routes, `robots.txt`, `sitemap.xml`

Manual UI check on `/`:

1. Confirm header **Live Qwen** (not Demo mode).
2. **Use sample screenshot** → **Analyze** — should call upstream (not instant offline-only).
3. Success path shows live completion messaging (network/quota dependent).

Optional local health probe before deploy: `npm run doctor` (with live env loaded).

## Rollback to demo mode (fast containment)

Use this when live vision misbehaves, quota spikes, or you need meetup-safe behavior **without** redeploying code.

1. **Disable live flag** on the host (fastest):
   - Unset or set `QWEN_LIVE_ANALYSIS=false` (and `USE_LIVE_QWEN` if used)
   - Redeploy or trigger env-only refresh per host (Vercel: redeploy production after env change)
2. **Verify demo-safe policy locally** (optional, with demo-like env):
   ```bash
   npm run deploy:env:demo
   ```
3. **Verify production**:
   ```bash
   DEPLOY_URL=https://<host> npm run smoke:deploy
   ```
   - Expect `GET /api/health` → `liveAnalysisEnabled: false`, `provider: "demo"`
4. If the **build** is bad, follow **[ROLLBACK_CHECKLIST.md](./ROLLBACK_CHECKLIST.md)** (redeploy last good tag **and** keep live flag off).

Leaving `DASHSCOPE_API_KEY` set while live flag is off is **safe** — no upstream calls until `QWEN_LIVE_ANALYSIS=true` again.

## Re-enable live after rollback

1. Fix root cause (key, region URL, quota, model name).
2. `npm run deploy:env:live` with production secrets.
3. Repeat Stage A preview smoke before promoting.

## Public demo reminder

Operators running meetups should keep **`QWEN_LIVE_ANALYSIS` unset** on the public Vercel project. See **[POST_LAUNCH.md](./POST_LAUNCH.md)** and **[DEMO.md](../DEMO.md)**.
