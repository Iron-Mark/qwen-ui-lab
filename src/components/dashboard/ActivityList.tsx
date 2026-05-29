import type { ActivityData } from "@/data/dashboard-data";

interface ActivityListProps {
  activities: ActivityData[];
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export function ActivityList({ activities }: ActivityListProps) {
  if (activities.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-6">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-card-foreground">
            Recent Activity
          </h3>
          <p className="text-sm text-muted-foreground">
            Latest user interactions
          </p>
        </div>
        <p className="text-sm text-muted-foreground">No recent activity.</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-card-foreground">
          Recent Activity
        </h3>
        <p className="text-sm text-muted-foreground">
          Latest user interactions
        </p>
      </div>

      <ul className="divide-y divide-border" role="list">
        {activities.map((activity) => (
          <li
            key={activity.id}
            className="flex items-start gap-3 py-4 first:pt-0 last:pb-0"
          >
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold text-card-foreground"
              aria-hidden="true"
            >
              {getInitials(activity.user)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-card-foreground">
                {activity.user}
              </p>
              <p className="truncate text-sm text-muted-foreground">
                {activity.action}
              </p>
            </div>
            <time
              dateTime={activity.timestamp}
              className="shrink-0 text-xs text-muted-foreground"
            >
              {activity.timestamp}
            </time>
          </li>
        ))}
      </ul>
    </div>
  );
}
