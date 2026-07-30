# Release Notes Draft

This file holds only the draft for the next unreleased version. Notes for shipped versions live on [GitHub Releases](https://github.com/Iron-Mark/qwen-ui-lab/releases).

## qwen-ui-lab v0.4.2 (draft)

Release date: TBD

Patch hardening release in progress for production readiness, branch governance, terminology alignment, and E2E stability.

### In progress

- Added explicit production env readiness docs for required KV, Gist, local-analysis live gating, and optional Sentry configuration.
- Added `--env-file` support to `scripts/validate-prod-env.mjs` so private production env files can be validated locally without printing secret values.
- Added `npm run prod:readiness` as the production env gate alias.
- Protected `dev` against force pushes and branch deletion while keeping it lightweight for normal integration work.
- Reframed account/profile internals around browser-local contact labels and preserved legacy pending-session compatibility.
- Tightened export-package, fallback, and review copy across public surfaces, including the Chinese dictionary, so public flows stay workflow-first (#52-#70 copy wave).
- Renamed specs, fixtures, scripts, and docs to sample-run and local-analysis terminology, retiring legacy internal naming (#71); docs moved to `LOCAL_ANALYSIS_E2E.md`, `PRODUCT_MEDIA.md`, and `PRODUCT_WALKTHROUGH_SCRIPT.md`.
- Refreshed Linux visual regression baselines (#72).
- Aligned E2E assertions with the export package copy used in the UI and metadata (#73).
- Ignored local env files in git so private configuration stays untracked (#74).
- Added app-specific `GITHUB_GIST_TOKEN` support for Gist export, preferred over `GITHUB_TOKEN` when both are set (#75).
- Added a real product screenshot archive and refreshed the PWA manifest images to use those captures (#76).
- Stabilized the upload-flow E2E suite around actual export behavior: repo export opens a GitHub compare URL, and only Gist and ZIP exports download files (#78).
- Hardened PWA production E2E startup to launch Next directly through Node and added regression coverage for the no-shell path.
