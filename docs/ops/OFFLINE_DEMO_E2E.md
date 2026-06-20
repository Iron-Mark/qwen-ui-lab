# Offline Demo and E2E Strategy

This document explains how **qwen-ui-lab** delivers a reliable demo and test suite **without Qwen, AI, or paid APIs**. Presenters and contributors can use it as a reference for meetups and CI.

## Three-layer guarantee

### Layer 1 — Runtime defaults

- Live Qwen is **opt-in only** via `QWEN_LIVE_ANALYSIS=true` (or `USE_LIVE_QWEN=1`). An API key alone does **not** enable upstream calls.
- `GET /api/health` reports `provider: "demo"` and `liveAnalysisEnabled: false` when live mode is off.
- Server-side analyze route returns a deterministic demo payload when live is disabled (`buildDemoAnalyzeResponse` in `src/features/analysis/lib/qwen-analyze.mjs`).

### Layer 2 — Deterministic offline algorithm

When live analysis is disabled, the client **skips** `POST /api/analyze-ui` and builds an artifact locally:

1. `fetchAnalyzeHealth()` reads `/api/health`.
2. If `liveAnalysisEnabled` is false, `postAnalyzeUi()` calls `resolveAnalyzeOutcome()` with `instantDemo: true`.
3. `buildUiFlowArtifact()` in `src/features/analysis/lib/ui-flow.mjs` delegates to `src/features/analysis/lib/offline-analyze.mjs`:
   - **Canvas pixel inspection** - browser uploads are sampled locally with `getImageData()` to extract palette, contrast, edge density, layout bands, connected regions, design tokens, and dense-cluster risk before any provider call.
   - **Known sample registry** — bundled files like `dashboard-reference.svg` get rich, meetup-ready content.
   - **Advanced classifier** — weighted archetype scoring (dashboard, auth, mobile, settings, landing, ecommerce) using filename keywords, MIME hints, and width/height form-factor boosts.
   - **Confidence summary** — each unknown upload gets a deterministic layout label and confidence score in the artifact summary.

Same input → same output → stable E2E assertions. No ML required.

## Advanced offline algorithm

Implemented in [`src/features/analysis/lib/offline-analyze.mjs`](../../src/features/analysis/lib/offline-analyze.mjs):

| Stage | What it does |
|-------|----------------|
| **Registry lookup** | Exact match on normalized filename (e.g. `dashboard-reference.svg`) → curated plan, stats, and code |
| **Archetype scoring** | Weighted keywords per layout type; highest score wins |
| **Form-factor boost** | Width/height adds mobile/tablet/desktop signals (e.g. 390px wide → mobile boost) |
| **MIME hint** | Optional small boost (e.g. SVG → dashboard) |
| **Pixel signal scan** | `src/features/analysis/lib/offline-image-inspection.mjs` samples canvas pixels, quantizes dominant colors, computes WCAG-style contrast, estimates edge density, and maps active cells on a 12x8 layout grid |
| **Otsu thresholding** | A luminance histogram separates likely foreground from dominant surfaces without a fixed magic threshold |
| **Connected regions** | Active grid cells are grouped into deterministic regions and labeled as header/nav, side rail, bottom nav, content panel, media/chart, text/list, or control cluster |
| **Design tokens** | Local palette and contrast signals produce surface, foreground, accent, muted, border, spacing, and radius recommendations |
| **Signal-aware output** | Unknown uploads receive `Local Vision Signals`, `Detected Structure`, `Design Tokens`, and `Local Quality Checks` plan cards plus regions/controls/density/contrast preview stats |
| **Code templates** | Per-archetype generated React scaffold (`GeneratedDashboard`, `GeneratedAuthScreen`, etc.) |
| **Confidence** | `0.55–0.98` based on score margin; surfaced in artifact `summary` |

Example: `pricing-landing-hero.png` → Marketing landing archetype with `GeneratedLanding` code.  
Example: `dashboard-reference.svg` → registry override with ChartPreview + ActivityList.

Unit coverage: [`tests/offline-analyze.test.mjs`](../../tests/offline-analyze.test.mjs), including WCAG contrast math and no-provider pixel-signal artifacts.

Reference basis:

- Canvas pixel reads use the browser Canvas 2D `getImageData()` API.
- Contrast estimates use the WCAG relative luminance and contrast-ratio model.
- Thresholding follows Otsu's between-class variance method on the sampled luminance histogram.
- Region labeling uses connected-component analysis on the active layout grid.
- Target-size guidance follows WCAG target-size checks as a heuristic prompt for manual review; screenshots cannot prove CSS hit-area size by themselves.

### Layer 3 — E2E isolation (Playwright)

End-to-end tests never depend on secrets or external APIs:

| Mechanism | Location | Purpose |
|-----------|----------|---------|
| Route mock | `e2e/helpers/mock-analyze-api.ts` | Forces demo health response; safety net on `/api/analyze-ui` |
| Shared fixtures | `e2e/fixtures/demo-responses.json` | Generated from `src/features/analysis/lib/demo-fixtures.mjs` — same payloads as runtime |
| Env scrubbing | `playwright.config.ts` | Strips `DASHSCOPE_API_KEY`, `QWEN_LIVE_ANALYSIS`, etc. from dev server |
| Clipboard stub | `stubClipboardForE2E()` | Headless Copy/Export works without native clipboard |
| Unit mocks | `tests/analyze-fallback.test.mjs` | Injects `fetchFn` — same contract without a browser |
| Live contract (unit) | `tests/analyze-live-contract.test.mjs` | `fetchFn` mocks upstream Qwen JSON → structured artifact |
| Live contract (E2E) | `e2e/live-qwen-contract.spec.ts` | `page.route` on health + `/api/analyze-ui` — no API key in CI |

Regenerate E2E JSON after changing demo fixtures:

```bash
npm run export:demo-fixtures
```

## Client analyze flow

```text
Upload → GET /api/health
           ├─ liveAnalysisEnabled: false → buildUiFlowArtifact (instant, no POST)
           └─ liveAnalysisEnabled: true  → POST /api/analyze-ui → Qwen or fallback
```

Contract tests in `e2e/offline-demo-contract.spec.ts` assert that **zero** `POST /api/analyze-ui` requests occur when health returns demo mode.

Live-path contract tests (`tests/analyze-live-contract.test.mjs`, `e2e/live-qwen-contract.spec.ts`) use shared fixtures in `src/features/analysis/lib/qwen-mock-fixtures.mjs` (exported to `e2e/fixtures/live-qwen-responses.json`). They assert that when live mode is enabled, analyze returns a structured artifact from valid mocked JSON — never real DashScope credentials.

Visual baselines live in `e2e/visual-regression.spec.ts`. CI runs this spec on every `main` push (`visual-regression` job in `.github/workflows/ci.yml`); see **[CI.md](./CI.md)**. Create or refresh snapshots with:

```bash
npx playwright test e2e/visual-regression.spec.ts --update-snapshots
# or
npm run test:e2e:visual
```

## What to run before a meetup

```bash
npm run check:full
npm run test:e2e
npm run export:demo-fixtures   # if you changed ui-flow or demo-fixtures
DEPLOY_URL=https://qwen-ui-lab.vercel.app npm run smoke:deploy
```

## What we deliberately avoid

- **MSW** — unnecessary; Node tests inject `fetchFn`, Playwright uses `page.route()`.
- **HAR replay** of real Qwen responses — brittle and secret-prone.
- **Paid visual or mock services** — Playwright built-in screenshots suffice for baselines.

## Related docs

- [CI.md](./CI.md) — GitHub Actions workflows (nightly E2E, visual gate, LCP budget)
- [DEMO.md](../DEMO.md) — live presentation script
- [ARCHITECTURE.md](../ARCHITECTURE.md) — full runtime map
- [POST_LAUNCH.md](./POST_LAUNCH.md) — operator checklist
