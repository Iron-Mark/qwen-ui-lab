import { ActivityList } from "./ActivityList";
import { ChartPreview } from "./ChartPreview";
import { QuickActionButton } from "./QuickActionButton";
import { RevenueCard } from "./RevenueCard";
import { StatCard } from "./StatCard";
import { ThemedChartPreview } from "./ThemedChartPreview";
import {
  channelMixData,
  performanceData,
  quickActions,
  recentActivity,
  revenueData,
  stats,
} from "../data/dashboard-data";

export function DashboardQuickActionCatalogPreview() {
  return <QuickActionButton action={quickActions[0]} />;
}

export function DashboardStatTrendUpCatalogPreview() {
  return <StatCard stat={stats[0]} />;
}

export function DashboardStatTrendDownCatalogPreview() {
  return <StatCard stat={stats[3]} />;
}

export function DashboardRevenueCatalogPreview() {
  return <RevenueCard data={revenueData} />;
}

export function DashboardPerformanceLineCatalogPreview() {
  return (
    <ThemedChartPreview
      performanceData={performanceData}
      channelMixData={channelMixData}
      compact
    />
  );
}

export function DashboardChannelDonutCatalogPreview() {
  return (
    <ThemedChartPreview
      performanceData={performanceData.slice(0, 1)}
      channelMixData={channelMixData}
    />
  );
}

export function DashboardActivityListCatalogPreview() {
  return <ActivityList activities={recentActivity.slice(0, 3)} />;
}

export function DashboardChartCatalogPreview() {
  return (
    <ChartPreview
      performanceData={performanceData}
      channelMixData={channelMixData}
    />
  );
}
