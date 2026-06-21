"use client";

import {
  Area,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { memo, useMemo } from "react";
import type { PerformanceDataPoint } from "../data/dashboard-data";
import { getChartColors, type ChartThemeMode } from "../lib/chart-theme";
import { getChartColorsFromDocument } from "../lib/chart-theme.client";

interface PerformanceLineChartProps {
  data: PerformanceDataPoint[];
  theme?: ChartThemeMode;
  className?: string;
}

export const PerformanceLineChart = memo(function PerformanceLineChart({
  data,
  theme = "light",
  className,
}: PerformanceLineChartProps) {
  const colors = useMemo(
    () => getChartColorsFromDocument(theme) ?? getChartColors(theme),
    [theme],
  );
  const gradientStops = useMemo(
    () => ({
      start: colors.primary,
      end: colors.primary,
    }),
    [colors.primary],
  );
  const tooltipStyle = useMemo(
    () => ({
      backgroundColor: colors.tooltipBg,
      border: `1px solid ${colors.tooltipBorder}`,
      borderRadius: "10px",
      color: colors.primary,
      fontSize: "12px",
      boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
    }),
    [colors.tooltipBg, colors.tooltipBorder, colors.primary],
  );
  const tooltipLabelStyle = useMemo(
    () => ({ color: colors.muted }),
    [colors.muted],
  );
  const dotStyle = useMemo(
    () => ({ fill: colors.primary, r: 2.75, strokeWidth: 2, stroke: colors.tooltipBg }),
    [colors.primary, colors.tooltipBg],
  );
  const activeDotStyle = useMemo(
    () => ({ r: 5.5, strokeWidth: 2, stroke: colors.tooltipBg }),
    [colors.tooltipBg],
  );

  return (
    <div
      className={className}
      role="img"
      aria-label="Weekly session performance line chart"
    >
      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <defs>
            <linearGradient id="performanceGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={gradientStops.start} stopOpacity={0.28} />
              <stop offset="95%" stopColor={gradientStops.end} stopOpacity={0.02} />
            </linearGradient>
          </defs>
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
            contentStyle={tooltipStyle}
            labelStyle={tooltipLabelStyle}
            formatter={(value) => [
              typeof value === "number" ? value.toLocaleString() : value,
              "Sessions",
            ]}
          />
          <Area
            type="monotone"
            dataKey="sessions"
            fill="url(#performanceGradient)"
            stroke="none"
          />
          <Line
            type="monotone"
            dataKey="sessions"
            stroke={colors.primary}
            strokeWidth={2.5}
            dot={dotStyle}
            activeDot={activeDotStyle}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
});
