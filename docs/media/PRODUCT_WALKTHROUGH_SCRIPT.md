# Product Walkthrough Recording Script - 30-60 Seconds

Use this script when recording a short product walkthrough.

---

## Setup

- Screen resolution: 1920x1080
- Browser: Chrome, no bookmarks bar, clean window
- App: local dev server or deployed preview open in the browser
- Have slides ready as backup

---

## Script (target: 45 seconds)

### [0:00-0:08] Opening shot - Upload flow

**Screen:** App running, light mode, upload flow visible.

**Voiceover:**
> "Upload a UI screenshot, inspect the detected structure, and download a React/Tailwind starter package."

### [0:08-0:22] Upload and analyze

**Action:** Upload `public/references/dashboard-reference.svg`, then click Analyze.

**Voiceover:**
> "The browser accepts a screenshot, previews it, and turns it into a structured component plan."

### [0:22-0:35] Prepare preview

**Action:** Click Prepare preview. Show the starter component, side-by-side preview, and visual match badge.

**Voiceover:**
> "The app creates a local preview, so the review flow stays usable without extra setup."

### [0:35-0:48] Show detector controls

**Action:** Turn on Box labels, click one box, then adjust it with arrow keys or the resize handle.

**Voiceover:**
> "Before download, the detected UI boxes are editable. The inspector shows confidence, geometry, primitive mapping, and why each region was classified."

### [0:48-0:56] Download package

**Action:** Open the package download panel.

**Voiceover:**
> "The package includes starter component TSX, design notes, detection JSON, and a manifest for engineering review."

### [0:56-1:08] Show the starter preview

**Action:** Show the preview and switch themes.

**Voiceover:**
> "The starter output keeps the structure clear: responsive grids, accessible controls, and reusable sections."

### [1:08-1:15] Closing

**Action:** Show the GitHub README or deployed URL.

**Voiceover:**
> "Use the package as a starting point, then wire it into your own data and design system."

---

## Backup: Static Screenshot Sequence

If live recording fails, use these 7 screenshots in order:

1. **Source screenshot** - `public/references/dashboard-reference.svg`
2. **Visual breakdown** - `docs/specs/DASHBOARD_QWEN3_VL_BREAKDOWN.md` (screenshot)
3. **Implementation plan** - `docs/specs/DASHBOARD_QWEN_CODE_PLAN.md` (screenshot)
4. **First-pass starter** - `experiments/01-dashboard/first-pass-starter.tsx` in VS Code
5. **Reviewed starter** - `experiments/01-dashboard/reviewed-starter.tsx` in VS Code
6. **Refined preview** - App running in browser
7. **Before/after** - `docs/media/before-after-comparison.png`

## Advanced Feature Cutaways

- Load **Dense dashboard** to stress test overlapping dashboard cards, charts, and table rows.
- Load **Repeated list** to stress test repeated row detection and action clusters.
- Use **Box labels** in the detector panel to show confidence reasons and primitive snapping.
- Use **Download package** to show the complete artifact without exposing credentials.

---

## Recording Tips

- Use OBS or QuickTime for screen recording
- Keep cursor movements smooth and deliberate
- Don't talk over typing - pause voiceover during navigation
- Record audio separately if needed for cleaner editing
- Export at 1080p, 30fps minimum
