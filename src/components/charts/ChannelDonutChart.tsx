"use client";

import {
  ArcElement,
  Chart as ChartJS,
  Legend,
  Tooltip,
  type ChartOptions,
} from "chart.js";
import { Doughnut } from "react-chartjs-2";
import type { ChannelMixPoint } from "@/data/dashboard-data";
import { getChartColors, type ChartThemeMode } from "@/lib/chart-theme";

ChartJS.register(ArcElement, Tooltip, Legend);

interface ChannelDonutChartProps {
  data: ChannelMixPoint[];
  theme?: ChartThemeMode;
  className?: string;
}

export function ChannelDonutChart({
  data,
  theme = "light",
  className,
}: ChannelDonutChartProps) {
  const colors = getChartColors(theme);

  const chartData = {
    labels: data.map((d) => d.channel),
    datasets: [
      {
        data: data.map((d) => d.share),
        backgroundColor: colors.series,
        borderWidth: 0,
        hoverOffset: 4,
      },
    ],
  };

  const options: ChartOptions<"doughnut"> = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "62%",
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          color: colors.muted,
          boxWidth: 10,
          padding: 12,
          font: { size: 11 },
        },
      },
      tooltip: {
        callbacks: {
          label: (ctx) => ` ${ctx.label}: ${ctx.parsed}%`,
        },
      },
    },
  };

  return (
    <div
      className={className}
      role="img"
      aria-label="Traffic channel mix donut chart"
    >
      <div className="h-36">
        <Doughnut data={chartData} options={options} />
      </div>
    </div>
  );
}
