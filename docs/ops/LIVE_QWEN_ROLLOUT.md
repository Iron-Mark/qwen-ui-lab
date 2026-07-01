# Live Qwen Rollout Checklist

Use this guide when you intentionally enable **upstream Qwen3-VL vision** on a deployed environment. The public app stays **local-analysis-first by default**; live mode spends Model Studio credits and depends on network quota.

Related: **[PRODUCTION_DEPLOY_LANE.md](./PRODUCTION_DEPLOY_LANE.md)** · **[DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)** · **[ROLLBACK_CHECKLIST.md](./ROLLBACK_CHECKLIST.md)** · **[TROUBLESHOOTING_RUNBOOK.md](./TROUBLESHOOTING_RUNBOOK.md)**

## When to use live mode

| Scenario | Recommendation |
|----------|----------------|
| Public app / local analysis | Keep `QWEN_LIVE_ANALYSIS` **unset** |
| Staging rehearsal with real vision | Enable live on **preview/staging** only |
| Production live analysis | Staged rollout (preview → limited → full) with monitoring |

An API key **alone** does not call Qwen. Both the flag and the key are required.

## Preview-only enable checklist

Use this when turning on live vision on **Vercel Preview only**. Do **not** check **Production** in the Vercel UI until Stage C.

- [ ] **Production untouched** — `QWEN_LIVE_ANALYSIS` unset or `false` on Production (the public app stays local-analysis-first).
- [ ] **Preview scope only** — live vars added with **Preview** checked, **Production** unchecked.
- [ ] **Server-only secrets** — `DASHSCOPE_API_KEY` not exposed to the browser; no `NEXT_PUBLIC_QWEN_API_KEY`.
- [ ] **Required trio on Preview** — `QWEN_LIVE_ANALYSIS=true`, `DASHSCOPE_API_KEY`, `QWEN_MODEL` (e.g. `qwen3-vl-plus`).
- [ ] **Redeploy Preview** after any env change (vars apply on the next deployment, not old builds).
- [ ] **Local gate** — `npm run deploy:env:live` passes with the same values (see below).
- [ ] **Staged smoke** — `DEPLOY_URL=https://<preview-host> npm run smoke:staged` (or `npm run smoke:live`) exits `0`.
- [ ] **Health** — `GET /api/health` on preview → `liveAnalysisEnabled: true`, `provider: "qwen"`.
- [ ] **Manual UI** — header **Live Qwen** → sample screenshot → **Analyze** completes (quota permitting).

## Copy-paste Vercel env (Preview only)

Paste into **Vercel → Project → Settings → Environment Variables** one row at a time, or use the REST API / CLI snippets below. Replace placeholders; delete the JSON file after import if you saved secrets on disk.

| Key | Value (example) | Environments |
|-----|-----------------|--------------|
| `QWEN_LIVE_ANALYSIS` | `true` | **Preview** only |
| `DASHSCOPE_API_KEY` | `<your-model-studio-key>` | **Preview** only |
| `QWEN_MODEL` | `qwen3-vl-plus` | **Preview** only |
| `QWEN_BASE_URL` | `https://dashscope-intl.aliyuncs.com/compatible-mode/v1` | **Preview** only (optional) |
| `ANALYZE_UI_RATE_LIMIT_MAX` | `12` (or lower for dry runs) | **Preview** only (optional) |

### REST API bulk create (Preview target)

Requires a Vercel token and project ID. **`target` must be `preview` only** — do not include `production` until Stage C.

```json
[
  {
    "key": "QWEN_LIVE_ANALYSIS",
    "value": "true",
    "type": "encrypted",
    "target": ["preview"]
  },
  {
    "key": "DASHSCOPE_API_KEY",
    "value": "<your-model-studio-key>",
    "type": "encrypted",
    "target": ["preview"]
  },
  {
    "key": "QWEN_MODEL",
    "value": "qwen3-vl-plus",
    "type": "plain",
    "target": ["preview"]
  },
  {
    "key": "QWEN_BASE_URL",
    "value": "https://dashscope-intl.aliyuncs.com/compatible-mode/v1",
    "type": "plain",
    "target": ["preview"]
  }
]
```

POST to `https://api.vercel.com/v10/projects/{projectId}/env` with `Authorization: Bearer <token>` and `Content-Type: application/json`. See [Vercel env API](https://vercel.com/docs/rest-api/projects/create-one-or-more-environment-variables).

### CLI helper JSON (Preview via `vercel env add`)

Save as `vercel-preview-live.json` (git-ignore this file), set `VERCEL_ENV=preview`, then:

```json
{
  "QWEN_LIVE_ANALYSIS": "true",
  "DASHSCOPE_API_KEY": "<your-model-studio-key>",
  "QWEN_MODEL": "qwen3-vl-plus",
  "QWEN_BASE_URL": "https://dashscope-intl.aliyuncs.com/compatible-mode/v1"
}
```

```bash
# bash + jq — Preview only; never run with VERCEL_ENV=production for this rehearsal
VERCEL_ENV=preview
source <(jq -rj '. | to_entries[] | "echo -n \"\(.value)\" | vercel env add \(.key) $VERCEL_ENV;\n"' vercel-preview-live.json)
rm vercel-preview-live.json
```

PowerShell (one variable at a time):

```powershell
cd qwen-ui-lab
"true" | vercel env add QWEN_LIVE_ANALYSIS preview
"<your-model-studio-key>" | vercel env add DASHSCOPE_API_KEY preview
"qwen3-vl-plus" | vercel env add QWEN_MODEL preview
```

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
   DEPLOY_URL=https://<your-preview-host> npm run smoke:staged
   # aliases: npm run smoke:live
   # or: node scripts/staged-live-smoke.mjs --url=https://<your-preview-host>
   ```
   - Script refuses `http://` and the public demo production host unless `ALLOW_PRODUCTION_LIVE_SMOKE=1`.
   - Expect: health `provider: "qwen"`, `liveAnalysisEnabled: true`, `hasApiKey: true`, non-empty `model`; `POST /api/analyze-ui` rejects invalid body with HTTP 400.
6. **Manual UI check** on the preview `/` URL: header **Live Qwen** → sample screenshot → **Analyze** (upstream call; quota-dependent).

Local rehearsal (safe, no Vercel changes): copy [`.env.example`](../../.env.example) → `.env.local`, set live vars, restart `npm run dev`, then `npm run doctor`.

## Required environment (host / Vercel / equivalent)

Set **server-only** variables in the deployment environment (never `NEXT_PUBLIC_*` for secrets).

| Variable | Required for live | Notes |
|----------|-------------------|--------|
| `QWEN_LIVE_ANALYSIS` | **Yes** — `true` | Alias: `USE_LIVE_QWEN=1` / `yes` |
| `DASHSCOPE_API_KEY` | **Yes** | Model Studio key; do not commit |
| `QWEN_MODEL` | **Yes** (for `deploy:env:live`) | e.g. `qwen3-vl-plus` — must be set in host env even though the app has a runtime default |
| `QWEN_BASE_URL` | Optional | Defaults to Singapore compatible endpoint; see [`.env.example`](../../.env.example) for US/Beijing URLs |

### Vercel environment checklist (exact)

Configure in **Vercel → Project → Settings → Environment Variables**. All Qwen secrets are **server-only** (do not enable “Expose to Browser”).

| Variable | Production (public app) | Preview (live rehearsal) | Development |
|----------|---------------------------|------------------------|-------------|
| `QWEN_LIVE_ANALYSIS` | **Unset** or `false` | `true` when rehearsing live | `true` in `.env.local` only when testing live locally |
| `USE_LIVE_QWEN` | **Unset** (alias; do not set if using `QWEN_LIVE_ANALYSIS`) | Optional alias `1` / `yes` | Same as preview |
| `DASHSCOPE_API_KEY` | Optional unset (recommended) or set — **no upstream calls without live flag** | **Required** for live preview | Required in `.env.local` for live local tests |
| `QWEN_MODEL` | Optional (ignored in demo mode) | **Required** — e.g. `qwen3-vl-plus` | Same as preview |
| `QWEN_BASE_URL` | Optional | Optional — set if region ≠ Singapore default | Optional |
| `NEXT_PUBLIC_QWEN_API_KEY` | **Must never exist** | **Must never exist** | **Must never exist** |

### Copy-paste matrix: Production vs Preview (all lanes)

Use this when pasting into **Vercel → Settings → Environment Variables**. Check only the column’s environment scope per row. Validate locally after pull (no Vercel API calls):

```bash
# After: vercel env pull .env.production.local  (or preview)
npm run validate:prod
# Preview rehearsal with live vars loaded:
npm run validate:prod:preview
```

| Variable | Production value | Preview value | Scope notes |
|----------|------------------|---------------|-------------|
| `KV_REST_API_URL` | *(from Vercel KV dashboard)* | Same store URL | **Production + Preview** — required on Production for durable share links + cluster rate limits |
| `KV_REST_API_TOKEN` | *(from KV dashboard)* | Same token | **Production + Preview** — server-only; never expose to browser |
| `GITHUB_TOKEN` | `ghp_…` or fine-grained PAT (`gist`) | Same or separate preview PAT | **Production + Preview** — server-only gist export |
| `NEXT_PUBLIC_OBSERVABILITY_ENABLED` | **Unset** (meetup default) | `true` only when rehearsing telemetry | Client flag |
| `NEXT_PUBLIC_ERROR_MONITORING_ENABLED` | **Unset** unless ops enables monitoring | `true` with observability rehearsal | Requires master flag |
| `NEXT_PUBLIC_SENTRY_DSN` | **Unset** unless row above enabled | `https://…@…ingest.sentry.io/…` when monitoring on | Required when error monitoring enabled |
| `NEXT_PUBLIC_SENTRY_ENVIRONMENT` | `production` when Sentry on | `preview` | Optional; defaults to `VERCEL_ENV` |
| `QWEN_LIVE_ANALYSIS` | **Unset** or `false` | `true` for Stage A live rehearsal | See live rows below |
| `DASHSCOPE_API_KEY` | Optional (no calls without live flag) | **Required** when live on Preview | Server-only |
| `QWEN_MODEL` | Optional | `qwen3-vl-plus` when live on Preview | Required for `deploy:env:live` |
| `QWEN_BASE_URL` | Optional | `https://dashscope-intl.aliyuncs.com/compatible-mode/v1` | Optional region override |
| `ANALYZE_UI_RATE_LIMIT_MAX` | Optional (default `12` when live) | `12` or lower for dry runs | Preview-only tuning OK |
| `NEXT_PUBLIC_QWEN_API_KEY` | **Never** | **Never** | Validator hard-fails if set |

**Production copy-paste block (meetup-safe + platform ops):**

| Key | Value | Vercel environments |
|-----|-------|---------------------|
| `KV_REST_API_URL` | *(paste from KV)* | Production, Preview |
| `KV_REST_API_TOKEN` | *(paste from KV)* | Production, Preview |
| `GITHUB_TOKEN` | `ghp_<gist-capable-token>` | Production, Preview |
| `QWEN_LIVE_ANALYSIS` | *(leave unset)* | Production only — do not add |
| `DASHSCOPE_API_KEY` | *(optional; omit for strictest demo)* | Production only if you accept unused key |

**Preview-only live rehearsal block (Stage A — do not check Production):**

| Key | Value | Vercel environments |
|-----|-------|---------------------|
| `QWEN_LIVE_ANALYSIS` | `true` | **Preview** only |
| `DASHSCOPE_API_KEY` | `<your-model-studio-key>` | **Preview** only |
| `QWEN_MODEL` | `qwen3-vl-plus` | **Preview** only |
| `QWEN_BASE_URL` | `https://dashscope-intl.aliyuncs.com/compatible-mode/v1` | **Preview** only (optional) |

**Preview observability rehearsal (optional):**

| Key | Value | Vercel environments |
|-----|-------|---------------------|
| `NEXT_PUBLIC_OBSERVABILITY_ENABLED` | `true` | Preview |
| `NEXT_PUBLIC_ERROR_MONITORING_ENABLED` | `true` | Preview |
| `NEXT_PUBLIC_SENTRY_DSN` | `https://…@…ingest.sentry.io/…` | Preview |
| `NEXT_PUBLIC_SENTRY_ENVIRONMENT` | `preview` | Preview |

**Vercel operator steps (live preview only — not public production):**

1. Add each live variable above to **Preview** scope only (uncheck Production until Stage C).
2. Leave **Production** `QWEN_LIVE_ANALYSIS` unset for meetup-safe default.
3. After any env change on Vercel, **Redeploy** the affected environment (env vars apply on next deployment).
4. Before promoting to Production live: run `npm run deploy:env:live` in CI or locally with the same values Vercel will receive.
5. Confirm `GET /api/health` on the preview URL shows `liveAnalysisEnabled: true`, `provider: "qwen"`.

Copy [`.env.example`](../../.env.example) to `.env.local` for local rehearsal:

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

### Rate limit store (pluggable)

Buckets are backed by a store adapter in `src/features/analysis/lib/analyze-ui-rate-limit-store.mjs`:

| Store | When used | Notes |
|-------|-----------|--------|
| **In-memory** (default) | `KV_REST_API_URL` or `KV_REST_API_TOKEN` unset | Per warm serverless instance — best-effort abuse guard |
| **Vercel KV / Upstash Redis REST** | Both `KV_REST_API_URL` and `KV_REST_API_TOKEN` set | Shared cluster-wide cap across instances (same vars as optional share links) |

**KV fallback:** if a KV read/write fails at request time, the route falls back to the in-memory store for that request so live analysis stays available.

**Behavior**

- **Demo / offline:** live flag off → **no rate limit** on this route (client usually skips the route; server may still return demo artifact if called).
- **Exceeded limit:** HTTP **429**, `code: "rate_limit_exceeded"`, `Retry-After` header (seconds), `X-RateLimit-Limit`.
- **Serverless without KV:** in-memory buckets are **per warm instance** (not a global cluster quota).
- **Serverless with KV:** limits apply **across all instances** for the same client IP.

**Optional KV setup (Preview / Production live)**

1. Vercel → **Storage** → create or link **KV** (Upstash Redis).
2. Vercel injects `KV_REST_API_URL` and `KV_REST_API_TOKEN` into the project env (Preview and/or Production).
3. Redeploy. No code change required — unset vars keep in-memory mode.

**Tuning for preview rehearsal:** lower `ANALYZE_UI_RATE_LIMIT_MAX` on Preview if you expect heavy clicking during a dry run.

### Troubleshooting HTTP 429 (`rate_limit_exceeded`)

This **429** is from **this app’s** per-IP guard on `POST /api/analyze-ui`, not Model Studio’s upstream quota (those usually surface as 5xx or provider error bodies after the route accepts the request).

| Symptom | Likely cause | What to do |
|---------|--------------|------------|
| UI shows rate-limit message after many **Analyze** clicks | Exceeded `ANALYZE_UI_RATE_LIMIT_MAX` in the current window | Wait for **`Retry-After`** seconds (response header), then retry |
| `curl` returns 429 with `"code":"rate_limit_exceeded"` | Same — live flag on, rapid requests from one IP | Raise limit on **Preview only** or slow down rehearsal traffic |
| 429 on first request after idle | Unlikely app limit — check browser extensions / shared NAT rehearsing from one IP | Lower concurrent testers; inspect `X-RateLimit-Limit` |
| Demo host, no live flag | App should **not** rate-limit this route | If you see 429, confirm `GET /api/health` → `liveAnalysisEnabled: false` |

**Verify with curl** (preview URL, live enabled):

```bash
curl -sS -D - -o /dev/null -X POST "https://<preview-host>/api/analyze-ui" \
  -H "Content-Type: application/json" \
  -d "{}"
# First calls: 400 (validation). After exceeding limit: 429 + Retry-After + X-RateLimit-Limit
```

**Preview-only relief** (Vercel → Preview scope → redeploy):

```bash
ANALYZE_UI_RATE_LIMIT_MAX=24
ANALYZE_UI_RATE_LIMIT_WINDOW_MS=60000
```

Do **not** raise limits on **Production** until you intentionally run Stage C and accept abuse risk. For meetup/demo production, keep live off — no rate limit applies.

**Serverless caveat:** limits are **per warm instance**; heavy parallel traffic from many users can still spike Model Studio quota even when 429s are rare.

See also **[TROUBLESHOOTING_RUNBOOK.md](./TROUBLESHOOTING_RUNBOOK.md)** § live / 429.

## Pre-promote gate: `validate:prod` and `deploy:env:live`

After `vercel env pull` (or with CI secrets loaded), confirm **platform ops** vars match the matrix above:

```bash
npm run validate:prod
# Preview rehearsal with live + optional Sentry:
npm run validate:prod:preview
```

**Production validator (`validate:prod`)** — exit `0` when:

- `KV_REST_API_URL` + `KV_REST_API_TOKEN` set
- `GITHUB_TOKEN` set
- Live Qwen **demo-safe** (`QWEN_LIVE_ANALYSIS` unset/false)
- If `NEXT_PUBLIC_ERROR_MONITORING_ENABLED=true` (with observability master): valid `NEXT_PUBLIC_SENTRY_DSN`

**Preview validator (`validate:prod:preview`)** — KV/gist warnings only; when live flag is on, requires the live trio from `deploy:env:live`.

When promoting **live** Qwen (Preview Stage A+), run in the same shell or CI job:

```bash
npm run deploy:env:live
# equivalent: node scripts/validate-deploy-env.mjs --target=live
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

### Validation log (2026-06-05, Lane 4)

Ran locally on `qwen-ui-lab` (no production Vercel changes):

| Command | Exit | Summary |
|---------|------|---------|
| `npm run deploy:env:demo` (clean env) | `0` | `Live analysis requested: no`, `Live calls executable: no` |
| `npm run deploy:env:live` (clean env) | `1` | Errors: missing `QWEN_LIVE_ANALYSIS`, `DASHSCOPE_API_KEY`, `QWEN_MODEL` |
| `npm run deploy:env:live` (mock: `QWEN_LIVE_ANALYSIS=true`, `DASHSCOPE_API_KEY=sk-mock-validation-only`, `QWEN_MODEL=qwen3-vl-plus`) | `0` | `Live analysis requested: yes`, `Live calls executable: yes` |
| `npm run deploy:env:demo` with `QWEN_LIVE_ANALYSIS=true` | `1` | Demo gate blocks live flag |
| `DEPLOY_URL=https://qwen-ui-lab.vercel.app npm run smoke:deploy` | `0` | `provider=demo`, `liveAnalysisEnabled=false` (production stays demo-safe) |
| `EXPECT_LIVE_ANALYSIS=true` + same production URL | `1` | Health mismatch — confirms live smoke detects demo rollback state |
| `npm run smoke:staged` | — | Requires `DEPLOY_URL` or `--url=`; use on Preview after live env |

## Staged rollout

1. **Stage A — Preview**
   - [ ] Set live env vars on **preview** environment only
   - [ ] `npm run deploy:env:live` in pipeline or locally with preview secrets
   - [ ] Deploy preview build
   - [ ] Demo baseline on preview (if env not yet live): `DEPLOY_URL=<preview-url> npm run smoke:deploy`
   - [ ] **Staged live smoke** (after live env on preview):
     ```bash
     DEPLOY_URL=https://<preview-url> npm run smoke:staged
     # aliases: npm run smoke:live
     # equivalent: EXPECT_LIVE_ANALYSIS=true DEPLOY_URL=https://<preview-url> npm run smoke:deploy
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

Use **`npm run smoke:staged`** (alias **`smoke:live`**) on preview or staging only until production is intentionally live:

```bash
DEPLOY_URL=https://<preview-or-staging-host> npm run smoke:staged
# or:
npm run smoke:live -- --url=https://<preview-or-staging-host>
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
   DEPLOY_URL=https://<host> npm run smoke:staged
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
