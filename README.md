# qwen-ui-lab

Screenshot-to-React workflow for turning UI screenshots into inspectable React + Tailwind starter packages.

The app lets you upload a screenshot, inspect detected UI structure, refine detection boxes, review a starter component preview, and export a starter package with TSX, design notes, tokens, recipe JSON, and detection notes.

## Run Locally

```bash
npm ci
npm run dev
```

Open the local URL printed by Next.js, usually [http://localhost:3000](http://localhost:3000). If that port is busy, use the alternate port shown in the terminal.

Local analysis is the default. Live Qwen analysis is opt-in and requires both server-side configuration and an explicit live flag:

```bash
DASHSCOPE_API_KEY=<your-key>
QWEN_LIVE_ANALYSIS=true
```

Never expose provider secrets through `NEXT_PUBLIC_*` variables.

## Main Routes

| Route | Purpose |
| --- | --- |
| `/` | Upload, detect, refine, preview, share, and export workflow. |
| `/demo` | Compatibility route for a preloaded sample run. |
| `/design-system` | Component catalog with product and UX-law references. |
| `/account` | Redirects to the browser-local profile modal. |
| `/share/[id]` | Read-only analysis summary. |

## Export Package

Export packages are intended as inspectable starter packages, not finished screens. A package can include:

- `README.md`
- `DESIGN.md`
- starter component TSX
- recipe JSON
- manifest JSON
- tokens CSS
- detection notes markdown

## Checks

```bash
npm run lint
npm test
npm run build
npm run validate:docs
npm run validate:assets
npm run deploy:env:local-analysis
npm run validate:prod:preview
```

`npm run deploy:env:local` remains available as a short alias for the local-analysis deploy gate.

## Documentation

Start with [docs/README.md](./docs/README.md) for the full documentation index, architecture notes, operations guides, and release process.

## License

MIT. See [LICENSE](./LICENSE).
