# Product media kit

Recording and slide assets for qwen-ui-lab walkthroughs, product tours, and short launch clips. Pair this with **[DEMO.md](../DEMO.md)** for the guided sample-run script and **[docs/media/PRODUCT_WALKTHROUGH_SCRIPT.md](./PRODUCT_WALKTHROUGH_SCRIPT.md)** for a 30-60 second promo cut.

---

## Recording checklist

### Pre-flight

- [ ] Rehearse **[DEMO.md](../DEMO.md)** once with network access disabled; `/demo` should still complete from the sample run.
- [ ] Confirm the product URL: [qwen-ui-lab.vercel.app](https://qwen-ui-lab.vercel.app). The upload workflow should be visible immediately.
- [ ] Run `npm test` and `npm run build` when recording from a local clone.
- [ ] Set the display to 1920x1080, hide the bookmarks bar, and use a clean Chrome profile.
- [ ] Choose light or dark theme and keep it consistent for the whole take.
- [ ] Disable notifications and system sounds.
- [ ] Prepare backup screenshots from [docs/media/PRODUCT_WALKTHROUGH_SCRIPT.md](./PRODUCT_WALKTHROUGH_SCRIPT.md#backup-static-screenshot-sequence).

### Before rolling

- [ ] Close unrelated tabs and apps.
- [ ] Test microphone levels if recording voiceover.
- [ ] Open `/demo` and let the sample run finish once to warm the cache.
- [ ] Clear site data or use an incognito window if the recording needs a fresh first-run state.
- [ ] Queue the slide deck as a presenter backup.

### During capture

- [ ] Start on `/demo` when the clip needs a guided sample run.
- [ ] Move the cursor deliberately and pause during transitions.
- [ ] Show the package tabs: files, changes, and guide.
- [ ] Trigger one archetype swap, such as `/demo?archetype=auth` or `/demo?archetype=shop`, to show variety.
- [ ] Optional B-roll: `/design-system` search plus snippet export.
- [ ] Keep live analysis disabled unless the recording specifically covers connecting an upstream model.

### Post-production

- [ ] Export at 1080p, 30 fps minimum.
- [ ] Trim dead air at the start and end.
- [ ] Add a lower-third with the product URL if publishing publicly; use `/demo` only when the clip starts from the guided sample run.
- [ ] Verify the video on a mobile preview; text should still be readable around 390 px width.
- [ ] Link README and the sample-run guide in the description.

### Short promo

Follow the timed beats in **[docs/media/PRODUCT_WALKTHROUGH_SCRIPT.md](./PRODUCT_WALKTHROUGH_SCRIPT.md)**. For a longer walkthrough, use **[DEMO.md](../DEMO.md#five-minute-walkthrough)**.

---

## Slides

Slide content lives in **[docs/media/PRODUCT_WALKTHROUGH_SLIDES.marp.md](./PRODUCT_WALKTHROUGH_SLIDES.marp.md)**. The deck is kept as a reusable product walkthrough deck for screenshot-to-React reviews.

### Install Marp

**CLI:**

```bash
npm install -g @marp-team/marp-cli
```

**VS Code:** install the [Marp for VS Code](https://marketplace.visualstudio.com/items?itemName=marp-team.marp-vscode) extension and open `docs/media/PRODUCT_WALKTHROUGH_SLIDES.marp.md`.

### Export commands

From the repo root:

```bash
npx @marp-team/marp-cli docs/media/PRODUCT_WALKTHROUGH_SLIDES.marp.md --pdf -o docs/media/PRODUCT_WALKTHROUGH_SLIDES.pdf
npx @marp-team/marp-cli docs/media/PRODUCT_WALKTHROUGH_SLIDES.marp.md --pptx -o docs/media/PRODUCT_WALKTHROUGH_SLIDES.pptx
npx @marp-team/marp-cli docs/media/PRODUCT_WALKTHROUGH_SLIDES.marp.md --html -o docs/media/PRODUCT_WALKTHROUGH_SLIDES.html
```

### Marp notes

| Topic | Guidance |
|-------|----------|
| Theme | Default theme in front matter; switch to `theme: gaia` for higher contrast in bright rooms. |
| Aspect ratio | `size: 16:9` is set; use `4:3` only when the projector requires it. |
| Speaker notes | Add presenter-only notes in Marp when needed. |
| Branding | Footer is preset; replace it only for event-specific exports. |
| Product walkthrough | Slides 4-6 align with sample-run beats. |
| Git ignore | Exported `.pdf`, `.pptx`, and `.html` files are optional artifacts. |

---

## Related docs

| Doc | Use |
|-----|-----|
| [DEMO.md](../DEMO.md) | Sample-run tour and troubleshooting |
| [docs/ops/PWA.md](../ops/PWA.md) | Install and PWA notes |
| [docs/media/PRODUCT_WALKTHROUGH_SCRIPT.md](./PRODUCT_WALKTHROUGH_SCRIPT.md) | 30-60 second voiceover script |
