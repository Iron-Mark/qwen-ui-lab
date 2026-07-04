# Release Package Checklist

This checklist tracks the current release candidate and publish commands.

## Recommended version/tag

- Current package version: `0.4.1`
- Recommendation: use `0.4.1` for the upload safety and CI runtime hardening release.
- Recommended tag: `v0.4.1`
- Next planned version after this release:
  - `0.4.2` for follow-up fixes/docs-only cleanup
  - `0.5.0` for the next net-new user-facing capability

## Packaging readiness checklist

- [x] `docs/ops/RELEASE_NOTES_DRAFT.md` finalized for current scope.
- [x] `docs/ops/DEPLOYMENT_CHECKLIST.md` and `docs/ops/ROLLBACK_CHECKLIST.md` reviewed for current commands.
- [x] CI references aligned with `.github/workflows`.
- [x] Version in `package.json` matches intended release tag.
- [x] Local and PR verification complete for the release scope.

## Current release readiness snapshot

- Scope: shared upload constraints, API request validation, localized oversized-upload feedback, PR upload-flow smoke coverage, and GitHub Actions Node 24 runtime modernization.
- PR health: PR #7 passed `Lint, test, build`, PR E2E smoke, and Vercel preview checks before merge.
- Release-prep health: `npm run check:full` passed with lint, unit tests, docs validation, and production build; E2E smoke, doctor, deploy-env, and whitespace checks were also verified for the release scope.
- Fixture health: no fixture regeneration required for upload validation or workflow changes.
- Production policy: public app remains local-analysis safe by default; live Qwen still requires explicit opt-in.

## Exact pre-publish commands

Run from repo root:

```bash
npm ci
npm run check:full
npm run test:e2e:pr-smoke
npm run doctor
git status
```

## Exact publish commands

Run these after `main` contains the release-prep commit:

```bash
git pull --ff-only
git push origin HEAD
git tag -a v0.4.1 -m "Release v0.4.1"
git push origin v0.4.1
```

## Optional GitHub release command

```bash
gh release create v0.4.1 --title "qwen-ui-lab v0.4.1" --notes-file docs/ops/RELEASE_NOTES_DRAFT.md
```
