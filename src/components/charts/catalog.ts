/**
 * Chart organism registry for the qwen-ui-lab design system.
 * Consumed by documentation and future atomic catalog pages.
 */
export const chartOrganismsCatalog = [
  {
    id: "performance-line-chart",
    name: "PerformanceLineChart",
    level: "organism" as const,
    library: "recharts",
    description: "Weekly session trend line chart with theme-aware tokens.",
    componentPath: "@/components/charts/PerformanceLineChart",
  },
  {
    id: "channel-donut-chart",
    name: "ChannelDonutChart",
    level: "organism" as const,
    library: "chart.js",
    description: "Traffic channel mix donut chart via react-chartjs-2.",
    componentPath: "@/components/charts/ChannelDonutChart",
  },
  {
    id: "chart-preview",
    name: "ChartPreview",
    level: "organism" as const,
    library: "composite",
    description:
      "Dashboard performance panel combining Recharts line + Chart.js donut.",
    componentPath: "@/components/dashboard/ChartPreview",
  },
] as const;

export type ChartOrganismId = (typeof chartOrganismsCatalog)[number]["id"];
