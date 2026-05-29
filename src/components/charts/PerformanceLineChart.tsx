"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { PerformanceDataPoint } from "@/data/dashboard-data";
import { getChartColors, type ChartThemeMode } from "@/lib/chart-theme";

interface PerformanceLineChartProps {
  data: PerformanceDataPoint[];
  theme?: ChartThemeMode;
  className?: string;
}

export function PerformanceLineChart({
  data,
  theme = "light",
  className,
}: PerformanceLineChartProps) {
  const colors = getChartColors(theme);

  return (
    <div
      className={className}
      role="img"
      aria-label="Weekly session performance line chart"
    >
      <ResponsiveContainer width="100%" height={160}>
        <LineChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid stroke={colors.grid} strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="week"
            tick={{ fill: colors.muted, fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: colors.muted, fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            width={36}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: theme === "dark" ? "#18181b" : "#ffffff",
              border: `1px solid ${colors.grid}`,
              borderRadius: "6px",
              color: colors.primary,
              fontSize: "12px",
            }}
            labelStyle={{ color: colors.muted }}
            formatter={(value) => [
              typeof value === "number" ? value.toLocaleString() : value,
              "Sessions",
            ]}
          />
          <Line
            type="monotone"
            dataKey="sessions"
            stroke={colors.primary}
            strokeWidth={2}
            dot={{ fill: colors.primary, r: 3 }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
