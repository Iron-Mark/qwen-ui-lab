import { cn } from "@/lib/cn";
import type { StatCardData } from "@/data/dashboard-data";

interface StatCardProps {
  stat: StatCardData;
}

const trendConfig = {
  up: { color: "text-success", icon: "↑" },
  down: { color: "text-danger", icon: "↓" },
  flat: { color: "text-muted-foreground", icon: "→" },
} as const;

export function StatCard({ stat }: StatCardProps) {
  const { label, value, change, trend } = stat;
  const { color, icon } = trendConfig[trend];

  return (
    <div className="rounded-lg border border-border bg-card p-6 transition-colors">
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-bold text-card-foreground">{value}</p>
      <div className="mt-2 flex items-center gap-1 text-sm">
        <span className={cn("font-medium", color)}>
          <span aria-hidden="true">{icon}</span>
          <span> {change}</span>
        </span>
        <span className="text-muted-foreground">vs last month</span>
      </div>
    </div>
  );
}
