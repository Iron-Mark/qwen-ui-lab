# Qwen Code Plan Mode Output

> Generated using Qwen Code Plan Mode with Prompt 4.

## Prompt Used

```txt
/plan

I am building a React/Tailwind dashboard component from a UI screenshot.

Analyze the current project structure and create an implementation plan.

Do not edit files yet.

I need:
1. Recommended file structure
2. Component breakdown
3. Props/data structure
4. Tailwind layout strategy
5. Accessibility checklist
6. Risks before implementation
```

## Output

### 1. Recommended File Structure

```
src/
  app/
    layout.tsx              — Root layout with ThemeProvider, Header, Footer
    page.tsx                — Dashboard page, imports data + DashboardShell
    globals.css             — Design tokens, dark mode, base styles
  components/
    Header.tsx              — Top nav bar with branding + theme toggle
    Footer.tsx              — Footer with links
    ThemeProvider.tsx        — Dark/light mode context
    ThemeToggle.tsx          — Toggle button with sun/moon icons
    dashboard/
      DashboardShell.tsx    — Layout orchestrator
      StatCard.tsx           — Single KPI metric card
      RevenueCard.tsx        — Horizontal bar chart
      ActivityList.tsx       — Recent activity feed
      QuickActionButton.tsx  — Action shortcut button
      ChartPreview.tsx       — Placeholder for charting library
      WorkflowBanner.tsx     — Pipeline visualization
  data/
    dashboard-data.ts       — Typed mock data + interfaces
  lib/
    cn.ts                   — clsx + tailwind-merge utility
```

### 2. Component Breakdown

| Component | Type | Responsibility |
|-----------|------|---------------|
| `DashboardShell` | Layout | Orchestrates grid layout, receives all data as props |
| `StatCard` | Presentational | Displays label, value, trend indicator |
| `RevenueCard` | Presentational | Renders horizontal bar chart from data array |
| `ActivityList` | Presentational | Renders activity feed with avatars |
| `QuickActionButton` | Interactive | Button with icon + label |
| `ChartPreview` | Placeholder | Dashed-border placeholder for future chart |
| `WorkflowBanner` | Presentational | Shows 6-step pipeline |
| `ThemeProvider` | Provider | Manages theme state + localStorage persistence |
| `ThemeToggle` | Interactive | Sun/moon toggle button |
| `Header` | Layout | Top nav with logo + toggle |
| `Footer` | Layout | Footer with external links |

### 3. Props/Data Structure

```typescript
// StatCardData
{ label: string; value: string; change: string; trend: "up" | "down" | "flat" }

// RevenueDataPoint
{ month: string; revenue: number }

// ActivityData
{ id: string; user: string; action: string; timestamp: string }

// QuickActionData
{ id: string; label: string; icon: "user-plus" | "file-text" | "mail" | "settings" }

// DashboardShellProps
{ stats: StatCardData[]; revenueData: RevenueDataPoint[]; activities: ActivityData[]; quickActions: QuickActionData[] }
```

### 4. Tailwind Layout Strategy

- **Grid system**: CSS Grid via Tailwind `grid-cols-*` classes
  - Stats: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`
  - Revenue + Chart: `lg:grid-cols-7` with `lg:col-span-4` / `lg:col-span-3`
  - Activity + Quick Actions: `lg:grid-cols-2`
- **Spacing**: `gap-4` for stat cards, `gap-6` for section rows
- **Container**: `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8`
- **Cards**: `rounded-lg border border-border bg-card p-6`
- **Dark mode**: Class-based via `@custom-variant dark` with CSS custom properties
- **Responsive**: Mobile-first, stack on small screens, expand on `sm:`, `lg:` breakpoints

### 5. Accessibility Checklist

- [ ] Semantic heading hierarchy (h1 in Header → h2 page title → h3 section titles)
- [ ] `aria-label` on dashboard sections
- [ ] `aria-hidden` on decorative icons and avatar initials
- [ ] `<time>` element for timestamps
- [ ] `role="meter"` with ARIA attributes on revenue bars
- [ ] `focus-visible` ring on all interactive elements
- [ ] `type="button"` on non-form buttons
- [ ] Color is never the sole indicator (trend arrows alongside colors)
- [ ] Empty state handling for lists
- [ ] Keyboard navigation works for all interactive elements

### 6. Risks Before Implementation

1. **Theme flash on load** — Need inline `<script>` to set `.dark` class before React hydrates
2. **Hydration mismatch** — `suppressHydrationWarning` needed on `<html>` for theme
3. **setState in effect** — Theme initialization must use lazy `useState` initializer, not `useEffect`
4. **Division by zero** — Revenue bars need guarded `maxRevenue > 0` check
5. **Text overflow** — Activity list items need `truncate` + `min-w-0` pattern
6. **Tabular numbers** — Revenue values need `tabular-nums` for aligned columns
