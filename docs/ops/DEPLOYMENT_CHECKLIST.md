# Deployment Checklist

Use this checklist for production releases of `qwen-ui-lab` (Vercel-first, portable to Netlify/Render/Fly.io with equivalent settings).

## 1) Pre-deploy validation

- [ ] Working tree is clean (no accidental local changes, no secrets staged).
- [ ] Release branch model is correct: work was integrated on `dev`, then promoted through a `dev` -> `main` PR.
- [ ] Release tag, if any, points to a commit already on `main`.
- [ ] Version and release notes are updated (`package.json`, `docs/ops/RELEASE_NOTES_DRAFT.md`).
- [ ] Install dependencies: `npm ci`.
- [ ] No concurrent `next build` is running in another terminal/session.
- [ ] Lint passes: `npm run lint`.
- [ ] Unit tests pass: `npm test`.
- [ ] Production build passes: `npm run build`.
- [ ] E2E smoke passes: `npm run test:e2e`.
- [ ] Doctor checks pass (or understood exceptions): `npm run doctor`.

## 2) Deploy env policy validation

- [ ] Validate demo-safe defaults (recommended): `npm run deploy:env:demo`
- [ ] With production secrets loaded: `npm run validate:prod` (KV, gist, Sentry policy, demo-safe live)
- [ ] Current public demo exception: if Vercel has no env vars configured, `validate:prod` fails on missing KV and `GITHUB_TOKEN`; this is acceptable only for offline-demo operation where durable share links and server-side Gist export are not required.
- [ ] For live rollout only: `npm run deploy:env:live` (see **[docs/ops/LIVE_QWEN_ROLLOUT.md](./LIVE_QWEN_ROLLOUT.md)**)
- [ ] `NEXT_PUBLIC_QWEN_API_KEY` is not set.
- [ ] Runtime secrets stay server-only (no `NEXT_PUBLIC_*` prefix for secrets).

## 3) Staged rollout checklist

- [ ] **Stage A (preview)**: deploy to preview URL and run smoke checks.
- [ ] **Stage B (limited live traffic/internal)**: enable `QWEN_LIVE_ANALYSIS=true` only when intended and monitored.
- [ ] **Stage C (full production)**: expand rollout after stable smoke + no regression window.
- [ ] Keep rollback owner on-call for at least first hour.

## 4) Deploy execution

- [ ] Trigger deploy from the approved `main` commit or release tag.
- [ ] Confirm build logs show successful Next.js compile/startup.
- [ ] Confirm no missing dependency/runtime errors.

## 5) Post-deploy smoke checks

- [ ] Automated workflow run succeeded: `.github/workflows/post-deploy-smoke.yml`
- [ ] Or manual smoke succeeded:
  - [ ] `DEPLOY_URL=<deployed-url> npm run smoke:deploy`
  - [ ] Optional live expectation: `EXPECT_LIVE_ANALYSIS=true DEPLOY_URL=<deployed-url> npm run smoke:deploy`
- [ ] `GET /api/health` mode matches rollout intent (demo by default unless explicit live rollout).
- [ ] `/`, `/design-system`, `/design-system/laws-of-ux`, `/design-system/uilaws`, `robots.txt`, and `sitemap.xml` are healthy.
- [ ] Optional latency probe for sign-off: `node scripts/synthetic-health-check.mjs --base-url <deployed-url> --attempts 5`.
- [ ] Optional production LCP telemetry: `npm run perf:lcp-budget` or CI `Production LCP budget`. This is warn-only by default because live network/CDN variance can spike; set Vercel/GitHub repository variable `PERF_LCP_STRICT=true` only when you want this to block CI.

## 6) Staging drill simulation (no real deploy)

Use this sequence to rehearse the lane against a staging URL or active local server:

- [ ] `npm run deploy:env:demo`
- [ ] `DEPLOY_URL=<staging-or-local-url> npm run smoke:deploy`
- [ ] `node scripts/synthetic-health-check.mjs --base-url <staging-or-local-url> --attempts 3`
- [ ] For live rehearsal only (with live env set): `EXPECT_LIVE_ANALYSIS=true DEPLOY_URL=<url> npm run smoke:deploy`

## 7) Release communication

- [ ] Publish release note summary from `docs/ops/RELEASE_NOTES_DRAFT.md`.
- [ ] Share rollback owner/on-call and monitoring channel.
- [ ] Include warning/critical event notes from `docs/ops/RELIABILITY_OPS.md`.
