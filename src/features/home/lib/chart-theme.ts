export type ChartThemeMode = "light" | "dark";

export interface ChartThemeColors {
  primary: string;
  muted: string;
  grid: string;
  tooltipBg: string;
  tooltipBorder: string;
  series: string[];
}

/** Matches globals.css chart tokens for light/dark parity. */
export const chartTheme: Record<ChartThemeMode, ChartThemeColors> = {
  light: {
    primary: "#18181b",
    muted: "#71717a",
    grid: "#e4e4e7",
    tooltipBg: "#ffffff",
    tooltipBorder: "#e4e4e7",
    series: ["#18181b", "#52525b", "#71717a", "#a1a1aa"],
  },
  dark: {
    primary: "#e4e4e7",
    muted: "#a1a1aa",
    grid: "#27272a",
    tooltipBg: "#18181b",
    tooltipBorder: "#27272a",
    series: ["#e4e4e7", "#a1a1aa", "#71717a", "#52525b"],
  },
};

export function getChartColors(theme: ChartThemeMode): ChartThemeColors {
  return chartTheme[theme];
}

/**
 * Read live CSS chart tokens when running in the browser (falls back to static palette).
 */
export function getChartColorsFromDocument(
  theme: ChartThemeMode,
): ChartThemeColors {
  if (typeof document === "undefined") return getChartColors(theme);

  const root = document.documentElement;
  const read = (name: string, fallback: string) =>
    getComputedStyle(root).getPropertyValue(name).trim() || fallback;

  const base = getChartColors(theme);
  const primary = read("--chart-line", base.primary);
  const grid = read("--chart-grid", base.grid);
  const muted = read("--muted-foreground", base.muted);

  return {
    primary,
    muted,
    grid,
    tooltipBg: read("--card", base.tooltipBg),
    tooltipBorder: read("--border", base.tooltipBorder),
    series: [primary, ...base.series.slice(1)],
  };
}
