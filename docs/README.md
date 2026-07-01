# qwen-ui-lab

AI-assisted screenshot-to-React workflow: turn UI screenshots into React and Tailwind starting points you can refine quickly.

Production: [qwen-ui-lab.vercel.app](https://qwen-ui-lab.vercel.app)

## Quick Start

```bash
npm ci
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Local analysis is the default. Live Qwen analysis requires both:

```bash
DASHSCOPE_API_KEY=<your-key>
QWEN_LIVE_ANALYSIS=true
```

An API key alone does not enable upstream calls.

## Main Routes

| Route | Purpose |
| --- | --- |
| `/` | Home dashboard plus screenshot upload, analyze, generate, share, and export flow. |
| `/demo` | Sample reference with bundled layouts and `?archetype=auth|mobile|landing|settings|shop`. |
| `/design-system` | Component catalog, UX-law domains, snippet previews, and export bundle. |
| `/account` | Compatibility redirect to the browser-local profile modal. |
| `/share/[id]` | Read-only shared summary route. |
| `/api/health` | Provider mode probe. |
| `/api/analyze-ui` | Live vision analysis when explicitly enabled. |

## Architecture

The codebase is organized by feature ownership:

```text
src/app/          route shells, metadata, API handlers
src/features/     account, analysis, analytics, demo, design-system, export,
                  home, pwa, share, shell
src/components/   shared ui primitives, layout, providers
src/lib/          cross-cutting infrastructure only
tests/            Node unit tests
e2e/              Playwright coverage
docs/             all project Markdown
```

See [Architecture](./ARCHITECTURE.md) for the folder rules and feature ownership map.

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Start the local Next.js dev server. |
| `npm test` | Run Node unit tests. |
| `npm run lint` | Run ESLint. |
| `npx tsc --noEmit` | Run TypeScript without writing build output. |
| `npm run build` | Production build. |
| `npm run validate:docs` | Check local Markdown links in README.md and docs/. |
| `npm run check` | Lint plus unit tests. |
| `npm run check:full` | Lint, unit tests, docs link validation, and production build. |
| `npm run test:e2e` | Playwright smoke tests with offline mocks. |
| `npm run export:demo-fixtures` | Regenerate E2E demo fixtures from analysis libs. |
| `npm run doctor` | Local environment and optional provider diagnostics. |
| `npm run deploy:env:demo` | Validate local-analysis deploy env. |
| `npm run deploy:env:live` | Validate live-analysis deploy env. |

## Local Analysis Default

Public deployments should keep `QWEN_LIVE_ANALYSIS` unset unless a staged live rollout is approved. In local-analysis mode the client uses deterministic artifacts, so reviews and CI do not spend Qwen credits.

Live mode is only for intentional rehearsal or private testing:

```text
DASHSCOPE_API_KEY set
QWEN_LIVE_ANALYSIS=true or USE_LIVE_QWEN=1
```

Never put provider secrets in `NEXT_PUBLIC_*`.

## Documentation Index

Core docs:

| Doc | Topic |
| --- | --- |
| [Architecture](./ARCHITECTURE.md) | Feature colocation and component boundaries. |
| [Contributing](./CONTRIBUTING.md) | Workflow, checks, and PR expectations. |
| [Sample reference](./DEMO.md) | Sample flow and troubleshooting table. |
| [Agent notes](./AGENTS.md) | Repository-specific agent guidance. |

Media docs:

| Doc | Topic |
| --- | --- |
| [Presentation media kit](./media/MEETUP_MEDIA.md) | Recording and slide export checklist. |
| [Sample script](./media/DEMO_SCRIPT.md) | Short video script and backup screenshot order. |
| [LinkedIn posts](./media/LINKEDIN_POSTS.md) | Social copy drafts. |
| [Slide source](./media/MEETUP_SLIDES.marp.md) | Marp slide source. |

Operations docs:

| Doc | Topic |
| --- | --- |
| [CI](./ops/CI.md) | GitHub Actions, E2E, visual, and performance gates. |
| [Deployment checklist](./ops/DEPLOYMENT_CHECKLIST.md) | Go-live checks. |
| [Production deploy lane](./ops/PRODUCTION_DEPLOY_LANE.md) | Local-analysis deploy policy. |
| [Production env readiness](./ops/PRODUCTION_ENV_READINESS.md) | Required production envs and validation commands. |
| [Live Qwen rollout](./ops/LIVE_QWEN_ROLLOUT.md) | Live-analysis rehearsal and rollback. |
| [Offline E2E](./ops/OFFLINE_DEMO_E2E.md) | Deterministic local-analysis test contract. |
| [Observability](./ops/OBSERVABILITY.md) | Error and event monitoring. |
| [Analytics taxonomy](./ops/ANALYTICS_TAXONOMY.md) | Privacy-safe funnel events. |
| [Analytics staging](./ops/ANALYTICS_STAGING_ACTIVATION.md) | Staging telemetry activation. |
| [Reliability ops](./ops/RELIABILITY_OPS.md) | Synthetic health and response targets. |
| [Troubleshooting](./ops/TROUBLESHOOTING_RUNBOOK.md) | Incident-oriented fixes. |
| [Security](./ops/SECURITY.md) | Responsible reporting and safe operations. |
| [PWA](./ops/PWA.md) | Install, offline shell, and TWA notes. |
| [Performance](./ops/PERFORMANCE.md) | Bundle and Lighthouse checks. |
| [Share links](./ops/SHARE_LINKS.md) | Durable share-link storage notes. |
| [OAuth roadmap](./ops/OAUTH_ROADMAP.md) | Future auth migration plan. |
| [Experimentation](./ops/EXPERIMENTATION.md) | Feature flags and A/B setup. |
| [Release process](./ops/RELEASE_PROCESS.md) | Versioning and release flow. |

Specs:

| Doc | Topic |
| --- | --- |
| [Artifact checklist](./specs/ARTIFACT_CHECKLIST.md) | Export artifact inventory. |
| [UI to component skill](./specs/UI_TO_COMPONENT_SKILL.md) | Screenshot-to-component workflow spec. |
| [PR template](./specs/PULL_REQUEST_TEMPLATE.md) | Pull request checklist text. |

## License

MIT. See [LICENSE](../LICENSE).
