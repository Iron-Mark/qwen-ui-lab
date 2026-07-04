"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { useTheme } from "@/components/providers/ThemeProvider";
import type { ChannelMixPoint, PerformanceDataPoint } from "../data/dashboard-data";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const PerformanceLineChart = dynamic(
  () =>
    import("./PerformanceLineChart").then((mod) => ({
      default: mod.PerformanceLineChart,
    })),
  {
    loading: () => <ChartSkeleton className="mb-6 h-[180px]" />,
  },
);

const ChannelDonutChart = dynamic(
  () =>
    import("./ChannelDonutChart").then((mod) => ({
      default: mod.ChannelDonutChart,
    })),
  {
    loading: () => <ChartSkeleton className="h-40" />,
  },
);

interface ChartPreviewProps {
  performanceData: PerformanceDataPoint[];
  channelMixData: ChannelMixPoint[];
  title?: string;
  description?: string;
  trafficMixLabel?: string;
  performanceChartAriaLabel?: string;
  performanceTooltipLabel?: string;
  channelChartAriaLabel?: string;
}

export function ChartPreview({
  performanceData,
  channelMixData,
  title = "Performance chart",
  description = "Weekly sessions and channel mix",
  trafficMixLabel = "Traffic mix",
  performanceChartAriaLabel = "Weekly session performance line chart",
  performanceTooltipLabel = "Sessions",
  channelChartAriaLabel = "Traffic channel mix donut chart",
}: ChartPreviewProps) {
  const { theme } = useTheme();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [shouldRenderCharts, setShouldRenderCharts] = useState(false);

  useEffect(() => {
    if (shouldRenderCharts) {
      return;
    }

    let rafId = 0;
    const container = containerRef.current;
    if (!container) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) {
          return;
        }

        rafId = window.requestAnimationFrame(() => {
          setShouldRenderCharts(true);
        });
        observer.disconnect();
      },
      { rootMargin: "140px" },
    );

    observer.observe(container);

    return () => {
      observer.disconnect();
      if (rafId) {
        window.cancelAnimationFrame(rafId);
      }
    };
  }, [shouldRenderCharts]);

  return (
    <div ref={containerRef}>
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          {shouldRenderCharts ? (
            <>
              <PerformanceLineChart
                data={performanceData}
                theme={theme}
                className="mb-6"
                ariaLabel={performanceChartAriaLabel}
                tooltipValueLabel={performanceTooltipLabel}
              />

              <Separator className="mb-4" />
              <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {trafficMixLabel}
              </p>
              <ChannelDonutChart
                data={channelMixData}
                theme={theme}
                ariaLabel={channelChartAriaLabel}
              />
            </>
          ) : (
            <>
              <ChartSkeleton className="mb-6 h-[180px]" />
              <Separator className="mb-4" />
              <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {trafficMixLabel}
              </p>
              <ChartSkeleton className="h-40" />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ChartSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-xl border border-border/70 bg-muted/30 ${className ?? ""}`}
      aria-hidden
    />
  );
}
