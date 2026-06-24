"use client";

import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Boxes,
  Code2,
  Download,
  Eye,
  FileCode2,
  LayoutDashboard,
  ListChecks,
  PanelsTopLeft,
  ScanSearch,
  Sparkles,
  UploadCloud,
} from "lucide-react";
import { ActivityList } from "./ActivityList";
import { ChartPreview } from "./ChartPreview";
import { QuickActionButton } from "./QuickActionButton";
import { RevenueCard } from "./RevenueCard";
import { StatCard } from "./StatCard";
import { WorkflowBanner } from "./WorkflowBanner";
import { ObservabilityErrorBoundary } from "@/components/providers/ObservabilityErrorBoundary";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type {
  ActivityData,
  ChannelMixPoint,
  PerformanceDataPoint,
  QuickActionData,
  RevenueDataPoint,
  StatCardData,
} from "../data/dashboard-data";

interface DashboardSampleDialogProps {
  stats: StatCardData[];
  revenueData: RevenueDataPoint[];
  performanceData: PerformanceDataPoint[];
  channelMixData: ChannelMixPoint[];
  activities: ActivityData[];
  quickActions: QuickActionData[];
}

const samplePlan = [
  {
    title: "Capture layout",
    body: "Map the dashboard shell into sections, metric cards, charts, activity, and actions.",
    icon: ScanSearch,
  },
  {
    title: "Detect primitives",
    body: "Snap repeated regions to cards, badges, chart containers, avatar rows, and buttons.",
    icon: Boxes,
  },
  {
    title: "Generate scaffold",
    body: "Export a React + Tailwind component tree that matches the sample hierarchy.",
    icon: Code2,
  },
  {
    title: "Refine output",
    body: "Use editable boxes and confidence reasons before copying or downloading code.",
    icon: Sparkles,
  },
] as const;

const detectedUi = [
  {
    label: "Metric cards",
    value: "4",
    body: "Repeated KPI cards with title, value, and change indicators.",
    icon: LayoutDashboard,
  },
  {
    label: "Chart regions",
    value: "2",
    body: "Revenue bars plus channel mix visualization containers.",
    icon: BarChart3,
  },
  {
    label: "Activity feed",
    value: "5 rows",
    body: "Avatar, name, event summary, and timestamp rhythm.",
    icon: ListChecks,
  },
  {
    label: "Action controls",
    value: "4",
    body: "Icon-leading buttons grouped as quick shortcuts.",
    icon: PanelsTopLeft,
  },
] as const;

const exportOptions = [
  {
    title: "React component",
    body: "Dashboard layout scaffold with reusable cards, charts, and action groups.",
    icon: FileCode2,
  },
  {
    title: "Tailwind styling",
    body: "Token-based spacing, surfaces, borders, and responsive grids.",
    icon: Sparkles,
  },
  {
    title: "Local download",
    body: "Copy TSX or export the scaffold zip from the workflow.",
    icon: Download,
  },
] as const;

export function DashboardSampleDialog({
  stats,
  revenueData,
  performanceData,
  channelMixData,
  activities,
  quickActions,
}: DashboardSampleDialogProps) {
  return (
    <Dialog>
      <section
        className="mb-5 rounded-2xl border border-border/70 bg-background/80 p-3 shadow-sm md:mb-8"
        data-testid="example-output-section"
        aria-labelledby="dashboard-sample-heading"
      >
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex min-w-0 gap-3 sm:gap-4">
            <DashboardSampleThumbnail />
            <div className="min-w-0 py-1 sm:py-2">
              <div className="inline-flex w-fit items-center gap-2 rounded-full border border-border/70 bg-background/80 px-2.5 py-1 text-xs font-semibold text-muted-foreground">
                <Sparkles className="size-3.5" aria-hidden />
                Sample output
              </div>
              <h2
                id="dashboard-sample-heading"
                className="mt-2 font-display text-xl font-semibold tracking-tight text-card-foreground sm:text-2xl"
              >
                Dashboard sample
              </h2>
              <p className="mt-1 max-w-xl text-sm leading-6 text-muted-foreground">
                See what a generated result looks like.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2 min-[420px]:flex-row md:shrink-0">
            <Tooltip>
              <TooltipTrigger
                render={
                  <Link
                    href="/demo#upload-flow"
                    className={cn(buttonVariants({ size: "lg" }), "gap-2")}
                  />
                }
              >
                Load sample
                <ArrowRight className="size-4" aria-hidden />
              </TooltipTrigger>
              <TooltipContent side="top">
                Load the dashboard reference into the analyzer.
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger
                render={
                  <DialogTrigger
                    type="button"
                    aria-haspopup="dialog"
                    className={cn(
                      buttonVariants({ variant: "outline", size: "lg" }),
                      "gap-2",
                    )}
                  />
                }
              >
                <Eye className="size-4" aria-hidden />
                Preview
              </TooltipTrigger>
              <TooltipContent side="top">
                Open the full generated sample without leaving this page.
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </section>

      <DialogContent
        className="flex h-[calc(100dvh-1rem)] max-h-[calc(100dvh-1rem)] w-[calc(100vw-1rem)] max-w-[calc(100vw-1rem)] flex-col gap-0 overflow-hidden p-0 sm:h-[min(88dvh,52rem)] sm:max-w-6xl sm:rounded-2xl"
        data-testid="dashboard-sample-dialog"
      >
        <DialogHeader className="shrink-0 border-b border-border bg-muted/20 px-4 py-4 pr-12 sm:px-5">
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-border/70 bg-background/80 px-2.5 py-1 text-xs font-semibold text-muted-foreground">
            <PanelsTopLeft className="size-3.5 text-primary" aria-hidden />
            Sample preview
          </div>
          <DialogTitle className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
            Dashboard sample
          </DialogTitle>
          <DialogDescription className="max-w-2xl leading-6">
            Preview the generated dashboard, inspect the plan, then load it into
            the workflow.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="preview" className="min-h-0 flex-1 gap-0">
          <div className="shrink-0 px-4 py-3 sm:px-5">
            <TabsList
              aria-label="Dashboard sample sections"
              className="grid h-auto w-full grid-cols-2 gap-1.5 overflow-visible rounded-2xl border border-border/70 bg-muted/35 p-1.5 shadow-inner group-data-horizontal/tabs:h-auto sm:inline-grid sm:w-auto sm:grid-cols-4"
            >
              <TabsTrigger
                value="preview"
                className="h-10 min-h-10 rounded-xl px-3 text-xs sm:text-sm"
              >
                <Eye className="size-4" aria-hidden />
                Preview
              </TabsTrigger>
              <TabsTrigger
                value="plan"
                className="h-10 min-h-10 rounded-xl px-3 text-xs sm:text-sm"
              >
                <ListChecks className="size-4" aria-hidden />
                Plan
              </TabsTrigger>
              <TabsTrigger
                value="detected"
                className="h-10 min-h-10 rounded-xl px-3 text-xs sm:text-sm"
              >
                <ScanSearch className="size-4" aria-hidden />
                Detected UI
              </TabsTrigger>
              <TabsTrigger
                value="export"
                className="h-10 min-h-10 rounded-xl px-3 text-xs sm:text-sm"
              >
                <Download className="size-4" aria-hidden />
                Export
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="preview" className="min-h-0 flex-1">
            <ScrollArea className="h-full" data-testid="dashboard-sample-dialog-preview">
              <div className="grid gap-5 p-4 sm:p-5">
                <WorkflowBanner />

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {stats.map((stat) => (
                    <StatCard key={stat.label} stat={stat} />
                  ))}
                </div>

                <div className="grid gap-5 lg:grid-cols-7">
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

                <div className="grid gap-5 lg:grid-cols-2">
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
            </ScrollArea>
          </TabsContent>

          <TabsContent value="plan" className="min-h-0 flex-1">
            <ScrollArea className="h-full">
              <div className="grid gap-3 p-4 sm:grid-cols-2 sm:p-5">
                {samplePlan.map(({ title, body, icon: Icon }, index) => (
                  <div
                    key={title}
                    className="rounded-xl border border-border/70 bg-card p-4"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Icon className="size-5" aria-hidden />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold uppercase text-muted-foreground">
                          Step {index + 1}
                        </p>
                        <h3 className="mt-1 font-semibold text-card-foreground">
                          {title}
                        </h3>
                        <p className="mt-1 text-sm leading-6 text-muted-foreground">
                          {body}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="detected" className="min-h-0 flex-1">
            <ScrollArea className="h-full">
              <div className="grid gap-3 p-4 sm:grid-cols-2 sm:p-5">
                {detectedUi.map(({ label, value, body, icon: Icon }) => (
                  <div
                    key={label}
                    className="rounded-xl border border-border/70 bg-card p-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex min-w-0 gap-3">
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          <Icon className="size-5" aria-hidden />
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-semibold text-card-foreground">
                            {label}
                          </h3>
                          <p className="mt-1 text-sm leading-6 text-muted-foreground">
                            {body}
                          </p>
                        </div>
                      </div>
                      <span className="shrink-0 rounded-full border border-border/70 bg-background px-2.5 py-1 text-xs font-semibold text-card-foreground">
                        {value}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="export" className="min-h-0 flex-1">
            <ScrollArea className="h-full">
              <div className="grid gap-3 p-4 sm:p-5">
                {exportOptions.map(({ title, body, icon: Icon }) => (
                  <div
                    key={title}
                    className="rounded-xl border border-border/70 bg-card p-4"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Icon className="size-5" aria-hidden />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-card-foreground">
                          {title}
                        </h3>
                        <p className="mt-1 text-sm leading-6 text-muted-foreground">
                          {body}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>

        <DialogFooter className="mx-0 mb-0 shrink-0 rounded-none border-t border-border bg-background/95 px-4 py-3 backdrop-blur sm:px-5">
          <DialogClose
            className={cn(
              buttonVariants({ variant: "outline", size: "lg" }),
              "min-h-11",
            )}
          >
            Close
          </DialogClose>
          <Link
            href="/demo#upload-flow"
            className={cn(buttonVariants({ size: "lg" }), "min-h-11 gap-2")}
          >
            <UploadCloud className="size-4" aria-hidden />
            Load into workflow
          </Link>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DashboardSampleThumbnail() {
  return (
    <div
      className="hidden h-20 w-32 shrink-0 overflow-hidden rounded-xl border border-border/70 bg-muted/30 shadow-inner sm:block"
      aria-hidden="true"
    >
      <div className="grid h-full grid-cols-[0.8fr_1fr] gap-1 p-2">
        <div className="rounded-md bg-muted/70 p-1.5">
          <div className="h-2 w-10 rounded-full bg-primary/55" />
          <div className="mt-3 h-3 w-14 rounded bg-foreground/20" />
          <div className="mt-1.5 h-2 w-9 rounded bg-muted-foreground/25" />
        </div>
        <div className="grid gap-1">
          <div className="grid grid-cols-2 gap-1">
            <div className="rounded bg-muted/70" />
            <div className="rounded bg-muted/70" />
          </div>
          <div className="rounded bg-muted/70 p-1.5">
            <div className="h-2 w-14 rounded bg-primary/45" />
            <div className="mt-2 flex h-6 items-end gap-1">
              <span className="h-3 flex-1 rounded-sm bg-primary/35" />
              <span className="h-5 flex-1 rounded-sm bg-primary/55" />
              <span className="h-4 flex-1 rounded-sm bg-primary/40" />
              <span className="h-6 flex-1 rounded-sm bg-primary/65" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
