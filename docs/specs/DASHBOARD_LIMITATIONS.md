# Limitations & Lessons Learned

## What Qwen Got Right

- Correctly identified the dashboard layout sections (stats, charts, activity, actions)
- Suggested practical component groupings that matched the visual hierarchy
- Produced usable first-pass Tailwind class structures
- Identified reusable patterns (stat cards, activity items, card containers)
- Reduced blank-page friction - had a working scaffold in minutes instead of hours
- The Plan Mode output was well-structured and actionable

## What Qwen Got Wrong

- **Inline styles over Tailwind** - Defaulted to `style={{ }}` instead of Tailwind classes
- **No semantic HTML** - Used `<div>` for everything instead of `<ul>`, `<time>`, `<nav>`, `<section>`
- **No accessibility** - No `aria-label`, no `role`, no focus management, no `aria-hidden`
- **Generic naming** - "Card" instead of "StatCard", no TypeScript interfaces
- **No responsive design** - Fixed grid with no breakpoints
- **No dark mode** - Hardcoded light-mode colors
- **Emoji icons** - Used emoji strings instead of proper SVG icons
- **No empty states** - Components assume data always exists
- **No edge case handling** - Division by zero, text overflow, missing data
- **Monolithic structure** - Single 300+ line component instead of small composable pieces

## What Required Human Judgment

- **Design token system** - Creating a CSS custom property palette (card, muted, border, success, danger, chart) with light/dark variants
- **Responsive strategy** - Deciding when to stack vs. side-by-side, which breakpoints to use
- **Accessibility patterns** - ARIA labels, heading hierarchy, focus rings, semantic elements
- **Data flow architecture** - Props vs. context, typed interfaces, data file separation
- **Theme persistence** - Inline script + context + localStorage pattern
- **Component API design** - Prop shapes, union types for icons, component boundaries
- **Production robustness** - Empty states, division guards, text truncation, hydration safety

## Surprises

- The `react-hooks/set-state-in-effect` lint rule forced a better initialization pattern (lazy `useState` initializer instead of `useEffect`)
- AI tends to over-engineer simple components and under-engineer complex ones
- The inline `<script>` approach for theme flash prevention is standard but never appeared in AI output
- Qwen3-VL's visual breakdown was more useful than the code generation - the planning phase added more value than the scaffold phase

## Key Lessons

1. **AI is a starting point, not a destination.** The scaffold saved time but needed significant rework for production quality.

2. **Plan Mode is the most valuable feature.** Reviewing before editing catches structural issues early.

3. **Accessibility is never automatic.** AI treats it as optional - humans must enforce it.

4. **Type safety is a human responsibility.** AI can produce `any`-adjacent code unless explicitly prompted for types.

5. **Design systems require human taste.** Color palettes, spacing scales, and component boundaries need intentional decisions.

## Recommendations for Next Iteration

- Provide the design token system upfront in the prompt to avoid inline styles
- Include explicit accessibility requirements in every prompt
- Use Plan Mode to review component API before scaffolding
- Test responsive output at multiple breakpoints immediately after generation
- Consider creating a reusable `.qwen/skills/ui-to-component/` skill to enforce standards
- Add `eslint-plugin-jsx-a11y` to catch accessibility issues at build time
