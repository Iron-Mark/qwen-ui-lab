"use client";

import {
  ArcElement,
  Chart as ChartJS,
  Legend,
  Tooltip,
  type ChartOptions,
} from "chart.js";
import { Doughnut } from "react-chartjs-2";
import { memo, useMemo } from "react";
import type { ChannelMixPoint } from "../data/dashboard-data";
import { getChartColors, type ChartThemeMode } from "../lib/chart-theme";
import { getChartColorsFromDocument } from "../lib/chart-theme.client";

ChartJS.register(ArcElement, Tooltip, Legend);

interface ChannelDonutChartProps {
  data: ChannelMixPoint[];
  theme?: ChartThemeMode;
  className?: string;
}

export const ChannelDonutChart = memo(function ChannelDonutChart({
  data,
  theme = "light",
  className,
}: ChannelDonutChartProps) {
  const colors = useMemo(
    () => getChartColorsFromDocument(theme) ?? getChartColors(theme),
    [theme],
  );

  const chartData = useMemo(
    () => ({
      labels: data.map((d) => d.channel),
      datasets: [
        {
          data: data.map((d) => d.share),
          backgroundColor: colors.series,
          borderColor: colors.tooltipBg,
          borderWidth: 2,
          hoverOffset: 6,
        },
      ],
    }),
    [data, colors.series, colors.tooltipBg],
  );

  const options: ChartOptions<"doughnut"> = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      cutout: "62%",
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            color: colors.muted,
            boxWidth: 10,
            boxHeight: 10,
            padding: 14,
            usePointStyle: true,
            pointStyle: "circle",
            font: { size: 11 },
          },
        },
        tooltip: {
          backgroundColor: colors.tooltipBg,
          borderColor: colors.tooltipBorder,
          borderWidth: 1,
          titleColor: colors.primary,
          bodyColor: colors.muted,
          callbacks: {
            label: (ctx) => ` ${ctx.label}: ${ctx.parsed}%`,
          },
        },
      },
    }),
    [
      colors.muted,
      colors.primary,
      colors.tooltipBg,
      colors.tooltipBorder,
    ],
  );

  return (
    <div
      className={className}
      role="img"
      aria-label="Traffic channel mix donut chart"
    >
      <div className="h-40 rounded-xl border border-border/70 bg-background/70 p-2">
        <Doughnut data={chartData} options={options} />
      </div>
    </div>
  );
});
