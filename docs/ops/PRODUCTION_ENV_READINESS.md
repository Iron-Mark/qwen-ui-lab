# Production Env Readiness

Use this runbook to make the production validation gate pass before a release. The public app remains local-analysis-first by default: production should not enable live Qwen unless a staged live rollout is intentionally approved.

## Required production variables

Set these production environment variables on the hosting provider:

| Variable | Required | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | yes | Public HTTPS origin for canonical metadata, sitemap, robots, PWA links, and generated short share URLs |
| `KV_REST_API_URL` | yes | Durable share links and cluster-wide analyze rate limits |
| `KV_REST_API_TOKEN` | yes | Server-only Upstash/Vercel KV REST token |
| `GITHUB_TOKEN` | yes | Server-side Gist/export flow |

Production must also keep these safe defaults:

| Variable | Production expectation |
| --- | --- |
| `QWEN_LIVE_ANALYSIS` / `USE_LIVE_QWEN` | unset or false |
| `NEXT_PUBLIC_QWEN_API_KEY` | never set |
| `DASHSCOPE_API_KEY` | optional only when live flag remains off |

Sentry is optional. If `NEXT_PUBLIC_OBSERVABILITY_ENABLED=true` and `NEXT_PUBLIC_ERROR_MONITORING_ENABLED=true`, then `NEXT_PUBLIC_SENTRY_DSN` must also be set.

## Vercel setup

Link the local checkout if needed:

```bash
vercel login
vercel link
```

Add production runtime values without printing secrets in the shell history:

```bash
vercel env add KV_REST_API_URL production
vercel env add KV_REST_API_TOKEN production
vercel env add GITHUB_TOKEN production
vercel env add NEXT_PUBLIC_SITE_URL production
```

Use a dedicated least-privilege token for `GITHUB_TOKEN`. Do not reuse a broad personal CLI token for production app runtime.
`NEXT_PUBLIC_SITE_URL` should be the exact deployed HTTPS origin, for example `https://qwen-ui-lab.vercel.app`. If you rely on Vercel's `VERCEL_PROJECT_PRODUCTION_URL`, the validator accepts that host as the fallback canonical source.

Optional Sentry production setup:

```bash
vercel env add NEXT_PUBLIC_OBSERVABILITY_ENABLED production
vercel env add NEXT_PUBLIC_ERROR_MONITORING_ENABLED production
vercel env add NEXT_PUBLIC_SENTRY_DSN production
vercel env add NEXT_PUBLIC_SENTRY_ENVIRONMENT production
```

## Local verification

If the host env is already loaded in the shell:

```bash
npm run prod:readiness
```

To validate a local private env file without printing secret values:

```bash
node scripts/validate-prod-env.mjs --target=production --env-file=.env.production.local
```

The command prints only whether required values are present and whether the policy passes. Do not commit `.env.production.local`.

## Release verification sequence

Before opening the `dev` -> `main` release PR:

```bash
npm run check:full
npm run test:e2e
npm run prod:readiness
npm run deploy:env:demo
```

After deployment:

```bash
DEPLOY_URL=https://qwen-ui-lab.vercel.app npm run smoke:deploy
node scripts/synthetic-health-check.mjs --base-url https://qwen-ui-lab.vercel.app --attempts 5
```

To publish smoke results to GitHub, set `SMOKE_GITHUB_REPORT=true` plus `SMOKE_GITHUB_REPOSITORY=owner/repo`. Add `SMOKE_GITHUB_ISSUE=<number>` to comment on an existing issue; otherwise the smoke script creates a new issue.

The app also exposes `/api/readiness` and an in-app Production readiness panel on the home page. Use it to confirm which production-facing features are live and which are intentionally running in fallback mode.

`npm run validate:prod` is expected to fail until `NEXT_PUBLIC_SITE_URL` or `VERCEL_PROJECT_PRODUCTION_URL`, `KV_REST_API_URL`, `KV_REST_API_TOKEN`, and `GITHUB_TOKEN` are configured in the environment being checked.
