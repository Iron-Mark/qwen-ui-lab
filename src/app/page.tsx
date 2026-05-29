import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { UploadFlow } from "@/components/UploadFlow";
import {
  stats,
  revenueData,
  performanceData,
  channelMixData,
  recentActivity,
  quickActions,
} from "@/data/dashboard-data";

export default function Home() {
  return (
    <>
      <UploadFlow />
      <DashboardShell
        stats={stats}
        revenueData={revenueData}
        performanceData={performanceData}
        channelMixData={channelMixData}
        activities={recentActivity}
        quickActions={quickActions}
      />
    </>
  );
}
