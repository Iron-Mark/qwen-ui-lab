# Component Hierarchy

> Derived from Qwen3-VL breakdown, refined during human review.

## Final Tree

```
<ThemeProvider>
  <Header>
    <Logo (inline SVG) />
    <ThemeToggle />
  </Header>

  <main>
    <DashboardShell>
      <PageHeader (inline h2 + p) />
      <WorkflowBanner />

      <div grid sm:2 lg:4>
        <StatCard /> × 4
      </div>

      <div grid lg:7>
        <RevenueCard />          - col-span-4
        <ChartPreview />         - col-span-3
      </div>

      <div grid lg:2>
        <ActivityList />         - ul/li with avatars
        <QuickActionsPanel />    - inline card
          <QuickActionButton /> × 4
      </div>
    </DashboardShell>
  </main>

  <Footer>
    <nav aria-label="External links">
      <ul>
        <li> Qwen3-VL link </li>
        <li> Qwen Code link </li>
        <li> GitHub link </li>
      </ul>
    </nav>
  </Footer>
</ThemeProvider>
```

## Component Details

| Component | File | Props | State | Accessibility |
|-----------|------|-------|-------|---------------|
| `ThemeProvider` | `ThemeProvider.tsx` | children | theme (context) | - |
| `ThemeToggle` | `ThemeToggle.tsx` | - | reads context | `aria-label` |
| `Header` | `Header.tsx` | - | - | `<header>` semantic |
| `Footer` | `Footer.tsx` | - | - | `<footer>`, `<nav>`, `<ul>` |
| `DashboardShell` | `DashboardShell.tsx` | stats[], revenueData[], activities[], quickActions[] | - | `aria-label` |
| `WorkflowBanner` | `WorkflowBanner.tsx` | - | - | `<section>`, `<ol>`, `aria-label` |
| `StatCard` | `StatCard.tsx` | StatCardData | - | `aria-hidden` on trend arrows |
| `RevenueCard` | `RevenueCard.tsx` | RevenueDataPoint[] | - | `role="meter"`, ARIA value attrs |
| `ChartPreview` | `ChartPreview.tsx` | - | - | Text summary for chart area |
| `ActivityList` | `ActivityList.tsx` | ActivityData[] | - | `<ul>`, `<time>`, `aria-hidden` avatars |
| `QuickActionButton` | `QuickActionButton.tsx` | QuickActionData | - | `focus-visible`, `type="button"` |

## Data Types

```typescript
StatCardData    { label, value, change, trend }
RevenueDataPoint { month, revenue }
ActivityData    { id, user, action, timestamp }
QuickActionData { id, label, icon: "user-plus" | "file-text" | "mail" | "settings" }
```

## File Map

```
src/
  app/
    layout.tsx          - Root layout, theme script, providers
    page.tsx            - Dashboard page, imports data
    globals.css         - Design tokens, transitions, dark mode
  components/
    ThemeProvider.tsx    - Theme context + localStorage
    ThemeToggle.tsx      - Sun/moon SVG toggle
    Header.tsx           - Top nav with logo
    Footer.tsx           - Footer with links
    dashboard/
      DashboardShell.tsx - Layout orchestrator
      StatCard.tsx       - KPI metric card
      RevenueCard.tsx    - Horizontal bar chart
      ActivityList.tsx   - Activity feed
      QuickActionButton.tsx - Action button
      ChartPreview.tsx   - Chart summary preview
      WorkflowBanner.tsx - Pipeline visualization
  data/
    dashboard-data.ts    - Typed sample data + interfaces
  lib/
    cn.ts                - clsx + tailwind-merge utility
```
