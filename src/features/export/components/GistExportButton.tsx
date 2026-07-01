"use client";

import { useCallback, useState } from "react";
import { usePathname } from "next/navigation";
import { AlertCircle, Check, Code2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/providers/Toast";
import { useCopyToClipboard } from "@/lib/hooks/useCopyToClipboard";
import { useObservability } from "@/components/providers/ObservabilityProvider";
import { useProviderMode } from "@/components/providers/ProviderModeProvider";
import { AnalyticsEvent, createAnalyticsClient } from "@/lib/analytics.client";

type GistExportStatus = "idle" | "exporting" | "success" | "error";

interface GistExportButtonProps {
  text: string;
  filename?: string;
  description?: string;
  label?: string;
  className?: string;
  analyticsSource?: string;
  analyticsFeature?: string;
  onExported?: (url: string) => void;
}

interface GistUnavailableResponse {
  fallback?: {
    gistUrl?: string;
    instructions?: string;
  };
}

interface GistSuccessResponse {
  url: string;
}

const STATUS_LABELS: Record<GistExportStatus, string> = {
  idle: "Export to GitHub Gist",
  exporting: "Creating gist…",
  success: "Gist created",
  error: "Gist failed",
};

export function GistExportButton({
  text,
  filename = "component.tsx",
  description = "qwen-ui-lab export package",
  label,
  className,
  analyticsSource = "snippet_preview",
  analyticsFeature = "code_export",
  onExported,
}: GistExportButtonProps) {
  const pathname = usePathname();
  const observability = useObservability();
  const { mode } = useProviderMode();
  const { toast } = useToast();
  const { copy } = useCopyToClipboard();
  const [status, setStatus] = useState<GistExportStatus>("idle");
  const analytics = createAnalyticsClient({
    hooks: observability,
    providerMode: mode,
    route: pathname ?? "/",
  });

  const resetStatus = useCallback(() => {
    window.setTimeout(() => setStatus("idle"), 2500);
  }, []);

  const showFallback = useCallback(
    async (fallback?: GistUnavailableResponse["fallback"]) => {
      const gistUrl = fallback?.gistUrl ?? "https://gist.github.com";
      const instructions =
        fallback?.instructions ??
        "Open gist.github.com, paste the copied component into a new secret gist, and save.";

      const copyResult = await copy(text, "Code copied for manual gist paste");
      const copied = copyResult.ok;

      toast(
        copied
          ? `Component copied. GitHub Gist needs setup before automatic links work. ${instructions} (${gistUrl})`
          : `GitHub Gist needs setup before automatic links work. ${instructions} (${gistUrl})`,
        copied ? "warning" : "error",
      );

      analytics.track(AnalyticsEvent.ExportTriggered, {
        source: analyticsSource,
        feature: analyticsFeature,
        trigger: "gist_fallback",
        status: copied ? "success" : "failed",
      });
    },
    [analytics, analyticsFeature, analyticsSource, copy, text, toast],
  );

  const handleClick = useCallback(async () => {
    if (!text?.trim() || status === "exporting") return;

    setStatus("exporting");

    try {
      const response = await fetch("/api/export-gist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: text,
          filename,
          description,
        }),
      });

      let payload: unknown = null;
      try {
        payload = await response.json();
      } catch {
        payload = null;
      }

      if (response.status === 503) {
        setStatus("idle");
        await showFallback((payload as GistUnavailableResponse | null)?.fallback);
        return;
      }

      if (!response.ok || !payload || typeof payload !== "object") {
        setStatus("error");
        toast("Could not create GitHub Gist", "error");
        analytics.track(AnalyticsEvent.ExportTriggered, {
          source: analyticsSource,
          feature: analyticsFeature,
          trigger: "gist",
          status: "failed",
        });
        resetStatus();
        return;
      }

      const gistUrl = (payload as GistSuccessResponse).url;
      if (!gistUrl) {
        setStatus("error");
        toast("GitHub Gist created but no URL was returned", "error");
        resetStatus();
        return;
      }

      setStatus("success");
      window.open(gistUrl, "_blank", "noopener,noreferrer");
      toast("Gist created — opened in a new tab", "success");
      analytics.track(AnalyticsEvent.ExportTriggered, {
        source: analyticsSource,
        feature: analyticsFeature,
        trigger: "gist",
        status: "success",
      });
      onExported?.(gistUrl);
      resetStatus();
    } catch {
      setStatus("error");
      toast("Could not reach gist export API", "error");
      analytics.track(AnalyticsEvent.ExportTriggered, {
        source: analyticsSource,
        feature: analyticsFeature,
        trigger: "gist",
        status: "failed",
      });
      resetStatus();
    }
  }, [
    analytics,
    analyticsFeature,
    analyticsSource,
    description,
    filename,
    onExported,
    resetStatus,
    showFallback,
    status,
    text,
    toast,
  ]);

  const visibleLabel = label ?? STATUS_LABELS[status];
  const StatusIcon =
    status === "exporting"
      ? Loader2
      : status === "success"
        ? Check
        : status === "error"
          ? AlertCircle
          : Code2;

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={() => void handleClick()}
      disabled={!text?.trim() || status === "exporting"}
      aria-label={`${visibleLabel} code`}
      aria-busy={status === "exporting"}
      data-testid="gist-export-button"
      className={cn(
        "min-h-11 min-w-11 touch-manipulation border-border/80 bg-card/95 text-foreground shadow-sm backdrop-blur-sm transition-transform duration-200 hover:-translate-y-0.5 hover:bg-card",
        status === "success" &&
          "border-success/40 bg-success/10 text-success hover:bg-success/10",
        status === "error" &&
          "border-destructive/40 bg-destructive/10 text-destructive hover:bg-destructive/10",
        className,
      )}
    >
      <StatusIcon
        className={cn("size-4", status === "exporting" && "animate-spin")}
        aria-hidden
      />
      <span className="sr-only sm:not-sr-only sm:inline">{visibleLabel}</span>
    </Button>
  );
}
