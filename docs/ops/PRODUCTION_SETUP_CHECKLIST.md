# Production Setup Checklist

Use this checklist before treating a deployment as production-ready.

## Required Runtime Checks

- `npm run check:full` passes locally or in CI.
- `npm run prod:readiness` passes against the production env.
- `/api/readiness` shows `Canonical site URL`, `Durable share links`, `GitHub Gist export`, and `GitHub repo export` as ready.
- `/api/health` reports `provider=demo` unless a staged live Qwen rollout is approved.
- The home page readiness panel shows only expected fallbacks.

## Required Secrets

Configure these as server-only environment variables:

- `KV_REST_API_URL`
- `KV_REST_API_TOKEN`
- `GITHUB_TOKEN`

Configure this public environment variable with the deployed HTTPS origin:

- `NEXT_PUBLIC_SITE_URL`

Live Qwen is optional and should remain off by default:

- `DASHSCOPE_API_KEY`
- `QWEN_LIVE_ANALYSIS=true`
- `QWEN_MODEL`
- `QWEN_BASE_URL`

Do not set `NEXT_PUBLIC_QWEN_API_KEY`.

## Release Smoke

After deploy:

```bash
DEPLOY_URL=https://qwen-ui-lab.vercel.app npm run smoke:deploy
SMOKE_GITHUB_REPORT=true DEPLOY_URL=https://qwen-ui-lab.vercel.app npm run smoke:deploy
```

Use `SMOKE_GITHUB_ISSUE=<number>` to comment on an existing tracking issue. Without an issue number, the smoke script creates a new GitHub issue when reporting is enabled.
