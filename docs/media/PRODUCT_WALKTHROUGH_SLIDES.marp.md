---
marp: true
theme: default
paginate: true
size: 16:9
footer: "qwen-ui-lab - qwen-ui-lab.vercel.app"
---

# qwen-ui-lab
## Screenshot to React + Tailwind starter package

- Product: [qwen-ui-lab.vercel.app](https://qwen-ui-lab.vercel.app)
- Sample run: [qwen-ui-lab.vercel.app/demo](https://qwen-ui-lab.vercel.app/demo)
- Repo: [github.com/Iron-Mark/qwen-ui-lab](https://github.com/Iron-Mark/qwen-ui-lab)

---

# Problem

- UI screenshots are easy to collect
- Component structure, states, and starter package files take longer
- Goal: compress screenshot-to-starter-package review into minutes

---

# Local review flow

- Upload screenshots or open a guided sample run
- Inspect detected structure during review
- Review and export a starter package

---

# Walkthrough beat 1

- Open the sample run; the dashboard layout loads automatically
- Review detected sections, controls, and repeated groups
- Compare screenshot structure against the starter preview

---

# Walkthrough beat 2

- Inspect confidence reasons
- Correct detection boxes when needed
- Refresh from reviewed boxes

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

# Optional live analysis

- `DASHSCOPE_API_KEY` plus `QWEN_LIVE_ANALYSIS=true`
- API key alone does not enable live calls
- Keep local analysis for walkthroughs unless live model behavior is the topic

---

# Takeaway

- The app does not promise a finished screen
- It creates an inspectable starter package from a screenshot
- Faster starts are useful when every layout decision stays visible
