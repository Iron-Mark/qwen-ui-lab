export type ChartThemeMode = "light" | "dark";

export interface ChartThemeColors {
  primary: string;
  muted: string;
  grid: string;
  series: string[];
}

export const chartTheme: Record<ChartThemeMode, ChartThemeColors> = {
  light: {
    primary: "#18181b",
    muted: "#71717a",
    grid: "#e4e4e7",
    series: ["#18181b", "#52525b", "#71717a", "#a1a1aa"],
  },
  dark: {
    primary: "#e4e4e7",
    muted: "#a1a1aa",
    grid: "#27272a",
    series: ["#e4e4e7", "#a1a1aa", "#71717a", "#52525b"],
  },
};

export function getChartColors(theme: ChartThemeMode): ChartThemeColors {
  return chartTheme[theme];
}
