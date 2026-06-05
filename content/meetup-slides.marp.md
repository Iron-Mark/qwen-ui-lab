---
marp: true
theme: default
paginate: true
size: 16:9
footer: "qwen-ui-lab · qwen-ui-lab.vercel.app/demo"
---

# qwen-ui-lab
## Screenshot → React + Tailwind scaffold

- Offline-safe demo: [qwen-ui-lab.vercel.app/demo](https://qwen-ui-lab.vercel.app/demo)
- Repo: [github.com/Iron-Mark/qwen-ui-lab](https://github.com/Iron-Mark/qwen-ui-lab)

---

# Problem

- Design reviews stall on "how do we build this?"
- Screenshots are easy; structured component plans are hard
- Goal: compress screenshot → scaffold loop to **minutes**

---

# Demo mode (default)

- No API key on public host
- Instant offline analyze + generate
- Header badge: **Demo mode**
- `/demo` = one-click meetup route

---

# Live demo beat 1

- Open `/demo` → dashboard auto-runs
- Split view: reference vs plan cards
- Export panel: copy / download `.tsx`

---

# Archetypes

- `?archetype=auth|mobile|landing|settings|shop`
- Same offline pipeline, different bundled references
- UX compliance links per layout (Laws of UX)

---

# Design system lab

- `/design-system` — atoms → organisms
- Search, filters, variant toggles
- Export all snippets for your stack

---

# Live Qwen (opt-in)

- `DASHSCOPE_API_KEY` + `QWEN_LIVE_ANALYSIS=true`
- Key alone does **not** enable live calls
- Keep meetups on demo mode unless rehearsed

---

# Takeaway

- AI assists decomposition; humans ship polish
- "Turn screenshots into starting points — offline today, live when ready."
- Questions → `/demo`, README, DEMO.md
