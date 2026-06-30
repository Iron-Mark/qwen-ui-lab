# Product Walkthrough Recording Script - 30-60 Seconds

Use this script when recording a short product walkthrough.

---

## Setup

- Screen resolution: 1920x1080
- Browser: Chrome, no bookmarks bar, clean window
- App: `npm run dev` running at localhost:3000
- Have slides ready as backup

---

## Script (target: 45 seconds)

### [0:00-0:08] Opening shot - Upload flow

**Screen:** App running, light mode, upload flow visible.

**Voiceover:**
> "Upload a UI screenshot, inspect the detected structure, and export a React/Tailwind starter package."

### [0:08-0:22] Upload and analyze

**Action:** Upload `public/references/dashboard-reference.svg`, then click Analyze.

**Voiceover:**
> "The browser accepts a screenshot, previews it, and turns it into a structured component plan."

### [0:22-0:35] Generate preview

**Action:** Click Generate Preview. Show the generated scaffold, side-by-side preview, and visual match badge.

**Voiceover:**
> "The app creates a local preview and keeps the workflow usable even when live analysis is not enabled."

### [0:35-0:48] Show detector controls

**Action:** Turn on detector debug, click one box, then adjust it with arrow keys or the resize handle.

**Voiceover:**
> "Before export, the detected UI boxes are editable. The inspector shows confidence, geometry, primitive mapping, and why each region was classified."

### [0:48-0:56] Export package

**Action:** Open the export package panel.

**Voiceover:**
> "The export includes generated TSX, design notes, detection JSON, and package metadata for engineering review."

### [0:56-1:08] Show the generated preview

**Action:** Show the preview and switch themes.

**Voiceover:**
> "The generated starter keeps the structure clear: responsive grids, accessible controls, and reusable sections."

### [1:08-1:15] Closing

**Action:** Show the GitHub README or deployed URL.

**Voiceover:**
> "Use the package as a starting point, then wire it into your own data and design system."

---

## Backup: Static Screenshot Sequence

If live recording fails, use these 6 screenshots in order:

1. **Original UI reference** - `public/references/dashboard-reference.svg`
2. **Visual breakdown** - `docs/specs/DASHBOARD_QWEN3_VL_BREAKDOWN.md` (screenshot)
3. **Implementation plan** - `docs/specs/DASHBOARD_QWEN_CODE_PLAN.md` (screenshot)
4. **Generated first-pass** - `experiments/01-dashboard/generated-first-pass.tsx` in VS Code
5. **Refined preview** - App running in browser
6. **Before/after** - `docs/media/before-after-comparison.svg`

## Advanced Feature Cutaways

- Load **Dense dashboard** to stress test overlapping dashboard cards, charts, and table rows.
- Load **Repeated list** to stress test repeated row detection and action clusters.
- Use **Debug** in the detector dashboard to show confidence reasons and primitive snapping.
- Use **Export package** to show the complete artifact exported without API secrets.

---

## Recording Tips

- Use OBS or QuickTime for screen recording
- Keep cursor movements smooth and deliberate
- Don't talk over typing - pause voiceover during navigation
- Record audio separately if needed for cleaner editing
- Export at 1080p, 30fps minimum
