"use client";

import { ChannelDonutChart, PerformanceLineChart } from "@/components/charts";
import { useTheme } from "@/components/ThemeProvider";
import type { ChannelMixPoint, PerformanceDataPoint } from "@/data/dashboard-data";

interface ChartPreviewProps {
  performanceData: PerformanceDataPoint[];
  channelMixData: ChannelMixPoint[];
}

export function ChartPreview({
  performanceData,
  channelMixData,
}: ChartPreviewProps) {
  const { theme } = useTheme();

  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-card-foreground">
          Performance Chart
        </h3>
        <p className="text-sm text-muted-foreground">
          Weekly sessions (Recharts) and channel mix (Chart.js)
        </p>
      </div>

      <PerformanceLineChart
        data={performanceData}
        theme={theme}
        className="mb-6"
      />

      <div className="border-t border-border pt-4">
        <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Traffic mix
        </p>
        <ChannelDonutChart data={channelMixData} theme={theme} />
      </div>
    </div>
  );
}
