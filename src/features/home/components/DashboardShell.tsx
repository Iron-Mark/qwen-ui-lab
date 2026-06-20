import { PageContainer } from "@/components/layout/PageContainer";
import { StatCard } from "@/features/home/components/StatCard";
import { RevenueCard } from "@/features/home/components/RevenueCard";
import { ActivityList } from "@/features/home/components/ActivityList";
import { QuickActionButton } from "@/features/home/components/QuickActionButton";
import { ChartPreview } from "@/features/home/components/ChartPreview";
import { WorkflowBanner } from "@/features/home/components/WorkflowBanner";
import { ObservabilityErrorBoundary } from "@/components/providers/ObservabilityErrorBoundary";
import { Sparkles } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type {
  StatCardData,
  RevenueDataPoint,
  ActivityData,
  QuickActionData,
  PerformanceDataPoint,
  ChannelMixPoint,
} from "@/features/home/data/dashboard-data";

interface DashboardShellProps {
  stats: StatCardData[];
  revenueData: RevenueDataPoint[];
  performanceData: PerformanceDataPoint[];
  channelMixData: ChannelMixPoint[];
  activities: ActivityData[];
  quickActions: QuickActionData[];
}

export function DashboardShell({
  stats,
  revenueData,
  performanceData,
  channelMixData,
  activities,
  quickActions,
}: DashboardShellProps) {
  return (
    <PageContainer className="py-10">
      <Card className="mb-8 overflow-hidden border-border/60 bg-gradient-to-br from-card to-muted/30">
        <CardHeader>
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-border/70 bg-background/80 px-3 py-1 text-xs font-semibold text-muted-foreground">
            <Sparkles className="size-3.5" />
            Live product snapshot
          </div>
          <CardTitle className="mt-3 text-3xl tracking-tight sm:text-4xl">
            Dashboard
          </CardTitle>
          <CardDescription className="max-w-2xl text-base leading-7">
            Welcome back! Here&apos;s what&apos;s happening with your platform.
            Metrics, activity, and generation workflow are all in one place.
          </CardDescription>
        </CardHeader>
      </Card>

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
            <ObservabilityErrorBoundary fallbackTitle="Chart preview failed to render.">
              <ChartPreview
                performanceData={performanceData}
                channelMixData={channelMixData}
              />
            </ObservabilityErrorBoundary>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <ActivityList activities={activities} />
          <Card className="border-border/80 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
              <CardDescription>Common tasks and shortcuts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                {quickActions.map((action) => (
                  <QuickActionButton key={action.id} action={action} />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
}
