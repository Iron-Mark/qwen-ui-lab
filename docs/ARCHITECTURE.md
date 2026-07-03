# Architecture

`qwen-ui-lab` uses a component-driven, feature-colocated architecture. Routes stay thin, feature folders own domain UI and helpers, and shared folders contain only primitives or cross-cutting infrastructure.

## Runtime Flow

1. The user opens `/`, `/demo`, or a shared result route.
2. Route files in `src/app` compose feature entry components and metadata.
3. The analysis feature checks `GET /api/health`.
4. Local analysis returns an offline artifact from `src/features/analysis/lib`.
5. Live mode posts to `POST /api/analyze-ui`, which delegates to Qwen only when an API key and explicit live flag are both present.
6. The resulting artifact drives plan cards, component preview, export, share links, and UX-law compliance feedback.

## Source Layout

```text
src/app/
  Route entries, metadata, redirects, and API handlers only.

src/features/
  account/          browser-local profile modal and session state
  analysis/         upload flow, image preprocess, offline/Qwen analysis, UX compliance
  analytics/        internal analytics dashboard
  demo/             sample run route shell
  design-system/    catalog UI/registry, laws data, catalog filters
  export/           copy/download/Gist/repo export UI and server helpers
  home/             home hero, dashboard widgets, charts, dashboard data
  pwa/              install banner, service worker registration, install helpers
  share/            shared result route, summary card, share storage/API helpers
  shell/            header, footer, theme controls, local-analysis notice

src/components/
  ui/               shadcn/ui primitives
  layout/           shared layout primitives
  providers/        app-level React providers, boundaries, and provider-owned wrappers

src/lib/
  Cross-cutting infrastructure only: SEO, i18n, observability, CSP,
  experiments, provider-mode types, analytics buffer, env validation,
  clipboard, utilities.
```

## Boundary Rules

- `src/app` imports feature entry points; it should not accumulate domain components or reach into feature `data` modules.
- Non-layout route modules compose feature components from the feature that owns their route segment. The root route is owned by `home`; `not-found.tsx` is owned by `shell`; `layout.tsx` keeps document-level metadata/scripts and delegates runtime chrome, providers, and shell/PWA surfaces to `features/shell/components/ShellLayout`.
- Route bodies should prefer page-level feature content components when a route needs multiple feature-owned sections or loading fallbacks.
- Domain-specific route metadata, redirects, environment-derived route flags, and JSON-LD structured-data payloads belong in owning feature `lib` route helpers; `src/app` should call those helpers rather than inline domain payloads or shared SEO builders.
- Non-API route modules may import feature `lib` helpers only from the feature that owns their route segment; cross-feature orchestration belongs behind that owning feature.
- Route modules delegate feature storage lookups to feature route helpers instead of importing store implementations directly.
- `src/app/api` route handlers delegate to feature `lib` modules or shared server-safe utilities; they should not import UI components or raw feature data modules.
- Shell layout owns app-level provider wiring; other shell chrome composes account/PWA surfaces through public feature components instead of importing provider hooks directly.
- Cross-feature account consumers use account-owned helpers/components instead of importing the raw `AuthProvider` module; `ShellLayout` is the provider wiring exception.
- A feature may import shared UI/providers/lib and its own local files.
- A feature should not reach into another feature unless it is composing that feature's public component or helper.
- Raw feature `data` modules are not a cross-feature API; expose an owning-feature component or `lib` helper when another feature needs a preview, lookup, or adapter.
- Feature source files live under recognized ownership folders: `components`, `data`, or `lib`.
- `src/components/ui` remains primitive and reusable. Product components, provider-aware wrappers, and feature dependencies do not belong there.
- `src/components` and `src/lib` must not import feature modules; cross-cutting helpers move to `src/lib`.
- Modules inside the same feature, `src/components`, or shared lib tree use relative imports for local ownership. External consumers may use path aliases.
- Client-only helpers in shared or feature `lib` folders use explicit `.client.ts` or `.client.mjs` entry names, including helpers that touch browser globals; client hooks live under `src/lib/hooks` or an explicitly named client module. Server-safe root entries such as `src/lib/i18n` must not re-export client hooks.
- Pure feature `.mjs` helpers that feed API/routes stay server-safe; browser/session adapters live in adjacent `.client.ts` modules.
- Feature `lib` and `data` modules must not import component modules.
- Feature `data` folders hold plain data/types; JSX registries belong under the owning feature's `components` boundary.
- Domain data lives with the feature that owns it, for example `src/features/home/data` and `src/features/design-system/data`.
- Starter component examples use feature paths, not the old `atoms/molecules/organisms` tier paths.

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

- `media` for walkthrough scripts, slide copy, and social copy.
- `ops` for CI, deploy, observability, reliability, security, release, and PWA operations.
- `specs` for artifact notes, PR template text, and implementation specs.

## Related Docs

- [README](./README.md) - project overview and commands.
- [Contributing](./CONTRIBUTING.md) - workflow and PR expectations.
- [Sample run](./DEMO.md) - guided layout flow and local-analysis guardrails.
- [Local analysis E2E](./ops/LOCAL_ANALYSIS_E2E.md) - deterministic local-analysis testing contract.
- [Reliability ops](./ops/RELIABILITY_OPS.md) - checks, thresholds, and response targets.
