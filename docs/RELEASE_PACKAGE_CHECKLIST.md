# Release Package Checklist (No Push/Tag)

This checklist prepares a release candidate without publishing.

## Recommended version/tag

- Current package version: `0.1.0`
- Recommendation: keep `0.1.0` for first public baseline release tag.
- Recommended tag: `v0.1.0`
- Next planned version after first public release:
  - `0.1.1` for fixes/docs-only follow-up
  - `0.2.0` for net-new user-facing capability

## Packaging readiness checklist

- [ ] `docs/RELEASE_NOTES_DRAFT.md` finalized for current scope.
- [ ] `docs/DEPLOYMENT_CHECKLIST.md` and `docs/ROLLBACK_CHECKLIST.md` reviewed.
- [ ] README release/CI references aligned with `.github/workflows`.
- [ ] Version in `package.json` matches intended release tag.
- [ ] Local verification complete (`check`, `build`, `test:e2e`, `doctor`).

## Exact pre-publish commands

Run from repo root:

```bash
npm ci
npm run check
npm run build
npm run test:e2e
npm run doctor
git status
```

## Exact publish commands (manual approval required)

Do not run these until publish is explicitly approved:

```bash
git pull --ff-only
git tag -a v0.1.0 -m "Release v0.1.0"
git push origin HEAD
git push origin v0.1.0
```

## Optional GitHub release command

```bash
gh release create v0.1.0 --title "qwen-ui-lab v0.1.0" --notes-file docs/RELEASE_NOTES_DRAFT.md
```
