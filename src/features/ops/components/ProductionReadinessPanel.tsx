"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  ServerCog,
} from "lucide-react";

import { PageContainer } from "@/components/layout/PageContainer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type ReadinessCheck = {
  id: string;
  label: string;
  status: "ready" | "optional" | "fallback" | "missing";
  active: boolean;
  detail: string;
};

type ReadinessPayload = {
  ok: boolean;
  provider: "demo" | "qwen";
  shareStorage: "memory" | "kv";
  durableShareLinks: boolean;
  checks: ReadinessCheck[];
  summary: Record<ReadinessCheck["status"], number>;
};

const statusLabels: Record<ReadinessCheck["status"], string> = {
  ready: "Ready",
  optional: "Optional",
  fallback: "Local",
  missing: "Missing",
};

function statusBadgeVariant(status: ReadinessCheck["status"]) {
  if (status === "ready") return "secondary" as const;
  if (status === "missing") return "destructive" as const;
  return "outline" as const;
}

type ProductionReadinessPanelProps = {
  compact?: boolean;
  contained?: boolean;
  className?: string;
};

export function ProductionReadinessPanel({
  compact = false,
  contained = true,
  className,
}: ProductionReadinessPanelProps = {}) {
  const [payload, setPayload] = useState<ReadinessPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/readiness", {
        headers: { Accept: "application/json" },
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const nextPayload = (await response.json()) as ReadinessPayload;
      setPayload(nextPayload);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void refresh();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [refresh]);

  const checks = payload?.checks ?? [];
  const readyCount = payload?.summary?.ready ?? 0;
  const fallbackCount = payload?.summary?.fallback ?? 0;
  const missingCount = payload?.summary?.missing ?? 0;
  const statusSummary =
    missingCount > 0
      ? `${readyCount} ready, ${fallbackCount} local, ${missingCount} missing`
      : `${readyCount} ready, ${fallbackCount} local`;

  const card = (
    <Card
      className={cn("border-border/80 bg-background shadow-sm", className)}
      data-testid="production-readiness-panel"
    >
      <CardHeader className="flex-row flex-wrap items-start justify-between gap-3 space-y-0 pb-3">
        <div className="min-w-0 space-y-1">
          <div className="flex items-center gap-2">
            <ServerCog className="size-4 text-muted-foreground" aria-hidden />
            <CardTitle className="text-sm">Runtime configuration</CardTitle>
          </div>
          <p className="text-xs text-muted-foreground">
            {payload
              ? `${statusSummary}. Analysis: ${payload.provider}. Sharing: ${payload.shareStorage}.`
              : loading
                ? "Checking runtime feature status."
                : "Could not load runtime feature status."}
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => void refresh()}
          disabled={loading}
          data-testid="refresh-readiness"
        >
          <RefreshCw
            className={cn("size-3.5", loading && "animate-spin")}
            aria-hidden
          />
          Refresh
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {error ? (
          <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            Readiness check failed: {error}
          </div>
        ) : null}
        <div
          className={cn(
            "grid gap-2",
            compact ? "sm:grid-cols-2" : "md:grid-cols-2 xl:grid-cols-3",
          )}
        >
          {checks.map((check) => (
            <div
              key={check.id}
              className="min-w-0 rounded-md border border-border/70 bg-card p-3"
              data-testid="readiness-check"
              data-readiness-id={check.id}
              data-readiness-status={check.status}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2">
                  {check.status === "ready" ? (
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />
                  ) : (
                    <AlertTriangle className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
                  )}
                  <p className="truncate text-sm font-medium">{check.label}</p>
                </div>
                <Badge variant={statusBadgeVariant(check.status)}>
                  {statusLabels[check.status]}
                </Badge>
              </div>
              <p className="mt-2 text-xs leading-5 text-muted-foreground">
                {check.detail}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  if (!contained) return card;

  return (
    <PageContainer
      as="section"
      className="py-6"
    >
      {card}
    </PageContainer>
  );
}
