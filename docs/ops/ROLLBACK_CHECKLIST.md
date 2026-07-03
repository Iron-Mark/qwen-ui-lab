# Rollback Checklist

Use this when a release introduces regression, downtime, or unacceptable risk.

## 1) Trigger criteria

- [ ] User-facing failure on `/` or design-system routes.
- [ ] `GET /api/health` degraded or failing unexpectedly.
- [ ] Analyze route (`POST /api/analyze-ui`) error rate spike.
- [ ] Severe performance, availability, or data-integrity concerns.

## 2) Immediate containment

- [ ] Announce incident channel and assign rollback owner.
- [ ] Freeze new deployments until rollback completes.
- [ ] Capture key evidence (error logs, timestamps, impacted routes).

## 3) Execute rollback

- [ ] Redeploy last known good release/tag.
- [ ] If needed, force safe mode by disabling live analysis (`QWEN_LIVE_ANALYSIS` unset/false).
- [ ] Verify deployment completes successfully.
- [ ] Capture rollback target (commit/tag and deploy ID) in incident notes.

## 4) Verify recovery

- [ ] `GET /api/health` returns `ok: true`.
- [ ] `/` loads and Analyze works in local-analysis mode at minimum.
- [ ] `/design-system`, `/design-system/laws-of-ux`, `/design-system/uilaws` load successfully.
- [ ] Critical smoke checks pass with no new high-severity errors.
- [ ] Run: `DEPLOY_URL=<rollback-url> npm run smoke:deploy`
- [ ] Run: `node scripts/synthetic-health-check.mjs --base-url <rollback-url> --attempts 5`

## 5) Roll-forward guard before unfreeze

- [ ] Confirm `npm run deploy:env:local` passes on release branch before re-opening deploys.
- [ ] If re-enabling live mode, verify `npm run deploy:env:live` passes in release pipeline env.

## 6) Closeout

- [ ] Post rollback summary with root-cause hypothesis and impact window.
- [ ] Open follow-up issue for permanent fix.
- [ ] Update `docs/ops/RELEASE_NOTES_DRAFT.md` with rollback note if release was withdrawn.
