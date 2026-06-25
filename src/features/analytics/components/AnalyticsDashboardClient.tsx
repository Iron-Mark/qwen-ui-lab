"use client";

import { useMemo, useSyncExternalStore } from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ANALYTICS_BUFFER_MAX_EVENTS,
  ANALYTICS_BUFFER_STORAGE_KEY,
  clearClientAnalyticsBuffer,
  countClientEventsByName,
  readClientAnalyticsBuffer,
  subscribeClientAnalyticsBuffer,
} from "@/lib/analytics-event-buffer.client";
import { ANALYTICS_FUNNEL_SLICES } from "../lib/analytics-funnel-docs";

type AnalyticsDashboardClientProps = {
  liveDashboardEnabled: boolean;
};

function formatMetadata(metadata: Record<string, unknown>) {
  const entries = Object.entries(metadata);
  if (entries.length === 0) return "—";
  return entries.map(([key, value]) => `${key}=${String(value)}`).join(", ");
}

function FunnelDocsPanel() {
  return (
    <div className="space-y-4">
      {ANALYTICS_FUNNEL_SLICES.map((slice) => (
        <Card key={slice.id}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{slice.title}</CardTitle>
            <CardDescription>{slice.purpose}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>
              <span className="font-medium text-foreground">Events: </span>
              {slice.events.join(", ")}
            </p>
            <p>
              <span className="font-medium text-foreground">Breakdown: </span>
              {slice.breakdown.join(", ")}
            </p>
          </CardContent>
        </Card>
      ))}
      <p className="text-sm text-muted-foreground">
        See <code className="rounded bg-muted px-1 text-xs">docs/ops/ANALYTICS_TAXONOMY.md</code> in the
        repo for the full event list. Enable staging flags from{" "}
        <code className="rounded bg-muted px-1 py-0.5 text-xs">.env.example</code> to populate the
        live buffer on this page.
      </p>
    </div>
  );
}

function LiveDashboardPanel() {
  const events = useSyncExternalStore(
    subscribeClientAnalyticsBuffer,
    readClientAnalyticsBuffer,
    () => [],
  );

  const counts = useMemo(() => countClientEventsByName(events), [events]);

  const funnelRows = useMemo(() => {
    return ANALYTICS_FUNNEL_SLICES.filter((slice) => slice.id !== "route-coverage").map(
      (slice) => {
        const sliceEvents = slice.events.filter((name) => name !== "*");
        const total = sliceEvents.reduce((sum, name) => sum + (counts[name] ?? 0), 0);
        return { ...slice, total, sliceEvents };
      },
    );
  }, [counts]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            clearClientAnalyticsBuffer();
          }}
        >
          Clear buffer
        </Button>
        <p className="text-sm text-muted-foreground">
          {events.length} / {ANALYTICS_BUFFER_MAX_EVENTS} events in{" "}
          <code className="rounded bg-muted px-1 text-xs">{ANALYTICS_BUFFER_STORAGE_KEY}</code>
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {funnelRows.map((row) => (
          <Card key={row.id}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{row.title}</CardTitle>
              <CardDescription>{row.purpose}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p className="font-medium">Slice total: {row.total}</p>
              <ul className="space-y-1 text-muted-foreground">
                {row.sliceEvents.map((name) => (
                  <li key={name}>
                    <span className="font-mono text-xs text-foreground">{name}</span>:{" "}
                    {counts[name] ?? 0}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent events</CardTitle>
          <CardDescription>Newest last — privacy-safe allowlisted metadata only.</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {events.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No buffered events yet. Use the app with analytics flags enabled, then complete an
              upload or design-system flow.
            </p>
          ) : (
            <table className="w-full min-w-[32rem] text-left text-sm">
              <thead>
                <tr className="border-b text-muted-foreground">
                  <th className="py-2 pr-4 font-medium">Time</th>
                  <th className="py-2 pr-4 font-medium">Event</th>
                  <th className="py-2 font-medium">Metadata</th>
                </tr>
              </thead>
              <tbody>
                {[...events].reverse().slice(0, 50).map((event, index) => (
                  <tr key={`${event.recordedAt}-${event.eventName}-${index}`} className="border-b border-border/60">
                    <td className="py-2 pr-4 align-top font-mono text-xs whitespace-nowrap">
                      {event.recordedAt ?? "—"}
                    </td>
                    <td className="py-2 pr-4 align-top font-mono text-xs">{event.eventName}</td>
                    <td className="py-2 align-top text-xs text-muted-foreground">
                      {formatMetadata(event.metadata)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      <FunnelDocsPanel />
    </div>
  );
}

export function AnalyticsDashboardClient({ liveDashboardEnabled }: AnalyticsDashboardClientProps) {
  return (
    <PageContainer className="space-y-8 py-8">
      <header className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Internal · staging
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">Analytics dashboard</h1>
        <p className="max-w-2xl text-muted-foreground">
          {liveDashboardEnabled
            ? "Live view of allowlisted client events buffered in this browser. Local analysis events stay suppressed unless explicitly allowed."
            : "Documentation-only view. Client analytics are disabled until observability env flags are set."}
        </p>
      </header>

      {liveDashboardEnabled ? <LiveDashboardPanel /> : <FunnelDocsPanel />}
    </PageContainer>
  );
}
