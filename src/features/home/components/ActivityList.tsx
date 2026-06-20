import type { ActivityData } from "@/features/home/data/dashboard-data";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

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
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>Latest user interactions</CardDescription>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <p className="text-sm text-muted-foreground">No recent activity.</p>
        ) : (
          <ScrollArea className="max-h-80">
            <ul className="divide-y divide-border pr-4" role="list">
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
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
