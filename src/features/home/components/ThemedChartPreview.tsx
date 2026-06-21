"use client";

import { useTheme } from "@/components/providers/ThemeProvider";
import { PerformanceLineChart } from "./PerformanceLineChart";
import { ChannelDonutChart } from "./ChannelDonutChart";
import type { ChannelMixPoint, PerformanceDataPoint } from "../data/dashboard-data";

interface ThemedChartPreviewProps {
  performanceData: PerformanceDataPoint[];
  channelMixData: ChannelMixPoint[];
  compact?: boolean;
}

/** Catalog wrapper that follows the active light/dark theme. */
export function ThemedChartPreview({
  performanceData,
  channelMixData,
  compact = false,
}: ThemedChartPreviewProps) {
  const { theme } = useTheme();

  if (compact) {
    return (
      <PerformanceLineChart
        data={performanceData}
        theme={theme}
        className="max-w-md"
      />
    );
  }

  return (
    <div className="space-y-4">
      <PerformanceLineChart data={performanceData} theme={theme} />
      <ChannelDonutChart data={channelMixData} theme={theme} />
    </div>
  );
}
