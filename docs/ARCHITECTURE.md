# Architecture

`qwen-ui-lab` uses a component-driven, feature-colocated architecture. Routes stay thin, feature folders own domain UI and helpers, and shared folders contain only primitives or cross-cutting infrastructure.

## Runtime Flow

1. The user opens `/`, `/demo`, or a shared result route.
2. Route files in `src/app` compose feature entry components and metadata.
3. The analysis feature checks `GET /api/health`.
4. Demo mode returns an offline artifact from `src/features/analysis/lib`.
5. Live mode posts to `POST /api/analyze-ui`, which delegates to Qwen only when an API key and explicit live flag are both present.
6. The resulting artifact drives plan cards, scaffold preview, export, share links, and UX-law compliance feedback.

## Source Layout

```text
src/app/
  Route entries, metadata, redirects, and API handlers only.

src/features/
  account/          account page and demo-safe auth state
  analysis/         upload flow, image preprocess, offline/Qwen analysis, UX compliance
  analytics/        internal analytics dashboard and local event buffer
  demo/             one-click demo route shell
  design-system/    catalog UI, catalog data, laws data, catalog filters
  export/           copy/download/Gist/repo export UI and server helpers
  home/             home hero, dashboard widgets, charts, dashboard data
  pwa/              install banner, service worker registration, install helpers
  share/            shared result route, summary card, share storage/API helpers
  shell/            header, footer, theme controls, provider-mode badge

src/components/
  ui/               shadcn/ui primitives
  layout/           shared layout primitives
  providers/        app-level React providers and boundaries

src/lib/
  Cross-cutting infrastructure only: SEO, i18n, observability, CSP,
  experiments, provider mode, env validation, clipboard, utilities.
```

## Boundary Rules

- `src/app` imports feature entry points; it should not accumulate domain components.
- A feature may import shared UI/providers/lib and its own local files.
- A feature should not reach into another feature unless it is composing that feature's public component or helper.
- `src/components/ui` remains primitive and reusable. Product components do not belong there.
- Domain data lives with the feature that owns it, for example `src/features/home/data` and `src/features/design-system/data`.
- Generated scaffold examples use feature paths, not the old `atoms/molecules/organisms` tier paths.

## Component-Driven Conventions

- Build UI from small components owned by the feature that uses them.
- Keep repeated UI data-driven through local data files or local helper functions.
- Prefer direct imports from feature files until a feature needs a small public barrel.
- Keep shadcn primitives as composition building blocks, not as a dumping ground for product UI.
- Add loading, empty, and error states at the component boundary where the user sees the workflow.

## Documentation Layout

Project Markdown is intentionally centralized under `docs`:

```text
docs/
  README.md
  ARCHITECTURE.md
  CONTRIBUTING.md
  DEMO.md
  AGENTS.md
  CLAUDE.md
  media/
  ops/
  specs/
```

Only three direct docs subfolders are used:

- `media` for meetup scripts, slide copy, and social copy.
- `ops` for CI, deploy, observability, reliability, security, release, and PWA operations.
- `specs` for artifact notes, PR template text, and implementation specs.

## Related Docs

- [README](./README.md) - project overview and commands.
- [Contributing](./CONTRIBUTING.md) - workflow and PR expectations.
- [Demo script](./DEMO.md) - presenter flow and live-demo guardrails.
- [Offline E2E](./ops/OFFLINE_DEMO_E2E.md) - deterministic demo/testing contract.
- [Reliability ops](./ops/RELIABILITY_OPS.md) - checks, thresholds, and response targets.
