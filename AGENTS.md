# AGENTS.md — working in this repository

Instructions for any AI coding agent (Codex, Claude Code, Cursor, Copilot,
Gemini CLI, …). Read this before making changes.

## What this repo is

`qwen-ui-lab` — a Next.js app that turns UI screenshots into inspectable
React + Tailwind **export packages**. Upload a screenshot → inspect detected
structure → correct detection boxes → preview a component draft → download a
multi-file export package, or send it to a Gist / repo compare URL.

**Local (heuristic) analysis is the default and needs no paid vision
provider.** Live Qwen vision is opt-in and requires *both*
`DASHSCOPE_API_KEY` and `QWEN_LIVE_ANALYSIS=true`. An API key alone does not
enable upstream calls. Never expose provider secrets through `NEXT_PUBLIC_*`.

> The Next.js version here has breaking changes versus most training data.
> Read the relevant guide in `node_modules/next/dist/docs/` before writing
> framework code. See also `docs/AGENTS.md`.

## Identity — read this first

`gh` on the maintainer's machine silently flips to a secondary work account.
**Confirm before any push, merge, or API write:**

```sh
gh auth status
gh auth switch --user Iron-Mark   # if it is not already Iron-Mark
```

A CI check named **`identity-guard`** fails any PR whose commits carry a
forbidden identity in the author, committer, or a
`Co-authored-by:`/`Signed-off-by:` trailer. Its pattern lives in the
`IDENTITY_GUARD_PATTERN` secret — **never put identity values in repo content,
workflow files, docs, or PR bodies.**

**Never add AI attribution or co-authorship trailers to commits or PRs.**

## Branch flow

`feature → dev → main`, **squash merges**. Checks on PRs: `PR Checks`
(lint / test / validate:docs / build) and `PR E2E Smoke`
(`npm run test:e2e:pr-smoke`, chromium). Full CI (`ci.yml`) — security audit,
quality, web audits, visual regression, LCP budget — runs on push to `main`,
**not** on PRs.

Because merges are squashed, **`dev` accumulates commits `main` will never
have.** Ahead/behind counts and `gh api .../compare/main...dev` file lists are
misleading. Compare trees instead:

```sh
gh api repos/Iron-Mark/qwen-ui-lab/commits/main --jq '.commit.tree.sha'
gh api repos/Iron-Mark/qwen-ui-lab/commits/dev  --jq '.commit.tree.sha'
```

Equal hashes mean the branches agree.

## Verify before you claim

```sh
npm run check          # lint + unit tests (node --test)
npm run validate:docs  # local Markdown links
npm run build          # production build
```

`npm run check:full` adds screenshot-archive validation and the build.
Browser-facing changes: `npm run test:e2e`, `test:e2e:visual`, `test:e2e:pwa`.

## Product copy is enforced by tests

`src/lib/product-labels.mjs` holds banned internal labels, and
`tests/public-copy-guardrail.test.mjs` fails the build if public copy uses
them. Notably:

- The canonical term is **"export package"** in *sentence case*. Title-Case
  "Export Package" is itself a banned string.
- Legacy terms are rejected: "starter package", "generated scaffold", "bundle"
  / "handoff bundle", "project handoff", "demo"/"mock"/"stub" phrasing.
- The same test **parses backticked paths in `docs/specs/ARTIFACT_CHECKLIST.md`
  and asserts each file exists**, and requires every `docs/specs/*.md` to be
  listed in `PUBLIC_COPY_FILES`. Moving or deleting those files breaks
  `npm test` unless you update the test together.

Run `npm test` after touching any user-visible string or any file under
`docs/specs/`.

## Known accepted exception

**brace-expansion / GHSA-mh99-v99m-4gvg.** The advisory flags every version
≤5.0.7 including the 1.x line, which has **no patched release**. Forcing 5.x
globally breaks eslint (verified crash in `minimatch@3`); eslint 10 would fix
it but is blocked by `eslint-plugin-react` peering at `^9.7` max. The remaining
instances are dev-graph only and the CI security job audits `--omit=dev`.
Revisit when either upstream unblocks. Do not "fix" this by force-overriding
the major — it breaks lint.

## Housekeeping

- Do not delete-and-reinstall `node_modules` as "cleanup".
- Refresh committed screenshots from a **production** preview
  (`npm run build && npm run start -- -p 3001`, then
  `npm run capture:screenshots -- --base-url http://localhost:3001`) so no dev
  chrome, toasts, or local paths leak into the archive.
