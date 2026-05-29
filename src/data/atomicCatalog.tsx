"use client";

import type { ReactNode } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { StatCard } from "@/components/dashboard/StatCard";
import { QuickActionButton } from "@/components/dashboard/QuickActionButton";
import { WorkflowBanner } from "@/components/dashboard/WorkflowBanner";
import { ActivityList } from "@/components/dashboard/ActivityList";
import { ChartPreview } from "@/components/dashboard/ChartPreview";
import {
  ChannelDonutChart,
  PerformanceLineChart,
} from "@/components/charts";
import {
  stats,
  recentActivity,
  quickActions,
  performanceData,
  channelMixData,
} from "@/data/dashboard-data";

export type AtomicLevel = "atom" | "molecule" | "organism";

export interface AtomicCatalogEntry {
  id: string;
  level: AtomicLevel;
  name: string;
  description: string;
  preview: ReactNode;
  code: string;
  exportFilename?: string;
}

const statSnippet = `import { StatCard } from "@/components/dashboard/StatCard";

export function ExampleStat() {
  return (
    <StatCard
      stat={{
        label: "Revenue",
        value: "$48,290",
        change: "+12.5%",
        trend: "up",
      }}
    />
  );
}`;

const quickActionSnippet = `import { QuickActionButton } from "@/components/dashboard/QuickActionButton";

export function ExampleQuickAction() {
  return (
    <QuickActionButton
      action={{ label: "Invite user", icon: "user-plus" }}
    />
  );
}`;

const themeToggleSnippet = `import { ThemeToggle } from "@/components/ThemeToggle";

export function ExampleThemeToggle() {
  return <ThemeToggle />;
}`;

const workflowSnippet = `import { WorkflowBanner } from "@/components/dashboard/WorkflowBanner";

export function ExampleWorkflowBanner() {
  return <WorkflowBanner />;
}`;

const activitySnippet = `import { ActivityList } from "@/components/dashboard/ActivityList";
import { recentActivity } from "@/data/dashboard-data";

export function ExampleActivityList() {
  return <ActivityList activities={recentActivity} />;
}`;

const performanceLineSnippet = `import { PerformanceLineChart } from "@/components/charts";
import { performanceData } from "@/data/dashboard-data";

export function ExamplePerformanceLine() {
  return <PerformanceLineChart data={performanceData} theme="light" />;
}`;

const channelDonutSnippet = `import { ChannelDonutChart } from "@/components/charts";
import { channelMixData } from "@/data/dashboard-data";

export function ExampleChannelDonut() {
  return <ChannelDonutChart data={channelMixData} theme="light" />;
}`;

const chartPreviewSnippet = `import { ChartPreview } from "@/components/dashboard/ChartPreview";
import { performanceData, channelMixData } from "@/data/dashboard-data";

export function ExampleChartPreview() {
  return (
    <ChartPreview
      performanceData={performanceData}
      channelMixData={channelMixData}
    />
  );
}`;

export const atomicCatalog: AtomicCatalogEntry[] = [
  {
    id: "theme-toggle",
    level: "atom",
    name: "Theme toggle",
    description: "Light/dark switch with persisted preference and focus ring.",
    preview: <ThemeToggle />,
    code: themeToggleSnippet,
    exportFilename: "theme-toggle.tsx",
  },
  {
    id: "quick-action",
    level: "atom",
    name: "Quick action button",
    description: "Icon + label control used in dashboard shortcuts.",
    preview: <QuickActionButton action={quickActions[0]} />,
    code: quickActionSnippet,
    exportFilename: "quick-action-button.tsx",
  },
  {
    id: "stat-card",
    level: "molecule",
    name: "Stat card",
    description: "Metric tile with trend indicator and semantic colors.",
    preview: <StatCard stat={stats[0]} />,
    code: statSnippet,
    exportFilename: "stat-card.tsx",
  },
  {
    id: "workflow-banner",
    level: "organism",
    name: "Workflow banner",
    description: "Session status strip for the upload-to-export pipeline.",
    preview: <WorkflowBanner />,
    code: workflowSnippet,
    exportFilename: "workflow-banner.tsx",
  },
  {
    id: "activity-list",
    level: "organism",
    name: "Activity list",
    description: "Scrollable feed of recent dashboard events.",
    preview: <ActivityList activities={recentActivity.slice(0, 3)} />,
    code: activitySnippet,
    exportFilename: "activity-list.tsx",
  },
  {
    id: "performance-line-chart",
    level: "organism",
    name: "Performance line chart",
    description: "Weekly sessions trend via Recharts with theme tokens.",
    preview: <PerformanceLineChart data={performanceData} theme="light" />,
    code: performanceLineSnippet,
    exportFilename: "performance-line-chart.tsx",
  },
  {
    id: "channel-donut-chart",
    level: "organism",
    name: "Channel donut chart",
    description: "Traffic mix breakdown via Chart.js and react-chartjs-2.",
    preview: <ChannelDonutChart data={channelMixData} theme="light" />,
    code: channelDonutSnippet,
    exportFilename: "channel-donut-chart.tsx",
  },
  {
    id: "chart-preview",
    level: "organism",
    name: "Chart preview",
    description:
      "Performance line chart (Recharts) and channel donut (Chart.js).",
    preview: (
      <ChartPreview
        performanceData={performanceData}
        channelMixData={channelMixData}
      />
    ),
    code: chartPreviewSnippet,
    exportFilename: "chart-preview.tsx",
  },
];

export function catalogByLevel(level: AtomicLevel) {
  return atomicCatalog.filter((entry) => entry.level === level);
}
