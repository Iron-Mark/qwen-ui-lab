import { DashboardShell } from "@/components/organisms/DashboardShell";
import { UploadFlow } from "@/components/organisms/UploadFlow";
import type { Metadata } from "next";
import {
  stats,
  revenueData,
  performanceData,
  channelMixData,
  recentActivity,
  quickActions,
} from "@/data/dashboard-data";

export const metadata: Metadata = {
  title: "Dashboard Demo",
  description:
    "Try qwen-ui-lab's upload, analysis, and component preview flow with dashboard metrics and quick actions.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "qwen-ui-lab Dashboard Demo",
    description:
      "Try qwen-ui-lab's upload, analysis, and component preview flow with dashboard metrics and quick actions.",
    url: "/",
  },
  twitter: {
    title: "qwen-ui-lab Dashboard Demo",
    description:
      "Try qwen-ui-lab's upload, analysis, and component preview flow with dashboard metrics and quick actions.",
  },
};

export default function Home() {
  return (
    <main className="relative">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[480px] bg-[radial-gradient(circle_at_top,oklch(0.97_0_0),transparent_65%)] dark:bg-[radial-gradient(circle_at_top,oklch(0.26_0_0),transparent_65%)]" />
      <div className="relative">
        <h1 className="sr-only">
          qwen-ui-lab dashboard and AI screenshot-to-component demo
        </h1>
        <UploadFlow />
        <DashboardShell
          stats={stats}
          revenueData={revenueData}
          performanceData={performanceData}
          channelMixData={channelMixData}
          activities={recentActivity}
          quickActions={quickActions}
        />
      </div>
    </main>
  );
}
