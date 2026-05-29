# qwen-ui-lab

An AI-assisted workflow for converting UI screenshots into React/Tailwind component scaffolds using Qwen3-VL and Qwen Code.

## Links

- Repository: [github.com/Iron-Mark/qwen-ui-lab](https://github.com/Iron-Mark/qwen-ui-lab)
- Live demo: [qwen-ui-lab.vercel.app](https://qwen-ui-lab.vercel.app)

## Goal

Test whether Qwen can help shorten the front-end workflow from visual reference to usable component structure.

## Presenting live

See **[DEMO.md](./DEMO.md)** for a 30-second setup, click-by-click script, and pre-flight checklist. No API key is required for the offline demo path.

## Live Demo Flow

The app now includes an interactive local demo mode:

1. Upload or drag in a UI screenshot, or click **Use sample screenshot**.
2. Preview the uploaded image in the browser.
3. Run local analysis to produce a structured component plan.
4. Generate a React/Tailwind scaffold preview.
5. Inspect the generated code and live preview cards.

The Analyze step calls `/api/analyze-ui`, a server-side Qwen provider route. When `DASHSCOPE_API_KEY` is configured, the route sends the uploaded image to Qwen through Alibaba Cloud Model Studio's OpenAI-compatible vision API. When the key is missing, the base URL is wrong, Qwen returns an error, or the network fails, the UI falls back to local demo analysis and shows an **Offline demo mode** banner so the flow remains presentable without pretending the live API succeeded.

## Qwen API Environment

Copy `.env.example` to `.env.local` for local development and set:

```bash
DASHSCOPE_API_KEY=<your-model-studio-api-key>
QWEN_MODEL=qwen3-vl-plus
QWEN_BASE_URL=https://dashscope-intl.aliyuncs.com/compatible-mode/v1
```

For Vercel production, add the key as a server-side environment variable:

```bash
vercel env add DASHSCOPE_API_KEY production
vercel env add QWEN_MODEL production
vercel env add QWEN_BASE_URL production
```

Do not use `NEXT_PUBLIC_` for the API key. The key must stay server-only.

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
    api/analyze-ui/ — Server-side Qwen provider route
  components/       — Reusable UI components
    UploadFlow.tsx  — Interactive upload/analyze/generate demo
    dashboard/      — Dashboard component system
  data/             — Mock data files
  lib/              — Utilities and local flow generation
tests/              — Node test coverage for local generation and fallback logic
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
npm test
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
