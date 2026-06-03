# qwen-ui-lab

An AI-assisted workflow for converting UI screenshots into React/Tailwind component scaffolds using Qwen3-VL and Qwen Code.

## Links

- Repository: [github.com/Iron-Mark/qwen-ui-lab](https://github.com/Iron-Mark/qwen-ui-lab)
- Live demo: [qwen-ui-lab.vercel.app](https://qwen-ui-lab.vercel.app)
- **[DEMO.md](./DEMO.md)** — live presentation script and pre-flight checklist
- **[CONTRIBUTING.md](./CONTRIBUTING.md)** — onboarding and contributor workflow
- **[docs/ARCHITECTURE_OVERVIEW.md](./docs/ARCHITECTURE_OVERVIEW.md)** — runtime architecture and boundaries
- **[docs/TROUBLESHOOTING_RUNBOOK.md](./docs/TROUBLESHOOTING_RUNBOOK.md)** — troubleshooting guide and operational runbook
- **[docs/RELIABILITY_OPS.md](./docs/RELIABILITY_OPS.md)** — synthetic checks, monitoring thresholds, and incident-response targets
- **[docs/ATOMIC_DESIGN.md](./docs/ATOMIC_DESIGN.md)** — folder tiers, catalog domains, how to add components
- **[docs/ANALYTICS_TAXONOMY.md](./docs/ANALYTICS_TAXONOMY.md)** — privacy-safe analytics taxonomy and setup
- **[docs/RELEASE_PROCESS.md](./docs/RELEASE_PROCESS.md)** — versioning, release flow, and release checklists
- **[docs/RELEASE_PACKAGE_CHECKLIST.md](./docs/RELEASE_PACKAGE_CHECKLIST.md)** — version/tag recommendation and exact release commands
- **[docs/PRODUCTION_DEPLOY_LANE.md](./docs/PRODUCTION_DEPLOY_LANE.md)** — production deploy lane, env policy gates, and smoke hooks
- **[docs/EXPERIMENTATION.md](./docs/EXPERIMENTATION.md)** — feature flags, A/B setup, and safe rollout checklist
- **[docs/POST_LAUNCH.md](./docs/POST_LAUNCH.md)** — post-launch checklist for demo operators (defaults, verification, CSP/analytics staging)
- **[.github/PULL_REQUEST_TEMPLATE.md](./.github/PULL_REQUEST_TEMPLATE.md)** — PR checklist for faster review
- **[.github/CODEOWNERS.example](./.github/CODEOWNERS.example)** — suggested ownership map template

## Goal

Test whether Qwen can help shorten the front-end workflow from visual reference to usable component structure.

## Architecture

```mermaid
flowchart TB
  subgraph client [Browser]
    Upload[UploadFlow]
    DS[Design system catalog]
    HealthCheck["GET /api/health"]
    Preprocess[Image preprocess]
  end

  subgraph server [Next.js server]
    AnalyzeRoute["POST /api/analyze-ui"]
    Qwen[Qwen3-VL vision API]
    Fallback[buildUiFlowArtifact]
  end

  Upload --> Preprocess
  Upload --> HealthCheck
  HealthCheck -->|demo mode| Fallback
  HealthCheck -->|QWEN_LIVE_ANALYSIS=true| AnalyzeRoute
  AnalyzeRoute --> Qwen
  Qwen -->|success| Upload
  Qwen -->|error| Fallback
  Fallback --> Upload
  DS --> ExportBundle[Export all snippets]
```

## Presenting live

See **[DEMO.md](./DEMO.md)** for a 30-second setup, click-by-click script, and pre-flight checklist. No API key is required — Analyze uses **instant offline demo** unless `QWEN_LIVE_ANALYSIS=true` is set (API key alone does not enable live calls).

## Live Demo Flow

1. Upload or drag in a UI screenshot, or click **Use sample screenshot**.
2. **Analyze** — health check → instant demo or live Qwen (with image resize/compress + retry).
3. Split view: reference screenshot vs plan cards; **Generate Preview** for scaffold + stats.
4. Copy/export generated code; sessions saved in localStorage.
5. Browse `/design-system` for atomic catalog, search/filter, variant toggles, and bundle export.
6. Explore `/design-system/laws-of-ux` for interactive [Laws of UX](https://lawsofux.com) demos (Jon Yablonski); analyze/generate shows an automated compliance checklist.
7. Browse `/design-system?domain=uilaws` for [UI Laws](https://www.uilaws.com)–informed patterns (unified atomic catalog).

## Screenshots

| Flow | Path |
|------|------|
| Upload + analyze | `/` — UploadFlow with session history |
| Generated scaffold | `/` — after **Generate Preview** |
| Design system | `/design-system` — unified atomic catalog (product + UILaws + Laws of UX) |
| Laws of UX filter | `/design-system?domain=laws-of-ux` |
| UILaws filter | `/design-system?domain=uilaws` |
| Charts (themed) | `/` dashboard — Recharts + Chart.js |

_Add your own PNGs under `public/screenshots/` for README embeds._

## Qwen API Environment

Copy `.env.example` to `.env.local` for local development.

**Demo mode (default):** leave `QWEN_LIVE_ANALYSIS` unset. Analyze uses instant offline demo data — no upstream Qwen calls, even if `DASHSCOPE_API_KEY` is present.

**Live Qwen (opt-in, spends credits):**

```bash
DASHSCOPE_API_KEY=<your-model-studio-api-key>
QWEN_LIVE_ANALYSIS=true
QWEN_MODEL=qwen3-vl-plus
QWEN_BASE_URL=https://dashscope-intl.aliyuncs.com/compatible-mode/v1
```

Alias: `USE_LIVE_QWEN=1`. Do not use `NEXT_PUBLIC_` for the API key. The key must stay server-only.

Dev boot logs env warnings via `instrumentation.ts`. Run `npm run doctor` for env, deps, and optional API ping.

## Observability Baseline

The app includes a lightweight observability scaffold wired into the root provider tree. It is privacy-safe and disabled by default, so demo mode behavior remains unchanged unless you explicitly opt in.

### Env flags (all optional)

```bash
# master switch
NEXT_PUBLIC_OBSERVABILITY_ENABLED=true

# choose what to emit
NEXT_PUBLIC_ANALYTICS_ENABLED=true
NEXT_PUBLIC_ERROR_MONITORING_ENABLED=true

# keep false for demos unless you intentionally want telemetry there
NEXT_PUBLIC_OBSERVABILITY_ALLOW_DEMO_MODE=false

# optional local debugging logs for emitted payloads
NEXT_PUBLIC_OBSERVABILITY_DEBUG=false
```

### What this scaffold does

- Registers global browser hooks for `error` and `unhandledrejection`
- Exposes a reusable analytics abstraction (`src/lib/analytics.ts`) with event constants and route/provider context
- Applies privacy defaults by dropping unknown analytics fields and stripping route query strings
- No-ops all monitoring calls when toggles are off

See **[docs/ANALYTICS_TAXONOMY.md](./docs/ANALYTICS_TAXONOMY.md)** for event definitions and metadata allowlist.

## Experimentation Baseline

The app includes lightweight experiment scaffolding for UI A/B tests:

- Default-off by design (`NEXT_PUBLIC_EXPERIMENTS_ENABLED` must be explicitly set)
- Per-experiment enablement flags for gradual rollout
- Deterministic variant assignment from a stable subject key
- Non-invasive UI insertion point currently in `Header`

See **[docs/EXPERIMENTATION.md](./docs/EXPERIMENTATION.md)** for flags, rollout steps, and verification guidance.

## Project Structure

```
src/
  app/
    api/analyze-ui/   — Qwen vision route
    api/health/       — Provider / API-key probe
  components/
    ui/               — shadcn/ui primitives (Button, Card, Badge, Sonner, …)
    atoms/            — Product atoms composing ui/
    molecules/        — Composed widgets
    organisms/        — UploadFlow, Header, dashboard sections
    design-system/    — Catalog chrome (preview cards, filters)
    providers/        — Theme, toast shim, error boundary
    charts/           — Recharts + Chart.js with shared theme tokens
  lib/                — analyze-outcome, ui-flow, image preprocess, session history
tests/                — Node unit tests
e2e/                  — Playwright smoke (upload → analyze → generate)
public/
  manifest.json       — PWA manifest
  sw.js               — Minimal service worker (production)
docs/
  ATOMIC_DESIGN.md    — Atomic tiers + shadcn/ui conventions
  STORYBOOK.md        — Deferred Storybook note
```

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Verification

```bash
npm test
npm run lint
npm run build
npm run doctor      # env + deps (+ API ping when key set)
npm run synthetic:health  # /api/health probe with latency thresholds
npm run test:e2e    # Playwright smoke
```

### E2E (no live Qwen)

Playwright smoke tests do **not** call the Qwen API:

- `e2e/helpers/mock-analyze-api.ts` intercepts `GET /api/health` (`liveAnalysisEnabled: false`) and `POST /api/analyze-ui` so Analyze always uses the **instant offline demo** path, even if `DASHSCOPE_API_KEY` or `QWEN_LIVE_ANALYSIS` is set in `.env.local` or CI.
- `playwright.config.ts` starts `npm run dev` with `DASHSCOPE_API_KEY` and `QWEN_LIVE_ANALYSIS` unset so the server health route matches demo mode when mocks are not hit.

No extra CI secrets are required for e2e.

CI runs security/dependency checks, lint, unit tests, build, and web audits on push/PR (see `.github/workflows/ci.yml`).
Run `npm run test:e2e` in release prep before final sign-off.

## Production deploy lane

- Demo-safe by default: no live API dependency unless `QWEN_LIVE_ANALYSIS=true`.
- Env policy gates:
  - `npm run deploy:env:demo` (default production policy)
  - `npm run deploy:env:live` (explicit paid/live rollout)
- Post-deploy smoke:
  - `DEPLOY_URL=<deployed-url> npm run smoke:deploy`
  - optional live assertion: `EXPECT_LIVE_ANALYSIS=true DEPLOY_URL=<deployed-url> npm run smoke:deploy`
- CI + workflow hooks:
  - `.github/workflows/ci.yml` validates demo env policy
  - `.github/workflows/post-deploy-smoke.yml` runs deployed-route smoke checks

## UX references

- **[Laws of UX](https://lawsofux.com)** (Jon Yablonski) — canonical ergonomics/perception laws; integrated in `/design-system/laws-of-ux` with live demos and analyze/generate compliance heuristics.
- **[UI Laws](https://www.uilaws.com)** — complementary visual-design principles; overlaps (Fitts, Hick, Jakob) cross-link to Laws of UX in-app.

## Tech Stack

- [Next.js](https://nextjs.org/) (App Router)
- [React](https://react.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/) v4
- [shadcn/ui](https://ui.shadcn.com) — Button, Card, Badge, Tabs, Sonner, and other primitives under `src/components/ui/`
- [Recharts](https://recharts.org/) + [Chart.js](https://www.chartjs.org/)
- [Prism](https://prismjs.com/) — snippet syntax highlighting

## What's next (demo operators)

After launch, keep the public demo on **offline analysis** (no `QWEN_LIVE_ANALYSIS`). Use **[docs/POST_LAUNCH.md](./docs/POST_LAUNCH.md)** for:

- Pre-demo verification (`check:full`, e2e, `deploy:env:demo`, synthetic health)
- Staging-only analytics activation (**[docs/ANALYTICS_STAGING_ACTIVATION.md](./docs/ANALYTICS_STAGING_ACTIVATION.md)**)
- CSP report-only monitoring via `POST /api/security/csp-report` (**[docs/CSP_HARDENING_GUIDE.md](./docs/CSP_HARDENING_GUIDE.md)**)

## Final Takeaway

AI is useful for decomposition and scaffolding. It is not a replacement for front-end judgment.
