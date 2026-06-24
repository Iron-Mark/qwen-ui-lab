import { PageContainer } from "@/components/layout/PageContainer";
import { DashboardSampleDialog } from "./DashboardSampleDialog";
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
      <DashboardSampleDialog
        stats={stats}
        revenueData={revenueData}
        performanceData={performanceData}
        channelMixData={channelMixData}
        activities={activities}
        quickActions={quickActions}
      />
    </PageContainer>
  );
}
