import {
  getChartColors,
  type ChartThemeColors,
  type ChartThemeMode,
} from "./chart-theme";

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
