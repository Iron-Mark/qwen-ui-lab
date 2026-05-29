import type { RevenueDataPoint } from "@/data/dashboard-data";

interface RevenueCardProps {
  data: RevenueDataPoint[];
}

export function RevenueCard({ data }: RevenueCardProps) {
  const maxRevenue = Math.max(...data.map((d) => d.revenue));

  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-card-foreground">
          Revenue Overview
        </h3>
        <p className="text-sm text-muted-foreground">Monthly revenue trend</p>
      </div>

      <div className="space-y-3">
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
      </div>
    </div>
  );
}
