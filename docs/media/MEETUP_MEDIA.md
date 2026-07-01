# Meetup media kit

Recording and slide assets for qwen-ui-lab meetups. Pair with **[DEMO.md](../DEMO.md)** for the live script and **[docs/media/DEMO_SCRIPT.md](./DEMO_SCRIPT.md)** for a 30–60 s promo cut.

---

## Recording checklist

### Pre-flight (day before)

- [ ] Rehearse **[DEMO.md](../DEMO.md)** 10-minute script once with venue Wi‑Fi **off** (`/demo` must complete instantly).
- [ ] Confirm production URL: [qwen-ui-lab.vercel.app/demo](https://qwen-ui-lab.vercel.app/demo) — export panel visible within ~20 s.
- [ ] Run `npm test` and `npm run build` if recording from a local clone.
- [ ] Set display to **1920×1080**; hide bookmarks bar; use Chrome in a clean window (or incognito for snackbar reset).
- [ ] Choose light or dark theme and stick to it for the whole take.
- [ ] Disable notifications / Do Not Disturb on the recording machine.
- [ ] Prepare backup: static screenshots listed in [docs/media/DEMO_SCRIPT.md](./DEMO_SCRIPT.md#backup-static-screenshot-sequence).

### Before rolling (5 minutes)

- [ ] Close unrelated tabs and apps; mute system sounds.
- [ ] Test mic levels (if voiceover); record audio separately if the room is noisy.
- [ ] Open `/demo` and wait for auto-run to finish once (warm cache).
- [ ] Clear site data or use incognito if you need the **Demo mode** snackbar on camera.
- [ ] Queue slide deck (exported PDF/PPTX from Marp) as presenter backup.

### During capture

- [ ] Prefer **`/demo`** for the hero beat — zero-click export panel.
- [ ] Move the cursor deliberately; pause voiceover during navigation.
- [ ] Show export panel: **Copy all code**, **Download .tsx code**, and at least one UX law deep link.
- [ ] Hit one archetype swap (`/demo?archetype=auth` or `shop`) to show variety.
- [ ] Optional B-roll: `/design-system` search + **Export all snippets**.
- [ ] Do **not** enable live Qwen on the public host for meetup footage unless rehearsed.

### Post-production

- [ ] Export at **1080p, 30 fps** minimum (H.264 or VP9).
- [ ] Trim dead air at start/end; add lower-third with demo URL if publishing.
- [ ] Verify on mobile preview (text readable at 390 px width).
- [ ] Upload to your channel / meetup repo; link README and DEMO.md in the description.

### Short promo (30–60 s)

Follow the timed beats in **[docs/media/DEMO_SCRIPT.md](./DEMO_SCRIPT.md)**. For a longer walkthrough, use the table in **[DEMO.md](../DEMO.md#five-minute-walkthrough)**.

---

## Slides (Marp)

Slide content lives in **[docs/media/MEETUP_SLIDES.marp.md](./MEETUP_SLIDES.marp.md)** — eight slides derived from the current [sample reference guide](../DEMO.md). One slide ≈ 45–60 seconds on stage.

### Install Marp

**CLI (export in CI or terminal):**

```bash
npm install -g @marp-team/marp-cli
```

**VS Code:** install the [Marp for VS Code](https://marketplace.visualstudio.com/items?itemName=marp-team.marp-vscode) extension and open `docs/media/MEETUP_SLIDES.marp.md`.

### Export commands

From the repo root:

```bash
# PDF (recommended for venue projectors)
npx @marp-team/marp-cli docs/media/MEETUP_SLIDES.marp.md --pdf -o docs/media/MEETUP_SLIDES.pdf

# PowerPoint (editable in Google Slides / Keynote import)
npx @marp-team/marp-cli docs/media/MEETUP_SLIDES.marp.md --pptx -o docs/media/MEETUP_SLIDES.pptx

# HTML (self-contained deck)
npx @marp-team/marp-cli docs/media/MEETUP_SLIDES.marp.md --html -o docs/media/MEETUP_SLIDES.html
```

### Marp notes

| Topic | Guidance |
|-------|----------|
| **Theme** | Default theme in front matter; switch to `theme: gaia` for higher contrast in bright rooms. |
| **Aspect ratio** | `size: 16:9` is set; use `4:3` only if the venue projector requires it. |
| **Speaker notes** | Add `<!-- _class: lead -->` or per-slide `notes:` in Marp v3+ if you want presenter-only text. |
| **Branding** | Footer is preset; replace with your meetup name for local chapters. |
| **Live demo** | Slides 4–6 align with `/demo` beats — advance slides while the app runs in a second window. |
| **Git ignore** | Exported `.pdf` / `.pptx` / `.html` are optional artifacts; commit only if your chapter shares them. |

### Other slide tools

The same outline in [DEMO.md](../DEMO.md) can be pasted into **Slidev** or **Google Slides** speaker notes. Marp is the maintained export path in this repo.

---

## Related docs

| Doc | Use |
|-----|-----|
| [DEMO.md](../DEMO.md) | Stage script, `/demo` tour, troubleshooting |
| [docs/ops/PWA.md](../ops/PWA.md) | Install on Android (Chrome + optional Play Store TWA) |
| [docs/media/DEMO_SCRIPT.md](./DEMO_SCRIPT.md) | 30–60 s voiceover script |
