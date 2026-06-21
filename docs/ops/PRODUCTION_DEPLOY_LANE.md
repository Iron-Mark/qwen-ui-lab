# Production Deploy Lane (Vercel-first)

This lane standardizes production deployment for `qwen-ui-lab` with safe demo defaults, explicit live opt-in, and automated post-deploy smoke checks.

Production branch policy:

- Build normal changes on `dev`.
- Promote production through a protected `dev` -> `main` PR.
- Treat `main` as the production branch.
- Create release tags only from `main` commits.

## Deploy modes

- **Demo-safe (default):** no live Qwen dependency. `QWEN_LIVE_ANALYSIS` remains unset/false, even if `DASHSCOPE_API_KEY` exists.
- **Live (opt-in):** requires `DASHSCOPE_API_KEY` + `QWEN_LIVE_ANALYSIS=true` (or `USE_LIVE_QWEN=1`), and should be rolled out in stages.

## Required checks before production

Run:

```bash
npm run lint
npm test
npm run build
npm run deploy:env:demo   # default policy gate
```

For a planned live rollout:

```bash
npm run deploy:env:live
```

Step-by-step checklist, smoke expectations, and rollback: **[docs/ops/LIVE_QWEN_ROLLOUT.md](./LIVE_QWEN_ROLLOUT.md)**.

Production host env readiness: **[docs/ops/PRODUCTION_ENV_READINESS.md](./PRODUCTION_ENV_READINESS.md)**.

## Vercel-first setup

1. Keep project connected to Vercel with preview + production environments.
2. Set environment variables per environment:
   - Demo-safe: leave `QWEN_LIVE_ANALYSIS` unset.
   - Live: set `QWEN_LIVE_ANALYSIS=true`, `DASHSCOPE_API_KEY`, and optional `QWEN_MODEL`, `QWEN_BASE_URL`.
3. Never set any secret as `NEXT_PUBLIC_*`.
4. Trigger deploy from the approved `main` commit or release tag after CI passes.

## Common-hosting equivalents

- **Netlify:** use Environment Variables and Deploy Notifications; map smoke workflow input `deploy_url` to your Netlify site URL.
- **Render/Fly.io:** use service secrets for server-only values and trigger smoke workflow with deployed app URL.
- **Any host:** preserve the same env policy gate scripts (`deploy:env:demo` / `deploy:env:live`) and smoke command (`smoke:deploy`).

## Staged rollout plan (live mode)

1. **Stage A - Preview validation**
   - Deploy preview
   - Run `DEPLOY_URL=<preview-url> npm run smoke:deploy`
2. **Stage B - Limited live traffic/internal**
   - Enable live flag only for controlled audience
   - Run `EXPECT_LIVE_ANALYSIS=true DEPLOY_URL=<url> npm run smoke:deploy`
3. **Stage C - Full production**
   - Promote to full traffic after stability window
   - Keep rollback owner on-call for first hour

## Automated smoke hooks

- Workflow: `.github/workflows/post-deploy-smoke.yml`
  - Supports `workflow_dispatch` with explicit `deploy_url`
  - Supports `repository_dispatch` (`vercel-deployment-success`) for external webhook-driven hooks
- Script: `scripts/post-deploy-smoke.mjs`
  - Verifies `GET /api/health` mode and critical app routes/assets

## Failure policy

- Smoke failure blocks release sign-off.
- For live incidents, disable `QWEN_LIVE_ANALYSIS` first to return to demo-safe mode, then execute `docs/ops/ROLLBACK_CHECKLIST.md`.
