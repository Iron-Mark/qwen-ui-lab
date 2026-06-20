# Release Process and Versioning

This project uses lightweight semantic versioning guidance with manual release artifacts.

## Versioning model

Current baseline is `0.1.0` in `package.json`.

Until `1.0.0`, use:

- `0.x+1.0` (minor bump): new features, notable UX additions, or route/API additions.
- `0.x.y+1` (patch bump): bug fixes, copy/docs updates, non-breaking refinements.
- Breaking changes are allowed in `0.x`, but still call them out clearly in release notes.

After `1.0.0`, follow standard semver expectations:

- `MAJOR` for breaking changes.
- `MINOR` for backward-compatible features.
- `PATCH` for backward-compatible fixes.

## Release artifacts

Each release should update or produce:

- `docs/ops/RELEASE_NOTES_DRAFT.md` (changelog-style release notes).
- `docs/ops/RELEASE_PACKAGE_CHECKLIST.md` (version/tag recommendation and command checklist).
- `docs/ops/DEPLOYMENT_CHECKLIST.md` (go-live checklist).
- `docs/ops/ROLLBACK_CHECKLIST.md` (rollback execution checklist).

## Standard release flow

1. Finalize scope and update release notes draft.
2. Run verification commands:
   - `npm run check`
   - `npm run build`
   - `npm run test:e2e`
   - `npm run doctor`
3. Confirm documented routes/APIs are still accurate:
   - Pages: `/`, `/design-system`, `/design-system/laws-of-ux`, `/design-system/uilaws`
   - APIs: `GET /api/health`, `POST /api/analyze-ui`, `POST /api/security/csp-report`
4. Deploy from approved release branch/tag.
5. Run post-deploy smoke checks and publish final release notes.

## Documentation guardrails

- Keep command examples aligned with `package.json` scripts only.
- Keep route references aligned with `src/app` pages and route handlers.
- Keep CI references aligned with existing workflow files in `.github/workflows`.

## Release and commit hygiene

- Keep PRs small enough to be reviewed in one sitting.
- Use the pull-request template to capture impact, validation, and rollback notes.
- Prefer conventional commit prefixes (`feat`, `fix`, `docs`, `chore`, `refactor`) for readable release notes.
- For hotfixes, call out rollback steps directly in the PR and release notes draft.
