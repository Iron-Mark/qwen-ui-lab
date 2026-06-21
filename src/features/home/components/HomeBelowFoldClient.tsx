"use client";

import dynamic from "next/dynamic";
import { PageContainer } from "@/components/layout/PageContainer";
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
        <div className="min-h-[28rem] animate-pulse rounded-xl border border-border/60 bg-muted/25" />
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
        <div className="min-h-[48rem] animate-pulse rounded-xl bg-muted/20" />
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
