"use client";

import { useCallback, useState } from "react";
import { usePathname } from "next/navigation";
import { AlertCircle, Check, FolderGit2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/providers/Toast";
import { useObservability } from "@/components/providers/ObservabilityProvider";
import { useProviderMode } from "@/components/providers/ProviderModeProvider";
import { AnalyticsEvent, createAnalyticsClient } from "@/lib/analytics.client";

const SCAFFOLD_ZIP_FILENAME = "qwen-ui-lab-export-package.zip";

type RepoExportStatus = "idle" | "exporting" | "success" | "error";

interface RepoExportButtonProps {
  text: string;
  filename?: string;
  description?: string;
  label?: string;
  className?: string;
  analyticsSource?: string;
  analyticsFeature?: string;
  onExported?: (result: { mode: "zip" | "compare"; url?: string }) => void;
}

interface RepoCompareResponse {
  mode: "compare";
  url: string;
  instructions?: string;
}

const STATUS_LABELS: Record<RepoExportStatus, string> = {
  idle: "Export to repo",
  exporting: "Preparing export…",
  success: "Export ready",
  error: "Export failed",
};

function downloadZipBlob(blob: Blob, filename = SCAFFOLD_ZIP_FILENAME) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

export function RepoExportButton({
  text,
  filename = "component.tsx",
  description = "qwen-ui-lab component export",
  label,
  className,
  analyticsSource = "snippet_preview",
  analyticsFeature = "code_export",
  onExported,
}: RepoExportButtonProps) {
  const pathname = usePathname();
  const observability = useObservability();
  const { mode } = useProviderMode();
  const { toast } = useToast();
  const [status, setStatus] = useState<RepoExportStatus>("idle");
  const analytics = createAnalyticsClient({
    hooks: observability,
    providerMode: mode,
    route: pathname ?? "/",
  });

  const resetStatus = useCallback(() => {
    window.setTimeout(() => setStatus("idle"), 2500);
  }, []);

  const handleClick = useCallback(async () => {
    if (!text?.trim() || status === "exporting") return;

    setStatus("exporting");

    try {
      const response = await fetch("/api/export-repo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: text,
          filename,
          description,
        }),
      });

      const contentType = response.headers.get("content-type") ?? "";

      if (contentType.includes("application/zip")) {
        const blob = await response.blob();
        downloadZipBlob(blob);
        setStatus("success");
        toast("Export package downloaded", "success");
        analytics.track(AnalyticsEvent.ExportTriggered, {
          source: analyticsSource,
          feature: analyticsFeature,
          trigger: "repo_zip",
          status: "success",
        });
        onExported?.({ mode: "zip" });
        resetStatus();
        return;
      }

      let payload: unknown = null;
      try {
        payload = await response.json();
      } catch {
        payload = null;
      }

      if (!response.ok || !payload || typeof payload !== "object") {
        setStatus("error");
        toast("Could not export component to repo", "error");
        analytics.track(AnalyticsEvent.ExportTriggered, {
          source: analyticsSource,
          feature: analyticsFeature,
          trigger: "repo",
          status: "failed",
        });
        resetStatus();
        return;
      }

      const record = payload as RepoCompareResponse & { url?: string; instructions?: string };
      if (record.mode === "compare" && record.url) {
        window.open(record.url, "_blank", "noopener,noreferrer");
        setStatus("success");
        toast(
          record.instructions ??
            "Compare view opened — add your generated component and open a PR.",
          "success",
        );
        analytics.track(AnalyticsEvent.ExportTriggered, {
          source: analyticsSource,
          feature: analyticsFeature,
          trigger: "repo_compare",
          status: "success",
        });
        onExported?.({ mode: "compare", url: record.url });
        resetStatus();
        return;
      }

      setStatus("error");
      toast("Repo export returned an unexpected response", "error");
      analytics.track(AnalyticsEvent.ExportTriggered, {
        source: analyticsSource,
        feature: analyticsFeature,
        trigger: "repo",
        status: "failed",
      });
      resetStatus();
    } catch {
      setStatus("error");
      toast("Could not reach repo export API", "error");
      analytics.track(AnalyticsEvent.ExportTriggered, {
        source: analyticsSource,
        feature: analyticsFeature,
        trigger: "repo",
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
          : FolderGit2;

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={() => void handleClick()}
      disabled={!text?.trim() || status === "exporting"}
      aria-label={`${visibleLabel} code`}
      aria-busy={status === "exporting"}
      data-testid="repo-export-button"
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
