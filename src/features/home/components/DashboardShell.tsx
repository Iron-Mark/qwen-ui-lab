import { PageContainer } from "@/components/layout/PageContainer";
import Link from "next/link";
import { StatCard } from "./StatCard";
import { RevenueCard } from "./RevenueCard";
import { ActivityList } from "./ActivityList";
import { QuickActionButton } from "./QuickActionButton";
import { ChartPreview } from "./ChartPreview";
import { WorkflowBanner } from "./WorkflowBanner";
import { ObservabilityErrorBoundary } from "@/components/providers/ObservabilityErrorBoundary";
import {
  ArrowRight,
  ArrowUp,
  ChevronDown,
  LayoutDashboard,
  Sparkles,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type {
  StatCardData,
  RevenueDataPoint,
  ActivityData,
  QuickActionData,
  PerformanceDataPoint,
  ChannelMixPoint,
} from "../data/dashboard-data";

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
      <Card
        className="mb-5 overflow-hidden border-border/70 bg-card/95 shadow-sm md:mb-8"
        data-testid="example-output-section"
      >
        <CardHeader className="gap-5 md:flex-row md:items-end md:justify-between">
          <div className="min-w-0">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-border/70 bg-background/80 px-3 py-1 text-xs font-semibold text-muted-foreground">
              <Sparkles className="size-3.5" aria-hidden />
              Example output
            </div>
            <CardTitle
              role="heading"
              aria-level={2}
              className="mt-3 text-2xl tracking-tight sm:text-3xl"
            >
              Dashboard sample
            </CardTitle>
            <CardDescription className="mt-2 max-w-2xl text-sm leading-6 sm:text-base">
              A built-in dashboard result you can load into the real analyzer.
              Use it to inspect the plan, generated scaffold, detection boxes,
              and export flow without uploading your own screenshot.
            </CardDescription>
          </div>
          <div className="flex flex-col gap-2 min-[420px]:flex-row md:shrink-0">
            <Link
              href="/demo#upload-flow"
              className={cn(buttonVariants({ size: "lg" }), "gap-2")}
            >
              Load this sample
              <ArrowRight className="size-4" aria-hidden />
            </Link>
            <Link
              href="#upload-flow"
              aria-label="Pick a different sample in the upload flow"
              className={cn(buttonVariants({ variant: "outline", size: "lg" }), "gap-2")}
            >
              <ArrowUp className="size-4" aria-hidden />
              Pick a different sample
            </Link>
          </div>
        </CardHeader>
      </Card>

      <details
        className="group mb-5 rounded-xl border border-border/70 bg-card/80 p-4 md:hidden"
        data-testid="mobile-example-output-preview"
      >
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold text-card-foreground [&::-webkit-details-marker]:hidden">
          <span className="inline-flex min-w-0 items-center gap-2">
            <LayoutDashboard className="size-4 shrink-0 text-primary" aria-hidden />
            Preview static dashboard
          </span>
          <ChevronDown
            className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
            aria-hidden
          />
        </summary>
        <div className="mt-4 grid gap-4">
          <WorkflowBanner />
          <div className="grid gap-3">
            {stats.slice(0, 2).map((stat) => (
              <StatCard key={stat.label} stat={stat} />
            ))}
          </div>
        </div>
      </details>

      <div className="hidden gap-6 md:grid" data-testid="desktop-example-output-preview">
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
