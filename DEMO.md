# Live presentation guide (qwen-ui-lab)

**Meetup kit** — offline-safe demos, no API key required.

```bash
cd qwen-ui-lab
npm install
npm run dev
```

Open [http://localhost:3000/demo](http://localhost:3000/demo) for the one-click stage route, or [http://localhost:3000](http://localhost:3000) for the full home flow.

Optional: copy `.env.example` to `.env.local` and set `DASHSCOPE_API_KEY` **and** `QWEN_LIVE_ANALYSIS=true` only if you want live Qwen vision during the talk (spends API credits).

---

## 10-minute meetup script

Use **[qwen-ui-lab.vercel.app/demo](https://qwen-ui-lab.vercel.app/demo)** on stage (or local `npm run dev`). Adjust pacing if the room is interactive.

| Time | Screen | Say / do |
|------|--------|----------|
| **0:00–1:00** | `/demo` loading | *"This app turns UI screenshots into React + Tailwind scaffolds. Public demo runs **offline by default** — no API key, no upstream wait."* Point out header **Demo mode** badge and the bottom-left **Demo mode — safe for live demos** snackbar (once per session). |
| **1:00–2:30** | `/demo` (dashboard) | Let auto-run finish: bundled dashboard loads → analyze → export panel opens. *"The `/demo` route preloads a reference, runs analyze, and lands on export — one URL, zero clicks."* Scroll the split view: screenshot left, plan cards right. |
| **2:30–4:00** | Export panel | Highlight **Copy all code**, **Download .tsx code** (`generated-dashboard.tsx`), and scaffold stats. Open the **Laws of UX** compliance dialog from the analyze flow. Click a deep link (e.g. Jakob's Law) to show pattern literacy is built in. |
| **4:00–5:30** | `/demo?archetype=auth` | *"Same route, different layout — query param swaps the bundled archetype."* Show sign-in scaffold, Fitts's Law link, download as `generated-auth.tsx`. |
| **5:30–6:30** | `/demo?archetype=shop` | Quick pass: ecommerce grid, **Choice overload** compliance link. *"Six archetypes ship for meetups — dashboard, auth, mobile, landing, settings, shop."* |
| **6:30–8:00** | `/` (home) | Contrast manual flow: **Use sample screenshot** → **Analyze** → **Generate Preview**. Scroll to dashboard charts below the upload card. Toggle brand theme (Indigo / Emerald / Sunset) and light/dark — charts follow tokens. |
| **8:00–9:00** | `/design-system` | Search/filter atoms → molecules → organisms. Toggle stat/chart variants. **Export all snippets**. Optional: `/design-system?domain=laws-of-ux` for the Laws slice. |
| **9:00–10:00** | Wrap / Q&A | One-liner: *"Turn screenshots into production-ready starting points — demo runs offline; live Qwen is one env flag when you're ready."* Mention `/not-found` for branded 404. Optional live Qwen only if rehearsed (see [What to say about the API](#what-to-say-about-the-api)). |

**Presenter tip:** Rehearse with venue Wi‑Fi off once — `/demo` and demo mode should still complete instantly.

---

## `/demo` tour order

Recommended click path for a focused **5-minute `/demo`-only** segment (skip home if time is tight).

| Step | URL | What the audience sees |
|------|-----|------------------------|
| 1 | [`/demo`](https://qwen-ui-lab.vercel.app/demo) | Hero: **One-click demo** + **Offline-safe · no upload required**. Auto-loads **Dashboard** reference → analyze progress → export panel. UX link: Jakob's Law (`ux-law-link-jakob`). |
| 2 | Same page | Export panel: copy/download scaffold, plan cards, compliance archetype links. |
| 3 | [`/demo?archetype=auth`](https://qwen-ui-lab.vercel.app/demo?archetype=auth) | **Sign in** layout; Fitts's Law link; export `generated-auth.tsx`. |
| 4 | [`/demo?archetype=mobile`](https://qwen-ui-lab.vercel.app/demo?archetype=mobile) | Phone shell + bottom nav reference. |
| 5 | [`/demo?archetype=landing`](https://qwen-ui-lab.vercel.app/demo?archetype=landing) | Marketing hero + pricing reference. |
| 6 | [`/demo?archetype=settings`](https://qwen-ui-lab.vercel.app/demo?archetype=settings) | Profile + toggles reference. |
| 7 | [`/demo?archetype=shop`](https://qwen-ui-lab.vercel.app/demo?archetype=shop) | Shop catalog (maps to `ecommerce` sample); Choice overload link; export `generated-shop.tsx`. |

**Query param reference**

| `?archetype=` | Bundled sample | Export filename |
|---------------|----------------|-----------------|
| `dashboard` (default) | Dashboard analytics shell | `generated-dashboard.tsx` |
| `auth` | Sign-in card | `generated-auth.tsx` |
| `mobile` | Mobile app shell | `generated-mobile.tsx` |
| `landing` | Landing / pricing | `generated-landing.tsx` |
| `settings` | Settings profile | `generated-settings.tsx` |
| `shop` | E-commerce grid | `generated-shop.tsx` |

Invalid or missing values fall back to `dashboard`.

---

## Recommended walkthrough (3–5 minutes)

Shorter variant when you start on `/` instead of `/demo`:

1. **Home (`/`)** — Note the **Demo mode** badge in the header (default unless `QWEN_LIVE_ANALYSIS=true`). Click **Use sample screenshot** (or drag any UI image). Scroll past the upload card to show the static dashboard and charts.
2. **Analyze** — Click **Analyze**. In demo mode the app **skips** the slow API round-trip: `/api/health` reports `liveAnalysisEnabled: false` and the client returns **instant offline demo** data with step progress UI. Expect the amber **Offline demo mode** banner and a toast.
3. **Split view** — After analyze, the uploaded screenshot stays on the left while plan cards appear on the right. Click **Generate Preview** for scaffold + live stats side-by-side.
4. **Session history** — Re-open a recent analysis from the **Recent analyses** strip (stored in localStorage).
5. **Design system (`/design-system`)** — Search/filter atoms/molecules/organisms; toggle stat/chart variants; **Export all snippets**; highlight Prism-highlighted snippets and chart cards.
6. **404** — Visit `/not-found` or any bad path to show the branded page and nav back to dashboard.

---

## Troubleshooting (on stage)

| Symptom | Likely cause | Fix (fast) |
|---------|--------------|------------|
| Export panel never appears on `/demo` | Slow device or JS still hydrating | Wait ~20s; hard refresh; use production URL instead of cold local dev |
| `/demo` stuck on "Analyzing…" | Provider mode loading or network hiccup on health check | Refresh; confirm header shows **Demo mode**; check `GET /api/health` → `liveAnalysisEnabled: false` |
| Wrong layout after changing archetype | Browser cache or stale tab | Full navigation to new URL (don't rely on back); e.g. `/demo?archetype=shop` |
| **Live Qwen** badge on a meetup host | `QWEN_LIVE_ANALYSIS=true` on Vercel | Unset flag on public project; redeploy; see [docs/LIVE_QWEN_ROLLOUT.md](./docs/LIVE_QWEN_ROLLOUT.md) |
| Analyze waits then errors (live mode) | Quota, network, or oversized image | Switch story to demo mode; use `/demo`; image ≤ 4 MB |
| Clipboard **Copy all code** fails | Locked-down browser / HTTP context | Use **Download .tsx code** instead |
| Demo snackbar missing | Already dismissed this session | Clear site data or use incognito; snackbar is once-per-session |
| `npm run dev` won't start | Port 3000 in use or deps missing | `npm install`; kill port 3000 or `PORT=3001 npm run dev` |
| Charts look wrong in dark mode | Theme toggle mid-render | Toggle light → dark once; both Recharts + Chart.js follow shared tokens |
| 404 on `/demo` | Old deploy without demo route | Pull latest; verify [releases](https://github.com/Iron-Mark/qwen-ui-lab/releases) ≥ v0.1.2 |

Full ops runbook: **[docs/TROUBLESHOOTING_RUNBOOK.md](./docs/TROUBLESHOOTING_RUNBOOK.md)**.

---

## Optional slides outline (markdown)

Copy into Marp, Slidev, or Google Slides speaker notes. One slide ≈ 45–60 seconds. **Marp-ready deck + export commands:** [MEETUP_MEDIA.md](./MEETUP_MEDIA.md) and [content/meetup-slides.marp.md](./content/meetup-slides.marp.md).

```markdown
# Slide 1 — Title
**qwen-ui-lab:** Screenshot → React + Tailwind scaffold
- Offline-safe demo: qwen-ui-lab.vercel.app/demo
- Repo: github.com/Iron-Mark/qwen-ui-lab

# Slide 2 — Problem
- Design reviews stall on "how do we build this?"
- Screenshots are easy; structured component plans are hard
- Goal: compress screenshot → scaffold loop to minutes

# Slide 3 — Demo mode (default)
- No API key on public host
- Instant offline analyze + generate
- Header badge: **Demo mode**
- `/demo` = one-click meetup route

# Slide 4 — Live demo beat 1
- Open `/demo` → dashboard auto-runs
- Split view: reference vs plan cards
- Export panel: copy / download `.tsx`

# Slide 5 — Archetypes
- `?archetype=auth|mobile|landing|settings|shop`
- Same offline pipeline, different bundled references
- UX compliance links per layout (Laws of UX)

# Slide 6 — Design system lab
- `/design-system` — atoms → organisms
- Search, filters, variant toggles
- Export all snippets for your stack

# Slide 7 — Live Qwen (opt-in)
- `DASHSCOPE_API_KEY` + `QWEN_LIVE_ANALYSIS=true`
- Key alone does **not** enable live calls
- Keep meetups on demo mode unless rehearsed

# Slide 8 — Takeaway
- AI assists decomposition; humans ship polish
- "Turn screenshots into starting points — offline today, live when ready."
- Questions → `/demo`, README, DEMO.md
```

Shorter video script (30–60 s): **[content/demo-script.md](./content/demo-script.md)**.

---

## What to say about the API

- By default (no `QWEN_LIVE_ANALYSIS=true`), Analyze is **instant** — health check → local demo artifact (no upstream Qwen, no `/api/analyze-ui` wait). A configured API key alone does **not** enable live calls.
- With `DASHSCOPE_API_KEY` and `QWEN_LIVE_ANALYSIS=true`, the header shows **Live Qwen**; Analyze preprocesses/resizes the image, calls Qwen3-VL (with one retry on transient errors), and shows **Qwen analysis complete**.

---

## Pre-flight checklist

```bash
npm test
npm run build
npm run doctor   # optional: env + deps + API ping when key is set
```

Start dev once and click: `/demo`, `/`, `/design-system`, `/this-page-does-not-exist` (404).

On production, smoke: [qwen-ui-lab.vercel.app/demo](https://qwen-ui-lab.vercel.app/demo) → export panel visible within ~20s.

---

## Theme toggle

Use the sun/moon control in the header to flip light/dark — Recharts + Chart.js follow the active theme via shared chart tokens.

---

## Risks to mention (optional)

- Clipboard copy can fail on some locked-down browsers; **Export** still downloads the file.
- Live Qwen depends on network and Model Studio quota — keep demo mode as the default story (`QWEN_LIVE_ANALYSIS` unset).
- PWA/service worker activates in production builds only.
