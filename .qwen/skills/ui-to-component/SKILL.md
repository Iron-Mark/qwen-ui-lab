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
