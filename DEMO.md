# Live presentation guide (qwen-ui-lab)

**30-second setup** — no API key required for the main demo.

```bash
cd qwen-ui-lab
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Optional: copy `.env.example` to `.env.local` and set `DASHSCOPE_API_KEY` only if you want live Qwen vision during the talk.

## Recommended walkthrough (3–5 minutes)

1. **Home (`/`)** — Click **Use sample screenshot** (or drag any UI image). Scroll past the upload card to show the static dashboard and charts.
2. **Analyze** — Click **Analyze**. Expect the amber **Offline demo mode** banner when no API key is set; a green **Demo analysis complete** message confirms the step finished.
3. **Generate Preview** — Click **Generate Preview**. Show the plan cards, generated code panel, and live preview stats. Use **Copy** / **Export** on the scaffold.
4. **Design system (`/design-system`)** — Open from the header. Scroll organisms; highlight **Chart preview** with Recharts + Chart.js. Click **Copy** on any card and wait for **Copied**.
5. **404** — Visit `/not-found` or any bad path to show the branded page and nav back to dashboard.

## What to say about the API

- Without `DASHSCOPE_API_KEY`, the app **never blocks** — it calls `/api/analyze-ui`, detects missing key or errors, and falls back to **local demo analysis** with honest messaging.
- With a valid key, the same buttons call Qwen3-VL and show **Qwen analysis complete** instead.

## Pre-flight checklist

```bash
npm test
npm run build
```

Start dev once and click: `/`, `/design-system`, `/this-page-does-not-exist` (404).

## Theme toggle

Use the sun/moon control in the header to flip light/dark — charts and tokens follow the active theme.

## Risks to mention (optional)

- First **Analyze** may take a few seconds while the API route responds before fallback.
- Clipboard copy can fail on some locked-down browsers; **Export** still downloads the file.
- Live Qwen depends on network and Model Studio quota — keep offline demo as the default story.
