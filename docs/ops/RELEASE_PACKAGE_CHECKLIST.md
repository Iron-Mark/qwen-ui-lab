# Release Package Checklist (No Push/Tag)

This checklist prepares a release candidate without publishing.

## Recommended version/tag

- Current package version: `0.2.0`
- Recommendation: use `0.2.0` for the offline pixel-signal analysis feature release.
- Recommended tag: `v0.2.0`
- Next planned version after this release:
  - `0.2.1` for follow-up fixes/docs-only cleanup
  - `0.3.0` for the next net-new user-facing capability

## Packaging readiness checklist

- [ ] `docs/ops/RELEASE_NOTES_DRAFT.md` finalized for current scope.
- [ ] `docs/ops/DEPLOYMENT_CHECKLIST.md` and `docs/ops/ROLLBACK_CHECKLIST.md` reviewed.
- [ ] README release/CI references aligned with `.github/workflows`.
- [ ] Version in `package.json` matches intended release tag.
- [ ] Local verification complete (`check`, `build`, `test:e2e`, `doctor`).

## Current release readiness snapshot

- Scope: offline canvas pixel inspection for unknown screenshot uploads, with signal-aware fallback artifacts.
- Local health: `npm run check:full`, `npx tsc --noEmit`, and `npm run test:e2e:pr-smoke` pass.
- Fixture health: `npm run export:demo-fixtures` runs without required content changes.
- Production policy: public demo remains provider-safe by default; live Qwen still requires explicit opt-in.

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
git tag -a v0.2.0 -m "Release v0.2.0"
git push origin HEAD
git push origin v0.2.0
```

## Optional GitHub release command

```bash
gh release create v0.2.0 --title "qwen-ui-lab v0.2.0" --notes-file docs/ops/RELEASE_NOTES_DRAFT.md
```
