# UI to Component Skill Spec

## Source: SKILL.md

---
name: ui-to-component
description: Use this skill when converting UI screenshots, design references, or visual UI descriptions into clean React, TypeScript, and Tailwind component scaffolds.
paths:
  - "src/**/*.tsx"
  - "src/**/*.ts"
  - "src/components/**/*"
---

# UI to Component Skill

## Purpose

Help convert UI references into clean, maintainable React/TypeScript/Tailwind components.

## Workflow

1. Analyze the UI reference or description.
2. Identify layout structure, reusable components, and visual hierarchy.
3. Create a component hierarchy before writing code.
4. Plan props, mock data, and file structure.
5. Generate small reusable components.
6. Review accessibility, responsiveness, naming, and maintainability.
7. Avoid over-engineering.

## Front-End Rules

- Use semantic HTML.
- Use TypeScript.
- Use Tailwind CSS.
- Keep components small and composable.
- Use mock data from local data files.
- Avoid unnecessary dependencies.
- Do not hardcode repeated content.
- Prefer readable Tailwind grouping.
- Include loading, empty, and error states when relevant.

## Review Checklist

Before finalizing, check:

- Is the layout responsive?
- Are components reusable?
- Are props clean and minimal?
- Are interactive elements accessible?
- Are headings structured correctly?
- Are repeated UI blocks data-driven?
- Are class names readable?
- Is the component easy to extend?


## Source: checklist.md

# UI-to-Component Checklist

Use this before finalizing any generated component.

## Structure

- [ ] Component hierarchy matches visual layout
- [ ] Props are typed with TypeScript interfaces
- [ ] Mock data is separated into a data file
- [ ] No hardcoded repeated content

## Accessibility

- [ ] Interactive elements have accessible labels
- [ ] Headings follow a logical hierarchy (h1 → h2 → h3)
- [ ] Images have alt text
- [ ] Color contrast meets WCAG AA

## Responsiveness

- [ ] Layout tested at mobile, tablet, and desktop
- [ ] No horizontal overflow at small viewports
- [ ] Text truncation where needed

## Code Quality

- [ ] Component names are descriptive
- [ ] No unused imports or variables
- [ ] Tailwind classes are grouped logically
- [ ] No inline styles where Tailwind classes exist

## States

- [ ] Loading state handled
- [ ] Empty state handled
- [ ] Error state handled


## Source: component-template.md

# Component Template

Use this as a starting point for new components.

```tsx
import { cn } from "@/lib/cn";

interface ComponentNameProps {
  // Define props here
}

export function ComponentName({ /* destructure props */ }: ComponentNameProps) {
  return (
    <div>
      {/* Component content */}
    </div>
  );
}
```

## Rules

- Always use named exports (not default exports).
- Always define a typed props interface.
- Keep components under ~80 lines.
- Extract sub-components if a section grows too large.
