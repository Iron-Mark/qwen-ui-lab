"use client";

import dynamic from "next/dynamic";
import { PageContainer } from "@/components/layout/PageContainer";
import { Skeleton } from "@/components/ui/skeleton";
import {
  channelMixData,
  performanceData,
  quickActions,
  recentActivity,
  revenueData,
  stats,
} from "../data/dashboard-data";

const UploadFlow = dynamic(
  () => import("@/features/analysis/components/UploadFlow").then((mod) => mod.UploadFlow),
  {
    ssr: false,
    loading: () => (
      <PageContainer
        as="section"
        id="upload-flow"
        className="scroll-mt-20 py-8"
        aria-hidden
      >
        <div className="grid min-w-0 gap-5 rounded-2xl border border-border/70 bg-card p-4 shadow-sm sm:p-6">
          <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="grid min-w-0 gap-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-8 w-full max-w-72" />
              <Skeleton className="h-4 w-full max-w-80" />
            </div>
            <Skeleton className="h-8 w-36 rounded-full" />
          </div>
          <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
            <Skeleton className="min-h-72 rounded-xl" />
            <div className="hidden rounded-xl border border-dashed border-border/70 p-5 lg:grid">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="mt-6 h-48 w-full" />
            </div>
          </div>
        </div>
      </PageContainer>
    ),
  },
);

const DashboardShell = dynamic(
  () =>
    import("./DashboardShell").then((mod) => mod.DashboardShell),
  {
    ssr: false,
    loading: () => (
      <PageContainer className="py-10" aria-hidden>
        <div className="grid gap-5">
          <Skeleton className="h-24 rounded-2xl" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-32 rounded-xl" />
            ))}
          </div>
          <div className="grid gap-5 lg:grid-cols-2">
            <Skeleton className="h-80 rounded-xl" />
            <Skeleton className="h-80 rounded-xl" />
          </div>
        </div>
      </PageContainer>
    ),
  },
);

export function HomeBelowFoldClient() {
  return (
    <>
      <UploadFlow />
      <div className="[content-visibility:auto] [contain-intrinsic-size:auto_1200px]">
        <DashboardShell
          stats={stats}
          revenueData={revenueData}
          performanceData={performanceData}
          channelMixData={channelMixData}
          activities={recentActivity}
          quickActions={quickActions}
        />
      </div>
    </>
  );
}
