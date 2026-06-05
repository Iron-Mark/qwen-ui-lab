# Performance tooling

Local scripts for bundle size and Lighthouse checks. CI still enforces a performance budget on `/` and `/design-system` (see `.github/workflows/ci.yml`).

## Bundle analysis (`@next/bundle-analyzer`)

Use this when adding heavy dependencies, changing dynamic imports, or tuning home below-the-fold deferrals.

1. From `qwen-ui-lab`, run:

   ```bash
   npm run analyze
   ```

2. The script sets `ANALYZE=true`, runs a production `next build`, then opens interactive treemaps for **client** and **server** bundles in your default browser.

3. Focus on:
   - Large modules pulled into the initial home route (hero + layout shell).
   - Chunks loaded only by `HomeBelowFoldClient` (`UploadFlow`, `DashboardShell`, chart libraries).
   - Duplicate chart stacks (`chart.js` vs `recharts`) if both appear in the same chunk.

4. After changes, re-run `npm run analyze` and compare treemap sizes. Analyzer output lives under `.next/` (gitignored).

**Manual equivalent** (any shell):

```bash
ANALYZE=true npm run build
```

On PowerShell: `$env:ANALYZE='true'; npm run build`

**Note:** Bundle analysis is dev-only tooling. It does not run in CI and does not affect E2E or PWA service-worker builds.

## Lighthouse (local)

Scripts in `scripts/perf-lighthouse.mjs` build production, start a ephemeral server, and write JSON under `.perf/` (gitignored).

| Script | Purpose |
|--------|---------|
| `npm run perf:lighthouse` | Latest report (`lighthouse-latest.json`) |
| `npm run perf:lighthouse:baseline` | Save baseline before a change |
| `npm run perf:lighthouse:after` | Save after change for comparison |

Optional env: `PERF_PORT` (default picks a free port in the 4300 range).

Use before/after perf-sensitive UI work (hero, deferrals, design-system catalog). Compare `categories.performance.score` and LCP-related audits between baseline and after files.

## CI performance budget

On pull requests, CI runs Lighthouse **performance-only** against production builds of:

- `/` (home)
- `/design-system`

Minimum score: **0.45** per route (see workflow for exact command). Failing the budget blocks merge; fix regressions or justify with measured bundle/Lighthouse diffs from the steps above.

## Related home optimizations

- Marketing hero and metadata render on the server (`src/app/page.tsx`, `HomeMarketingHero`).
- Upload flow and dashboard charts load via `next/dynamic` with `ssr: false` in `HomeBelowFoldClient`.
- `experimental.optimizePackageImports` in `next.config.ts` tree-shakes `lucide-react`, `recharts`, and `chart.js`.

See also [POST_LAUNCH.md](./POST_LAUNCH.md) for optional post-release perf checks.
