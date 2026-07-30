# Release Package Checklist

This checklist tracks the current release candidate and publish commands.

## Recommended version/tag

- Current package version: `0.4.1` (shipped as `v0.4.1`; bump to `0.4.2` before tagging).
- Recommendation: use `0.4.2` for the production readiness, terminology alignment, and E2E stability hardening release.
- Recommended tag: `v0.4.2`
- Next planned version after this release:
  - `0.4.3` for follow-up fixes/docs-only cleanup
  - `0.5.0` for the next net-new user-facing capability

## Packaging readiness checklist

- [ ] `docs/ops/RELEASE_NOTES_DRAFT.md` finalized for current scope.
- [ ] `docs/ops/DEPLOYMENT_CHECKLIST.md` and `docs/ops/ROLLBACK_CHECKLIST.md` reviewed for current commands.
- [ ] CI references aligned with `.github/workflows`.
- [ ] Version in `package.json` bumped to `0.4.2` to match the intended release tag.
- [ ] Local and PR verification complete for the release scope.

## Current release readiness snapshot

- Scope (in progress): production env readiness docs and `prod:readiness` gate, `--env-file` validation support, `dev` branch protection, the #52-#70 copy-refinement wave, sample-run/local-analysis terminology renames (#71), Linux visual baseline refresh (#72), export-package E2E copy alignment (#73), local env-file gitignore hardening (#74), `GITHUB_GIST_TOKEN` gist-export support (#75), real product screenshot archive with refreshed PWA manifest images (#76), and upload-flow E2E stabilization (#78).
- Release status: unreleased; `v0.4.1` shipped 2026-06-21 and its tag already exists on `main`.
- Verification status: run the pre-publish commands below on the final release-prep commit before tagging.
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

Run these after `main` contains the release-prep commit (with `package.json` at `0.4.2`):

```bash
git pull --ff-only
git push origin HEAD
git tag -a v0.4.2 -m "Release v0.4.2"
git push origin v0.4.2
```

## Optional GitHub release command

`docs/ops/RELEASE_NOTES_DRAFT.md` should hold only the in-progress section, but always extract the release's own section to a temp file so `--notes-file` never publishes unrelated draft content:

```bash
awk '/^## /{p = /^## qwen-ui-lab v0\.4\.2/} p' docs/ops/RELEASE_NOTES_DRAFT.md > /tmp/release-notes-v0.4.2.md
gh release create v0.4.2 --title "qwen-ui-lab v0.4.2" --notes-file /tmp/release-notes-v0.4.2.md
```
