# qwen-ui-lab

An AI-assisted workflow for converting UI screenshots into React/Tailwind component scaffolds using Qwen3-VL and Qwen Code.

## Links

- Repository: [github.com/Iron-Mark/qwen-ui-lab](https://github.com/Iron-Mark/qwen-ui-lab)
- Live demo: [qwen-ui-lab.vercel.app](https://qwen-ui-lab.vercel.app)

## Goal

Test whether Qwen can help shorten the front-end workflow from visual reference to usable component structure.

## Workflow

1. Upload UI screenshot to Qwen3-VL
2. Extract layout, hierarchy, components, spacing, and accessibility risks
3. Convert analysis into a React/Tailwind component plan
4. Use Qwen Code Plan Mode to inspect the project before editing
5. Generate a first-pass scaffold
6. Refactor manually for accessibility, responsiveness, naming, and maintainability

## Project Structure

```
src/
  app/              — Next.js App Router pages
  components/       — Reusable UI components
    dashboard/      — Dashboard component system
  data/             — Mock data files
  lib/              — Utilities (cn, etc.)
experiments/
  01-dashboard/     — First case study artifacts
public/
  references/       — Original UI screenshots
  results/          — Before/after comparisons
.qwen/
  skills/
    ui-to-component/ — Reusable Qwen Code skill
```

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Verification

Run the local quality gates before publishing or deploying:

```bash
npm audit --audit-level=moderate
npm run lint
npm run build
```

Current security posture: `npm audit --audit-level=moderate` reports `0 vulnerabilities`.

## What Worked

- Layout decomposition
- Component grouping
- Naming suggestions
- First-pass Tailwind structure

## What Failed

- Exact spacing fidelity
- Accessibility details
- Responsive edge cases
- Product logic
- Overly generic component names

## Final Takeaway

AI is useful for decomposition and scaffolding. It is not a replacement for front-end judgment.

## Tech Stack

- [Next.js](https://nextjs.org/) (App Router)
- [React](https://react.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/)

## Sources

- [Qwen3-VL GitHub](https://github.com/qwenlm/qwen3-vl)
- [Qwen Code Docs](https://qwenlm.github.io/qwen-code-docs/en/users/overview/)
