import type { RevenueDataPoint } from "@/features/home/data/dashboard-data";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface RevenueCardProps {
  data: RevenueDataPoint[];
}

export function RevenueCard({ data }: RevenueCardProps) {
  const maxRevenue = Math.max(...data.map((d) => d.revenue));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Revenue Overview</CardTitle>
        <CardDescription>Monthly revenue trend</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {data.map((point) => {
          const percentage = maxRevenue > 0 ? (point.revenue / maxRevenue) * 100 : 0;
          return (
            <div key={point.month} className="flex items-center gap-3">
              <span className="w-12 shrink-0 text-sm font-medium text-muted-foreground">
                {point.month}
              </span>
              <div
                className="h-8 flex-1 overflow-hidden rounded-md bg-muted"
                role="meter"
                aria-valuenow={point.revenue}
                aria-valuemin={0}
                aria-valuemax={maxRevenue}
                aria-label={`${point.month}: $${point.revenue.toLocaleString()}`}
              >
                <div
                  className="h-full bg-chart-bar transition-all duration-500"
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <span className="w-20 shrink-0 text-right text-sm font-semibold tabular-nums text-card-foreground">
                ${point.revenue.toLocaleString()}
              </span>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
