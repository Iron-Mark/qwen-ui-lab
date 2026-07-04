// ============================================================
// REVIEWED STARTER VERSION
// ============================================================
// This is the reviewed starter version after component review.
// The actual compiled components live in src/components/dashboard/.
// This file is a documentation artifact - excluded from compilation.
//
// Changes from first-pass-starter.tsx:
//
// STRUCTURE
// - Split monolithic page into 7 focused components
// - Created DashboardShell as layout orchestrator
// - Separated data into typed interfaces (dashboard-data.ts)
// - Added cn() utility (clsx + tailwind-merge)
//
// NAMING
// - "Card" -> StatCard, RevenueCard, ActivityList, etc.
// - Inline data -> StatCardData, ActivityData, RevenueDataPoint
// - Added getInitials() helper for avatar logic
//
// STYLING
// - All inline styles -> Tailwind CSS classes
// - Hardcoded colors -> CSS custom properties (design tokens)
// - Added full dark mode support with class-based toggle
// - Added smooth theme transition (background, border, color)
// - Added tabular-nums for aligned revenue values
//
// ACCESSIBILITY
// - Added semantic HTML: <ul>/<li>, <time>, <nav>, <section>
// - Added aria-label on dashboard sections
// - Added aria-hidden on decorative elements (avatars, icons)
// - Added role="meter" with ARIA attributes on revenue bars
// - Added focus-visible rings on interactive elements
// - Added type="button" on non-form buttons
// - Trend arrows alongside colors (never color-only indicators)
//
// RESPONSIVENESS
// - Mobile-first grid: 1 -> 2 -> 4 columns for stats
// - Revenue + Chart: stacked -> 57/43 split on lg
// - Activity + Quick Actions: stacked -> 50/50 on lg
// - Workflow banner wraps naturally with flex-wrap
//
// ROBUSTNESS
// - Guarded division by zero in RevenueCard
// - Added empty state for ActivityList
// - Text truncation with min-w-0 on activity items
// - Exhaustive switch for icon types (no string map)
//
// THEME
// - ThemeProvider with localStorage persistence
// - Inline <script> in <head> to prevent flash
// - suppressHydrationWarning on <html>
// - Lazy useState initializer (not useEffect)
// ============================================================

import { StatCard } from "@/components/dashboard/StatCard";
import { RevenueCard } from "@/components/dashboard/RevenueCard";
import { ActivityList } from "@/components/dashboard/ActivityList";
import { QuickActionButton } from "@/components/dashboard/QuickActionButton";
import { ChartPreview } from "@/components/dashboard/ChartPreview";
import { WorkflowBanner } from "@/components/dashboard/WorkflowBanner";
import type {
  StatCardData,
  RevenueDataPoint,
  ActivityData,
  QuickActionData,
} from "@/features/home/data/dashboard-data";

interface DashboardShellProps {
  stats: StatCardData[];
  revenueData: RevenueDataPoint[];
  activities: ActivityData[];
  quickActions: QuickActionData[];
}

export function DashboardShell({
  stats,
  revenueData,
  activities,
  quickActions,
}: DashboardShellProps) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold tracking-tight text-foreground">
          Dashboard
        </h2>
        <p className="mt-2 text-muted-foreground">
          Welcome back! Here&apos;s what&apos;s happening with your platform.
        </p>
      </div>

      <div className="grid gap-6">
        <WorkflowBanner />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <StatCard key={stat.label} stat={stat} />
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-7">
          <div className="lg:col-span-4">
            <RevenueCard data={revenueData} />
          </div>
          <div className="lg:col-span-3">
            <ChartPreview data={revenueData} />
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <ActivityList activities={activities} />
          <div className="rounded-lg border border-border bg-card p-6">
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-card-foreground">
                Quick Actions
              </h3>
              <p className="text-sm text-muted-foreground">
                Common tasks and shortcuts
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              {quickActions.map((action) => (
                <QuickActionButton key={action.id} action={action} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
