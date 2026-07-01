---
marp: true
theme: default
paginate: true
size: 16:9
footer: "qwen-ui-lab - qwen-ui-lab.vercel.app/demo"
---

# qwen-ui-lab
## Screenshot to React + Tailwind starter package

- Sample run: [qwen-ui-lab.vercel.app/demo](https://qwen-ui-lab.vercel.app/demo)
- Repo: [github.com/Iron-Mark/qwen-ui-lab](https://github.com/Iron-Mark/qwen-ui-lab)

---

# Problem

- UI screenshots are easy to collect
- Component structure, states, and export-ready files take longer
- Goal: compress screenshot-to-starter-package review into minutes

---

# Local preview

- Public host runs without a provider key
- Bundled samples analyze and generate instantly
- `/demo` opens a sample result for walkthroughs
- Real screenshots still go through the same review flow

---

# Walkthrough beat 1

- Open `/demo`; the dashboard sample auto-runs
- Review detected sections, controls, and repeated groups
- Compare screenshot structure against the generated preview

---

# Walkthrough beat 2

- Inspect confidence reasons
- Correct detection boxes when needed
- Regenerate from corrected boxes as the source of truth

---

# Export package

- Component TSX
- DESIGN.md
- Recipe JSON and manifest JSON
- Tokens CSS
- Detection notes for review

---

# Design system

- `/design-system` catalogs reusable primitives
- Search, filters, variant toggles, and preview modes
- Export snippets for product UI and Laws of UX examples

---

# Live provider mode

- `DASHSCOPE_API_KEY` plus `QWEN_LIVE_ANALYSIS=true`
- API key alone does not enable live calls
- Use local preview for recordings unless provider behavior is the topic

---

# Takeaway

- The app does not promise final production UI
- It creates an inspectable starter package from a screenshot
- Faster scaffolding is useful when every generated decision stays reviewable
