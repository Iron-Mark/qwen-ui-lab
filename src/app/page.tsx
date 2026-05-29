import { DashboardShell } from "@/components/dashboard/DashboardShell";
import {
  stats,
  revenueData,
  recentActivity,
  quickActions,
} from "@/data/dashboard-data";

export default function Home() {
  return (
    <DashboardShell
      stats={stats}
      revenueData={revenueData}
      activities={recentActivity}
      quickActions={quickActions}
    />
  );
}
