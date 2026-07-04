"use client";

import { useCallback, useState } from "react";
import { usePathname } from "next/navigation";
import {
  AlertCircle,
  Check,
  Copy,
  Download,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";
import { downloadTextFile } from "@/lib/clipboard.client";
import { useToast } from "@/components/providers/Toast";
import {
  useCopyToClipboard,
  type CopyStatus,
} from "@/lib/hooks/useCopyToClipboard";
import { useObservability } from "@/components/providers/ObservabilityProvider";
import { useProviderMode } from "@/components/providers/ProviderModeProvider";
import { AnalyticsEvent, createAnalyticsClient } from "@/lib/analytics.client";
import { createExportActionAriaLabel } from "../lib/export-action-labels.mjs";
import {
  EXPORT_ACTION_BUTTON_BASE_CLASS,
  EXPORT_ACTION_BUTTON_ERROR_CLASS,
  EXPORT_ACTION_BUTTON_SUCCESS_CLASS,
} from "../lib/export-action-button-styles";

export type ExportButtonVariant = "copy" | "export";

interface ExportButtonProps {
  text: string;
  variant?: ExportButtonVariant;
  label?: string;
  filename?: string;
  overlay?: boolean;
  showToast?: boolean;
  className?: string;
  onCopied?: () => void;
  analyticsSource?: string;
  analyticsFeature?: string;
}

const LABELS: Record<ExportButtonVariant, Record<CopyStatus, string>> = {
  copy: {
    idle: "Copy",
    copying: "Copying...",
    success: "Copied",
    error: "Failed",
  },
  export: {
    idle: "Download component",
    copying: "Downloading...",
    success: "Downloaded",
    error: "Download failed",
  },
};

function StatusIcon({
  status,
  variant,
}: {
  status: CopyStatus;
  variant: ExportButtonVariant;
}) {
  if (status === "copying") {
    return <Loader2 className="size-4 animate-spin" aria-hidden />;
  }
  if (status === "success") {
    return <Check className="size-4 text-success" aria-hidden />;
  }
  if (status === "error") {
    return <AlertCircle className="size-4 text-destructive" aria-hidden />;
  }
  return variant === "export" ? (
    <Download className="size-4" aria-hidden />
  ) : (
    <Copy className="size-4" aria-hidden />
  );
}

export function ExportButton({
  text,
  variant = "copy",
  label,
  filename = "starter-component.tsx",
  overlay = false,
  showToast = true,
  className,
  onCopied,
  analyticsSource = "snippet_preview",
  analyticsFeature = "code_export",
}: ExportButtonProps) {
  const pathname = usePathname();
  const observability = useObservability();
  const { mode } = useProviderMode();
  const { toast } = useToast();
  const { status, message, copy, isCopying } = useCopyToClipboard();
  const [downloadStatus, setDownloadStatus] = useState<CopyStatus>("idle");
  const labels = LABELS[variant];
  const effectiveStatus = variant === "export" ? downloadStatus : status;
  const isBusy = variant === "export" ? downloadStatus === "copying" : isCopying;
  const visibleLabel = label ?? labels[effectiveStatus];
  const analytics = createAnalyticsClient({
    hooks: observability,
    providerMode: mode,
    route: pathname ?? "/",
  });

  const handleClick = useCallback(async () => {
    if (!text || isBusy) return;

    if (variant === "export") {
      setDownloadStatus("copying");
      try {
        downloadTextFile(text, filename, "text/typescript;charset=utf-8");
        analytics.track(AnalyticsEvent.ExportTriggered, {
          source: analyticsSource,
          feature: analyticsFeature,
          trigger: "export",
          status: "success",
        });
        setDownloadStatus("success");
        if (showToast) {
          toast("Component downloaded", "success");
        }
        onCopied?.();
        window.setTimeout(() => setDownloadStatus("idle"), 1800);
      } catch {
        analytics.track(AnalyticsEvent.ExportTriggered, {
          source: analyticsSource,
          feature: analyticsFeature,
          trigger: "export",
          status: "failed",
        });
        setDownloadStatus("error");
        if (showToast) {
          toast("Download failed. Try copying instead.", "error");
        }
        window.setTimeout(() => setDownloadStatus("idle"), 2200);
      }
      return;
    }

    const result = await copy(text, "Code copied to clipboard");
    if (result.ok) {
      analytics.track(AnalyticsEvent.ExportTriggered, {
        source: analyticsSource,
        feature: analyticsFeature,
        trigger: "copy",
        status: "success",
      });
      if (showToast) {
        toast("Copied to clipboard", "success");
      }
      onCopied?.();
    } else {
      analytics.track(AnalyticsEvent.ExportTriggered, {
        source: analyticsSource,
        feature: analyticsFeature,
        trigger: "copy",
        status: "failed",
      });
      if (showToast) {
        toast("Copy failed. Try downloading instead.", "error");
      }
    }
  }, [
    analytics,
    analyticsFeature,
    analyticsSource,
    copy,
    filename,
    isBusy,
    onCopied,
    text,
    toast,
    variant,
    showToast,
  ]);

  const ariaLabel =
    effectiveStatus === "idle"
      ? createExportActionAriaLabel(visibleLabel)
      : message || createExportActionAriaLabel(visibleLabel);

  const button = (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={() => void handleClick()}
      disabled={!text || isBusy}
      aria-label={ariaLabel}
      aria-busy={isBusy}
      className={cn(
        EXPORT_ACTION_BUTTON_BASE_CLASS,
        overlay && "absolute left-3 top-3 z-20",
        effectiveStatus === "success" && EXPORT_ACTION_BUTTON_SUCCESS_CLASS,
        effectiveStatus === "error" && EXPORT_ACTION_BUTTON_ERROR_CLASS,
        className,
      )}
    >
      <StatusIcon status={effectiveStatus} variant={variant} />
      <span className={overlay ? "sr-only sm:not-sr-only sm:inline" : "inline"}>
        {visibleLabel}
      </span>
    </Button>
  );

  return (
    <>
      {button}
      <span className="sr-only" aria-live="polite" aria-atomic="true">
        {message}
      </span>
    </>
  );
}

export { buttonVariants };
