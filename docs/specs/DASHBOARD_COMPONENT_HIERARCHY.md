# Component Hierarchy

> Derived from Qwen3-VL breakdown, refined during human review.

## Final Tree

```
<ThemeProvider>
  <Header>
    <Logo (brand link) />
    <nav aria-label from i18n>
      Workflow link
      Design system link
    </nav>
    <Account entry />
    <AppearanceMenu (includes theme toggle) />
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
    <nav (product)>
      <ul>
        <li> Workflow (/) </li>
        <li> Design system (/design-system) </li>
        <li> Sample run (/demo) </li>
      </ul>
    </nav>
    <nav (resources)>
      <ul>
        <li> Qwen3-VL link </li>
        <li> Qwen Code docs link </li>
        <li> Source repo link </li>
      </ul>
    </nav>
    <nav (social)>
      <ul>
        <li> GitHub profile link </li>
        <li> LinkedIn link </li>
        <li> Portfolio website link </li>
      </ul>
    </nav>
  </Footer>
</ThemeProvider>
```

## Component Details

| Component | File | Props | State | Accessibility |
|-----------|------|-------|-------|---------------|
| `ThemeProvider` | `src/components/providers/ThemeProvider.tsx` | children | theme (context) | - |
| `ThemeToggle` | `src/features/shell/components/ThemeToggle.tsx` | - | reads context | `aria-label` |
| `Header` | `src/features/shell/components/Header.tsx` | - | - | `<header>` semantic |
| `Footer` | `src/features/shell/components/Footer.tsx` | - | - | `<footer>`, `<nav>`, `<ul>` |
| `DashboardShell` | `src/features/home/components/DashboardShell.tsx` | stats[], revenueData[], activities[], quickActions[] | - | `aria-label` |
| `WorkflowBanner` | `src/features/home/components/WorkflowBanner.tsx` | - | - | `<section>`, `<ol>`, `aria-label` |
| `StatCard` | `src/features/home/components/StatCard.tsx` | StatCardData | - | `aria-hidden` on trend arrows |
| `RevenueCard` | `src/features/home/components/RevenueCard.tsx` | RevenueDataPoint[] | - | `role="meter"`, ARIA value attrs |
| `ChartPreview` | `src/features/home/components/ChartPreview.tsx` | - | - | Text summary for chart area |
| `ActivityList` | `src/features/home/components/ActivityList.tsx` | ActivityData[] | - | `<ul>`, `<time>`, `aria-hidden` avatars |
| `QuickActionButton` | `src/features/home/components/QuickActionButton.tsx` | QuickActionData | - | `focus-visible`, `type="button"` |

## Data Types

```typescript
StatCardData     { label, value, change, trend }
RevenueDataPoint { month, revenue }
PerformanceDataPoint { week, sessions }
ChannelMixPoint  { channel, share }
ActivityData     { id, user, action, timestamp }
QuickActionData  { id, label, icon: "user-plus" | "file-text" | "mail" | "settings" }
```

## File Map

```
src/
  app/
    layout.tsx          - Root layout, theme script, providers
    page.tsx            - Dashboard page, imports data
    globals.css         - Design tokens, transitions, dark mode
  components/
    providers/
      ThemeProvider.tsx  - Theme context + localStorage
  features/
    shell/
      components/
        ThemeToggle.tsx  - Sun/moon SVG toggle
        Header.tsx       - Top nav with logo
        Footer.tsx       - Footer with links
    home/
      components/
        DashboardShell.tsx - Layout orchestrator
        StatCard.tsx       - KPI metric card
        RevenueCard.tsx    - Horizontal bar chart
        ActivityList.tsx   - Activity feed
        QuickActionButton.tsx - Action button
        ChartPreview.tsx   - Chart summary preview
        ThemedChartPreview.tsx - Theme-aware chart wrapper
        WorkflowBanner.tsx - Pipeline visualization
      data/
        dashboard-data.ts  - Typed example data + interfaces
  lib/
    utils.ts             - cn() clsx + tailwind-merge utility
```
