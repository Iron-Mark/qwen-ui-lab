# Contributing to qwen-ui-lab

Thanks for contributing. This guide is for fast onboarding and low-risk handoff.

## Quick Start

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Core Commands

- `npm run dev` - start local Next.js app.
- `npm test` - run Node test suite in `tests/*.test.mjs`.
- `npm run lint` - run ESLint.
- `npm run build` - production build check.
- `npm run test:e2e` - Playwright smoke tests.
- `npm run doctor` - checks deps, env, sample tests, and optional live API ping.

## Demo vs Live Analysis (Important)

`qwen-ui-lab` defaults to offline demo behavior.

- Demo mode (default): no upstream Qwen call.
- Live mode (opt-in): requires API key **and** live toggle.

Use live mode only when intentionally testing real provider behavior:

```bash
DASHSCOPE_API_KEY=<your-key>
QWEN_LIVE_ANALYSIS=true
QWEN_MODEL=qwen3-vl-plus
QWEN_BASE_URL=https://dashscope-intl.aliyuncs.com/compatible-mode/v1
```

Notes:
- `USE_LIVE_QWEN=1` is also accepted as a live toggle alias.
- API key alone does not enable live calls.
- Keep API keys server-side only (`.env.local`, never `NEXT_PUBLIC_*`).

## Routes and App Surfaces

- `/` - dashboard + upload/analyze/generate flow.
- `/design-system` - atomic catalog, domain and level filters, snippet export.
- `/design-system/uilaws` - redirects to `/design-system?domain=uilaws`.
- `/design-system/laws-of-ux` - redirects to `/design-system?domain=laws-of-ux`.
- `/api/health` - reports provider status and live-analysis readiness.
- `/api/analyze-ui` - accepts screenshot payload and returns analysis artifact.
- `not-found` UI handles unknown routes with navigation back to known pages.

## Testing Expectations Before Handoff

Run these before opening or updating a PR:

```bash
npm test
npm run lint
npm run build
```

Then run:

```bash
npm run test:e2e
```

`test:e2e` is expected to stay offline-safe: Playwright clears live env vars and mocks health/analyze responses.

## Contribution Scope Guidance

- Keep changes focused and reviewable.
- Do not silently change provider-mode semantics (demo default + explicit live opt-in).
- Update docs when scripts, routes, or behavior change.
- Prefer extending existing architecture patterns:
  - page routes under `src/app`
  - API handlers under `src/app/api`
  - UI composition under `src/components` tiers
  - flow and provider logic in `src/lib`

## Typical Change Workflow

1. Create branch from latest default branch.
2. Implement small focused change.
3. Run local checks (`npm run check`, then `npm run build` for runtime-impacting changes).
4. Update docs for any changed runtime behavior.
5. Open PR with:
   - What changed
   - Why it changed
   - How it was validated
   - Demo/live mode impact (if any)

## Pull Requests and Issues

- Use `.github/PULL_REQUEST_TEMPLATE.md` for consistent PR context and validation.
- Use issue forms under `.github/ISSUE_TEMPLATE/` to keep bug reports and features triage-ready.
- Optional ownership map: copy `.github/CODEOWNERS.example` to `.github/CODEOWNERS` and replace placeholder teams/users.

## Commit Guidance

Keep commit messages short, scoped, and action-oriented:

- `feat:` for new user-facing behavior.
- `fix:` for bug fixes/regressions.
- `docs:` for documentation-only updates.
- `chore:` for maintenance or tooling changes.
- `refactor:` for internal structure changes without behavior change.

Examples:

- `feat: add issue forms for triage consistency`
- `chore: add optional local pre-commit checks`
- `docs: clarify release verification checklist`

Prefer one logical change per commit; avoid mixing behavior and broad formatting updates.

## Optional Local Pre-Commit Checks

This repo includes an opt-in hook at `.githooks/pre-commit` that runs `npm run check`.

Enable once locally:

```bash
git config core.hooksPath .githooks
```

Disable later:

```bash
git config --unset core.hooksPath
```

This is intentionally optional to avoid disrupting contributor workflows.

## Troubleshooting

See `docs/TROUBLESHOOTING_RUNBOOK.md` for common local, env, and runtime incidents.
