"use client";

import { ChannelDonutChart, PerformanceLineChart } from "@/components/charts";
import { useTheme } from "@/components/providers/ThemeProvider";
import type { ChannelMixPoint, PerformanceDataPoint } from "@/data/dashboard-data";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

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
    <Card>
      <CardHeader>
        <CardTitle>Performance Chart</CardTitle>
        <CardDescription>
          Weekly sessions (Recharts) and channel mix (Chart.js)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <PerformanceLineChart
          data={performanceData}
          theme={theme}
          className="mb-6"
        />

        <Separator className="mb-4" />
        <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Traffic mix
        </p>
        <ChannelDonutChart data={channelMixData} theme={theme} />
      </CardContent>
    </Card>
  );
}
