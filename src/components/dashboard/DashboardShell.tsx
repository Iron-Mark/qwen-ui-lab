import { StatCard } from "./StatCard";
import { RevenueCard } from "./RevenueCard";
import { ActivityList } from "./ActivityList";
import { QuickActionButton } from "./QuickActionButton";
import { ChartPreview } from "./ChartPreview";
import { WorkflowBanner } from "./WorkflowBanner";
import type {
  StatCardData,
  RevenueDataPoint,
  ActivityData,
  QuickActionData,
} from "@/data/dashboard-data";

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
            <ChartPreview />
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
