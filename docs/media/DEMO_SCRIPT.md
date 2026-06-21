# Demo Recording Script — 30–60 Seconds

Use this script when recording the demo video.

---

## Setup

- Screen resolution: 1920×1080
- Browser: Chrome, no bookmarks bar, clean window
- App: `npm run dev` running at localhost:3000
- Have slides ready as backup

---

## Script (target: 45 seconds)

### [0:00–0:08] Opening shot — Upload flow

**Screen:** App running, light mode, upload flow visible.

**Voiceover:**
> "I tested whether Qwen could turn a UI screenshot into a React/Tailwind dashboard, then added a live upload-to-preview demo flow."

### [0:08–0:22] Upload and analyze

**Action:** Upload `public/references/dashboard-reference.svg`, then click Analyze.

**Voiceover:**
> "The browser accepts a screenshot, previews it, and turns it into a structured component plan."

### [0:22–0:35] Generate preview

**Action:** Click Generate Preview. Show the generated scaffold, side-by-side preview, and visual match badge.

**Voiceover:**
> "The app calls a server-side Qwen route. If the key is not configured, it falls back locally so the demo still works without exposing credentials."

### [0:35–0:48] Show detector controls

**Action:** Turn on detector debug, click one box, then adjust it with arrow keys or the resize handle.

**Voiceover:**
> "Before generating a handoff, the detected UI boxes are editable. Debug mode shows confidence, geometry, primitive mapping, and why each region was classified."

### [0:48–0:56] Export handoff

**Action:** Click Handoff bundle in the export panel.

**Voiceover:**
> "The export can include generated TSX, detection JSON, and a combined handoff bundle for engineering review."

### [0:56–1:08] Show the final dashboard

**Action:** Scroll to the finished dashboard and click the theme toggle.

**Voiceover:**
> "Below that is the final human-refactored dashboard with dark mode, responsive grids, accessible chart meters, and reusable components."

### [1:08–1:15] Closing

**Action:** Show the GitHub README or deployed URL.

**Voiceover:**
> "The route is ready for a real Model Studio key, and the fallback keeps the public demo usable even before credentials are added."

---

## Backup: Static Screenshot Sequence

If live recording fails, use these 6 screenshots in order:

1. **Original UI reference** — `public/references/dashboard-reference.svg`
2. **Qwen3-VL breakdown** — `docs/specs/DASHBOARD_QWEN3_VL_BREAKDOWN.md` (screenshot)
3. **Qwen Code plan** — `docs/specs/DASHBOARD_QWEN_CODE_PLAN.md` (screenshot)
4. **Generated first-pass** — `experiments/01-dashboard/generated-first-pass.tsx` in VS Code
5. **Refactored final** — App running in browser
6. **Before/after** — `public/results/before-after-comparison.svg`

## Advanced Feature Cutaways

- Load **Dense dashboard** to stress test overlapping dashboard cards, charts, and table rows.
- Load **Repeated list** to stress test repeated row detection and action clusters.
- Use **Debug** in the detector dashboard to show confidence reasons and primitive snapping.
- Use **Handoff bundle** to show the complete artifact exported without API secrets.

---

## Recording Tips

- Use OBS or QuickTime for screen recording
- Keep cursor movements smooth and deliberate
- Don't talk over typing — pause voiceover during navigation
- Record audio separately if needed for cleaner editing
- Export at 1080p, 30fps minimum
