# Release Package Checklist (No Push/Tag)

This checklist prepares a release candidate without publishing.

## Recommended version/tag

- Current package version: `0.3.0`
- Recommendation: use `0.3.0` for the offline connected-region and design-token analysis release.
- Recommended tag: `v0.3.0`
- Next planned version after this release:
  - `0.3.1` for follow-up fixes/docs-only cleanup
  - `0.4.0` for the next net-new user-facing capability

## Packaging readiness checklist

- [ ] `docs/ops/RELEASE_NOTES_DRAFT.md` finalized for current scope.
- [ ] `docs/ops/DEPLOYMENT_CHECKLIST.md` and `docs/ops/ROLLBACK_CHECKLIST.md` reviewed.
- [ ] README release/CI references aligned with `.github/workflows`.
- [ ] Version in `package.json` matches intended release tag.
- [ ] Local verification complete (`check`, `build`, `test:e2e`, `doctor`).

## Current release readiness snapshot

- Scope: expanded offline canvas pixel inspection with Otsu thresholding, connected-region labels, design-token recommendations, and richer fallback plan cards.
- Local health: `npm audit --omit=dev --audit-level=high`, `npm run check:full`, `npm run test:e2e`, `npm run doctor`, and `git diff --check` pass.
- Fixture health: no fixture regeneration required for the deterministic inspection update.
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
git tag -a v0.3.0 -m "Release v0.3.0"
git push origin HEAD
git push origin v0.3.0
```

## Optional GitHub release command

```bash
gh release create v0.3.0 --title "qwen-ui-lab v0.3.0" --notes-file docs/ops/RELEASE_NOTES_DRAFT.md
```
