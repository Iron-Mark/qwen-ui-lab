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

## Enable live on Vercel Preview (operator steps)

Use this sequence to rehearse live vision on a **Preview** deployment without changing **Production** env (meetup-safe default).

1. **Create or open a Preview deployment**
   - Push a branch / open a PR so Vercel builds a preview URL (`https://<project>-<hash>.vercel.app`), or use an existing staging host.
2. **Set server-only variables (Preview scope only)**
   - Vercel → **Project → Settings → Environment Variables**
   - Add to **Preview** (leave **Production** unchecked until Stage C):
     - `QWEN_LIVE_ANALYSIS` = `true`
     - `DASHSCOPE_API_KEY` = your Model Studio key
     - `QWEN_MODEL` = `qwen3-vl-plus` (or your chosen VL model)
     - Optional: `QWEN_BASE_URL` if not using the Singapore default
   - Do **not** enable “Expose to Browser” on secrets. Do **not** set `NEXT_PUBLIC_QWEN_API_KEY`.
3. **Redeploy Preview**
   - **Deployments** → latest Preview → **Redeploy** (env vars apply on the next deployment, not retroactively on old builds).
4. **Validate locally before/after promote** (same values you set in Vercel):
   ```bash
   npm run deploy:env:live
   ```
5. **Smoke the preview URL** (HTTPS required):
   ```bash
   DEPLOY_URL=https://<your-preview-host> node scripts/staged-live-smoke.mjs
   ```
   - Script refuses `http://` and the public demo production host unless `ALLOW_PRODUCTION_LIVE_SMOKE=1`.
   - Expect: health `provider: "qwen"`, `liveAnalysisEnabled: true`, `hasApiKey: true`, non-empty `model`; `POST /api/analyze-ui` rejects invalid body with HTTP 400.
6. **Manual UI check** on the preview `/` URL: header **Live Qwen** → sample screenshot → **Analyze** (upstream call; quota-dependent).

Local rehearsal (safe, no Vercel changes): copy [`.env.example`](../.env.example) → `.env.local`, set live vars, restart `npm run dev`, then `npm run doctor`.

## Required environment (host / Vercel / equivalent)

Set **server-only** variables in the deployment environment (never `NEXT_PUBLIC_*` for secrets).

| Variable | Required for live | Notes |
|----------|-------------------|--------|
| `QWEN_LIVE_ANALYSIS` | **Yes** — `true` | Alias: `USE_LIVE_QWEN=1` / `yes` |
| `DASHSCOPE_API_KEY` | **Yes** | Model Studio key; do not commit |
| `QWEN_MODEL` | **Yes** (for `deploy:env:live`) | e.g. `qwen3-vl-plus` — must be set in host env even though the app has a runtime default |
| `QWEN_BASE_URL` | Optional | Defaults to Singapore compatible endpoint; see [`.env.example`](../.env.example) for US/Beijing URLs |

### Vercel environment checklist (exact)

Configure in **Vercel → Project → Settings → Environment Variables**. All Qwen secrets are **server-only** (do not enable “Expose to Browser”).

| Variable | Production (public meetup) | Preview (live rehearsal) | Development |
|----------|---------------------------|------------------------|-------------|
| `QWEN_LIVE_ANALYSIS` | **Unset** or `false` | `true` when rehearsing live | `true` in `.env.local` only when testing live locally |
| `USE_LIVE_QWEN` | **Unset** (alias; do not set if using `QWEN_LIVE_ANALYSIS`) | Optional alias `1` / `yes` | Same as preview |
| `DASHSCOPE_API_KEY` | Optional unset (recommended) or set — **no upstream calls without live flag** | **Required** for live preview | Required in `.env.local` for live local tests |
| `QWEN_MODEL` | Optional (ignored in demo mode) | **Required** — e.g. `qwen3-vl-plus` | Same as preview |
| `QWEN_BASE_URL` | Optional | Optional — set if region ≠ Singapore default | Optional |
| `NEXT_PUBLIC_QWEN_API_KEY` | **Must never exist** | **Must never exist** | **Must never exist** |

**Vercel operator steps (live preview only — not public production):**

1. Add each live variable above to **Preview** scope only (uncheck Production until Stage C).
2. Leave **Production** `QWEN_LIVE_ANALYSIS` unset for meetup-safe default.
3. After any env change on Vercel, **Redeploy** the affected environment (env vars apply on next deployment).
4. Before promoting to Production live: run `npm run deploy:env:live` in CI or locally with the same values Vercel will receive.
5. Confirm `GET /api/health` on the preview URL shows `liveAnalysisEnabled: true`, `provider: "qwen"`.

Copy [`.env.example`](../.env.example) to `.env.local` for local rehearsal:

```bash
DASHSCOPE_API_KEY=<your-key>
QWEN_LIVE_ANALYSIS=true
QWEN_MODEL=qwen3-vl-plus
QWEN_BASE_URL=https://dashscope-intl.aliyuncs.com/compatible-mode/v1
```

Restart the dev server after changing env files.

## Live API rate limiting

When **`QWEN_LIVE_ANALYSIS=true`** and **`DASHSCOPE_API_KEY`** are set (`canUseLiveQwen()`), `POST /api/analyze-ui` applies a lightweight **per-IP** limit before calling Model Studio.

| Setting | Default | Purpose |
|---------|---------|---------|
| `ANALYZE_UI_RATE_LIMIT_MAX` | `12` | Max live analyze requests per client IP per window |
| `ANALYZE_UI_RATE_LIMIT_WINDOW_MS` | `60000` | Fixed window length (ms) |

**Behavior**

- **Demo / offline:** live flag off → **no rate limit** on this route (client usually skips the route; server may still return demo artifact if called).
- **Exceeded limit:** HTTP **429**, `code: "rate_limit_exceeded"`, `Retry-After` header (seconds), `X-RateLimit-Limit`.
- **Serverless:** in-memory buckets are **per warm instance** (best-effort abuse guard, not a global cluster quota). For stricter caps, add edge/WAF or Redis later.

**Tuning for preview rehearsal:** lower `ANALYZE_UI_RATE_LIMIT_MAX` on Preview if you expect heavy clicking during a dry run.

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

### Validation log (2026-06-05)

Ran on `qwen-ui-lab` release branch tooling (no production live enablement):

| Command | Exit | Summary |
|---------|------|---------|
| `npm run deploy:env:demo` (clean env) | `0` | `Live analysis requested: no`, `Live calls executable: no` |
| `npm run deploy:env:live` (clean env) | `1` | Errors: missing `QWEN_LIVE_ANALYSIS`, `DASHSCOPE_API_KEY`, `QWEN_MODEL` |
| `npm run deploy:env:live` (mock live env) | `0` | `Live analysis requested: yes`, `Live calls executable: yes` |
| `npm run deploy:env:demo` with `QWEN_LIVE_ANALYSIS=true` | `1` | Demo gate blocks live flag |
| `DEPLOY_URL=https://qwen-ui-lab.vercel.app npm run smoke:deploy` | `0` | `provider=demo`, `liveAnalysisEnabled=false` (production stays demo-safe) |
| `EXPECT_LIVE_ANALYSIS=true` + same production URL | `1` | Health mismatch — confirms live smoke detects demo rollback state |

## Staged rollout

1. **Stage A — Preview**
   - [ ] Set live env vars on **preview** environment only
   - [ ] `npm run deploy:env:live` in pipeline or locally with preview secrets
   - [ ] Deploy preview build
   - [ ] Demo baseline on preview (if env not yet live): `DEPLOY_URL=<preview-url> npm run smoke:deploy`
   - [ ] **Staged live smoke** (after live env on preview):
     ```bash
     DEPLOY_URL=https://<preview-url> node scripts/staged-live-smoke.mjs
     # equivalent:
     EXPECT_LIVE_ANALYSIS=true DEPLOY_URL=https://<preview-url> npm run smoke:deploy
     ```
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

Use **`scripts/staged-live-smoke.mjs`** on preview or staging only until production is intentionally live:

```bash
DEPLOY_URL=https://<preview-or-staging-host> node scripts/staged-live-smoke.mjs
# or with explicit URL flag:
node scripts/staged-live-smoke.mjs --url=https://<preview-or-staging-host>
```

Equivalent manual form:

```bash
EXPECT_LIVE_ANALYSIS=true DEPLOY_URL=https://<your-deployed-host> npm run smoke:deploy
```

GitHub Actions: workflow_dispatch input `expect_live_analysis: true` on **Post Deploy Smoke** (`.github/workflows/post-deploy-smoke.yml`).

Smoke verifies:

- `GET /api/health` — `ok: true` and `liveAnalysisEnabled` matches `EXPECT_LIVE_ANALYSIS`
- When `EXPECT_LIVE_ANALYSIS=true`: `provider: "qwen"`, `hasApiKey: true`, non-empty `model`
- When live: `POST /api/analyze-ui` with empty JSON body → HTTP **400** (route reachable, validation active)
- `staged-live-smoke.mjs`: HTTPS only; blocks public demo production host unless `ALLOW_PRODUCTION_LIVE_SMOKE=1`
- `/`, `/design-system`, laws-of-ux / uilaws routes, `robots.txt`, `sitemap.xml`

Manual UI check on `/`:

1. Confirm header **Live Qwen** (not Demo mode).
2. **Use sample screenshot** → **Analyze** — should call upstream (not instant offline-only).
3. Success path shows live completion messaging (network/quota dependent).

Optional local health probe before deploy: `npm run doctor` (with live env loaded).

## Rollback to demo mode (fast containment)

Use this when live vision misbehaves, quota spikes, or you need meetup-safe behavior **without** redeploying code.

1. **Disable live flag** on the host (fastest):
   - Vercel: **Settings → Environment Variables** → remove or set `QWEN_LIVE_ANALYSIS=false` (and `USE_LIVE_QWEN` if used) for the affected scope (Production and/or Preview).
   - **Deployments → … → Redeploy** so the runtime picks up the change.
2. **Verify demo-safe policy locally** (optional, with demo-like env — unset live vars first):
   ```bash
   npm run deploy:env:demo
   ```
   Expected: exit `0`, `Live analysis requested: no`.
3. **Verify deployed host is demo-safe**:
   ```bash
   DEPLOY_URL=https://<host> npm run smoke:deploy
   ```
   Expected: `PASS health: provider=demo, liveAnalysisEnabled=false`.
4. **Confirm live smoke would fail** (negative check — proves rollback stuck):
   ```bash
   DEPLOY_URL=https://<host> node scripts/staged-live-smoke.mjs
   ```
   Expected: exit `1`, `/api/health liveAnalysisEnabled mismatch (expected true, got false)`.
5. If the **build** is bad, follow **[ROLLBACK_CHECKLIST.md](./ROLLBACK_CHECKLIST.md)** (redeploy last good tag **and** keep live flag off).

### Rollback drill results (2026-06-05, production unchanged)

Public production **`https://qwen-ui-lab.vercel.app`** was **not** switched to live. Drill used current demo-safe production:

| Step | Command | Result |
|------|---------|--------|
| Demo gate after clearing live env | `npm run deploy:env:demo` | Pass (`0`) |
| Demo smoke on production | `DEPLOY_URL=https://qwen-ui-lab.vercel.app npm run smoke:deploy` | Pass — `provider=demo` |
| Live smoke on demo production | `EXPECT_LIVE_ANALYSIS=true` + same URL | Fail (`1`) — mismatch detected |

Leaving `DASHSCOPE_API_KEY` set while live flag is off is **safe** — no upstream calls until `QWEN_LIVE_ANALYSIS=true` again.

## Re-enable live after rollback

1. Fix root cause (key, region URL, quota, model name).
2. `npm run deploy:env:live` with production secrets.
3. Repeat Stage A preview smoke before promoting.

## Public demo reminder

Operators running meetups should keep **`QWEN_LIVE_ANALYSIS` unset** on the public Vercel project. See **[POST_LAUNCH.md](./POST_LAUNCH.md)** and **[DEMO.md](../DEMO.md)**.
