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

### [0:00–0:05] Opening shot — Dashboard

**Screen:** App running, light mode, full dashboard visible.

**Voiceover:**
> "I tested whether Qwen could turn a UI screenshot into a React/Tailwind dashboard."

### [0:05–0:15] Dark mode toggle

**Action:** Click the theme toggle button.

**Voiceover:**
> "The final result includes dark mode with smooth transitions, responsive grids from mobile to desktop..."

### [0:15–0:25] Scroll through components

**Action:** Slowly scroll down to show all sections — stats, revenue chart, activity list, quick actions.

**Voiceover:**
> "...stat cards with trend indicators, a revenue chart, activity feed, and quick action buttons — all built from a single screenshot."

### [0:25–0:35] Show the code

**Action:** Switch to VS Code. Show the component folder structure, then open `DashboardShell.tsx`.

**Voiceover:**
> "Qwen handled the visual breakdown and first-pass scaffold. I refactored for accessibility, naming, and production quality."

### [0:35–0:45] Closing

**Action:** Switch back to the app. Show the full dashboard one more time.

**Voiceover:**
> "AI accelerated the workflow, but front-end judgment made it usable. The full case study is on GitHub."

---

## Backup: Static Screenshot Sequence

If live recording fails, use these 6 screenshots in order:

1. **Original UI reference** — `public/references/dashboard-reference.svg`
2. **Qwen3-VL breakdown** — `experiments/01-dashboard/qwen3-vl-breakdown.md` (screenshot)
3. **Qwen Code plan** — `experiments/01-dashboard/qwen-code-plan.md` (screenshot)
4. **Generated first-pass** — `experiments/01-dashboard/generated-first-pass.tsx` in VS Code
5. **Refactored final** — App running in browser
6. **Before/after** — `public/results/before-after-comparison.svg`

---

## Recording Tips

- Use OBS or QuickTime for screen recording
- Keep cursor movements smooth and deliberate
- Don't talk over typing — pause voiceover during navigation
- Record audio separately if needed for cleaner editing
- Export at 1080p, 30fps minimum
