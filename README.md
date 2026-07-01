# qwen-ui-lab

Screenshot-to-React workflow for turning UI screenshots into reviewable React + Tailwind starter packages.

The app lets you upload a screenshot, inspect detected UI structure, refine detection boxes, generate a component preview, and export a package with code, design notes, tokens, recipe metadata, and detection notes.

## Run Locally

```bash
npm ci
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

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
| `/demo` | Compatibility route for a preloaded sample screenshot. |
| `/design-system` | Component catalog with product and UX-law references. |
| `/account` | Redirects to the browser-local profile modal. |
| `/share/[id]` | Read-only analysis summary. |

## Export Package

Generated packages are intended as reviewable starter code, not a finished product claim. A package can include:

- `README.md`
- `DESIGN.md`
- generated component TSX
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
npm run validate:prod:preview
```

## Documentation

Start with [docs/README.md](./docs/README.md) for the full documentation index, architecture notes, operations guides, and release process.

## License

MIT. See [LICENSE](./LICENSE).
