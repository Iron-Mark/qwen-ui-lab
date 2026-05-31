import { cn } from "@/lib/utils";
import type { StatCardData } from "@/data/dashboard-data";
import { Card, CardContent } from "@/components/ui/card";

interface StatCardProps {
  stat: StatCardData;
}

const trendConfig = {
  up: { color: "text-success", icon: "↑" },
  down: { color: "text-destructive", icon: "↓" },
  flat: { color: "text-muted-foreground", icon: "→" },
} as const;

export function StatCard({ stat }: StatCardProps) {
  const { label, value, change, trend } = stat;
  const { color, icon } = trendConfig[trend];

  return (
    <Card>
      <CardContent className="p-6">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <p className="mt-2 text-2xl font-bold text-card-foreground">{value}</p>
        <div className="mt-2 flex items-center gap-1 text-sm">
          <span className={cn("font-medium", color)}>
            <span aria-hidden="true">{icon}</span>
            <span> {change}</span>
          </span>
          <span className="text-muted-foreground">vs last month</span>
        </div>
      </CardContent>
    </Card>
  );
}
