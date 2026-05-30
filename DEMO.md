# Live presentation guide (qwen-ui-lab)

**30-second setup** — no API key required for the main demo.

```bash
cd qwen-ui-lab
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Optional: copy `.env.example` to `.env.local` and set `DASHSCOPE_API_KEY` **and** `QWEN_LIVE_ANALYSIS=true` only if you want live Qwen vision during the talk (spends API credits).

## Recommended walkthrough (3–5 minutes)

1. **Home (`/`)** — Note the **Demo mode** badge in the header (default unless `QWEN_LIVE_ANALYSIS=true`). Click **Use sample screenshot** (or drag any UI image). Scroll past the upload card to show the static dashboard and charts.
2. **Analyze** — Click **Analyze**. In demo mode the app **skips** the slow API round-trip: `/api/health` reports `liveAnalysisEnabled: false` and the client returns **instant offline demo** data with step progress UI. Expect the amber **Offline demo mode** banner and a toast.
3. **Split view** — After analyze, the uploaded screenshot stays on the left while plan cards appear on the right. Click **Generate Preview** for scaffold + live stats side-by-side.
4. **Session history** — Re-open a recent analysis from the **Recent analyses** strip (stored in localStorage).
5. **Design system (`/design-system`)** — Search/filter atoms/molecules/organisms; toggle stat/chart variants; **Export all snippets**; highlight Prism-highlighted snippets and chart cards.
6. **404** — Visit `/not-found` or any bad path to show the branded page and nav back to dashboard.

## What to say about the API

- By default (no `QWEN_LIVE_ANALYSIS=true`), Analyze is **instant** — health check → local demo artifact (no upstream Qwen, no `/api/analyze-ui` wait). A configured API key alone does **not** enable live calls.
- With `DASHSCOPE_API_KEY` and `QWEN_LIVE_ANALYSIS=true`, the header shows **Live Qwen**; Analyze preprocesses/resizes the image, calls Qwen3-VL (with one retry on transient errors), and shows **Qwen analysis complete**.

## Pre-flight checklist

```bash
npm test
npm run build
npm run doctor   # optional: env + deps + API ping when key is set
```

Start dev once and click: `/`, `/design-system`, `/this-page-does-not-exist` (404).

## Theme toggle

Use the sun/moon control in the header to flip light/dark — Recharts + Chart.js follow the active theme via shared chart tokens.

## Risks to mention (optional)

- Clipboard copy can fail on some locked-down browsers; **Export** still downloads the file.
- Live Qwen depends on network and Model Studio quota — keep demo mode as the default story (`QWEN_LIVE_ANALYSIS` unset).
- PWA/service worker activates in production builds only.
