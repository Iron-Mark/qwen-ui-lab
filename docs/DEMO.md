# Sample Run Guide

Use this guide when you want to inspect the screenshot-to-React workflow without uploading a new image first. The `/demo` route remains available for compatibility, but the product story is a **sample run**: load a guided layout, inspect the detected UI, review the starter component, and export a starter package.

```bash
cd qwen-ui-lab
npm install
npm run dev
```

Open the local URL printed by Next.js. Use `/demo` for the guided sample run, or `/` for the normal upload workflow.

Live Qwen analysis is opt-in. Set both `DASHSCOPE_API_KEY` and `QWEN_LIVE_ANALYSIS=true` only when you intentionally want upstream vision calls.

## Five-Minute Walkthrough

| Time | Screen | What to show |
| --- | --- | --- |
| 0:00-1:00 | `/demo` | The default sample loads automatically and runs the same analysis pipeline as uploaded screenshots. |
| 1:00-2:00 | Analysis result | Show the screenshot, detected regions, plan cards, confidence reasons, and editable detection boxes. |
| 2:00-3:00 | Starter preview | Refresh after edits, compare the screenshot with the starter component, and point out responsive assumptions. |
| 3:00-4:00 | Export package | Open the export dialog. Review `Files`, `Changes`, and `Guide`; use **Download component** or package export actions. |
| 4:00-5:00 | `/design-system` | Browse reusable components, Laws of UX references, preview modes, and snippet export. |

## Sample Routes

| URL | Guided layout | Export filename |
| --- | --- | --- |
| `/demo` | Dashboard analytics shell | `starter-dashboard.tsx` |
| `/demo?archetype=auth` | Sign-in card | `starter-auth.tsx` |
| `/demo?archetype=mobile` | Mobile app shell | `starter-mobile.tsx` |
| `/demo?archetype=landing` | Landing and pricing | `starter-landing.tsx` |
| `/demo?archetype=settings` | Settings profile | `starter-settings.tsx` |
| `/demo?archetype=shop` | E-commerce grid | `starter-shop.tsx` |

Invalid or missing `archetype` values use the dashboard guided layout.

## Main Workflow

1. Start on `/`.
2. Upload a UI screenshot or load a sample run.
3. Run analysis and inspect detected structure.
4. Edit detection boxes when needed.
5. Prepare the React + Tailwind preview.
6. Export the starter package or component file.

The local analysis path is the default. It lets the workflow stay usable without upstream credentials while still keeping live Qwen available behind explicit configuration.

## Export Review

The export package is meant to be inspectable before download:

- `README.md` explains the starter package and next steps.
- `DESIGN.md` documents layout, tokens, component inventory, and E2E expectations.
- The starter TSX component exports one main component plus focused subcomponents.
- Recipe, manifest, tokens, and detection notes keep rebuild settings and review notes outside the rendered component.

## Troubleshooting

| Symptom | Likely cause | Fast fix |
| --- | --- | --- |
| Export panel does not appear | Browser is still hydrating or the machine is slow | Wait briefly, then refresh and retry the sample route. |
| Analysis errors | Unsupported file, oversized image, or live analysis misconfiguration | Use a PNG/JPG/SVG/WebP under the upload limit, or return to local analysis. |
| Copy fails | Browser clipboard permissions are restricted | Use **Download component** or package export. |
| Wrong sample appears | Stale route or cached tab | Navigate directly to the desired `/demo?archetype=...` URL. |
| Live Qwen is unexpectedly active | `QWEN_LIVE_ANALYSIS=true` is set | Remove the flag unless upstream calls are intentional. |

Full ops runbook: [docs/ops/TROUBLESHOOTING_RUNBOOK.md](./ops/TROUBLESHOOTING_RUNBOOK.md).

## Pre-Flight

```bash
npm test
npm run build
npm run validate:assets
npm run validate:prod:preview
```

For PWA verification, run:

```bash
npm run test:e2e:pwa
```

