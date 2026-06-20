# Release Package Checklist (No Push/Tag)

This checklist prepares a release candidate without publishing.

## Recommended version/tag

- Current package version: `0.1.0`
- Recommendation: use `0.1.1` for the current maintenance release candidate if publishing branch/CI/lint cleanup.
- Recommended tag: `v0.1.1`
- Next planned version after first public release:
  - `0.1.2` for follow-up fixes/docs-only cleanup
  - `0.2.0` for net-new user-facing capability

## Packaging readiness checklist

- [ ] `docs/ops/RELEASE_NOTES_DRAFT.md` finalized for current scope.
- [ ] `docs/ops/DEPLOYMENT_CHECKLIST.md` and `docs/ops/ROLLBACK_CHECKLIST.md` reviewed.
- [ ] README release/CI references aligned with `.github/workflows`.
- [ ] Version in `package.json` matches intended release tag.
- [ ] Local verification complete (`check`, `build`, `test:e2e`, `doctor`).

## Current maintenance readiness snapshot

- Branch consolidation: remote `main` is the only active repository branch after stale branch cleanup.
- CI health: latest observed `main` CI run passed after platform-specific visual baselines and warn-only live LCP telemetry.
- Lint health: current cleanup removes all ESLint warnings.
- Production demo: `https://qwen-ui-lab.vercel.app` smokes green in demo mode.
- Production env gap: Vercel currently has no project env vars configured, so full `validate:prod` remains blocked until KV and server-side Gist token are added.

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
git tag -a v0.1.1 -m "Release v0.1.1"
git push origin HEAD
git push origin v0.1.1
```

## Optional GitHub release command

```bash
gh release create v0.1.1 --title "qwen-ui-lab v0.1.1" --notes-file docs/ops/RELEASE_NOTES_DRAFT.md
```
