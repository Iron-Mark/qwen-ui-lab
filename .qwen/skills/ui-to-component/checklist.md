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
