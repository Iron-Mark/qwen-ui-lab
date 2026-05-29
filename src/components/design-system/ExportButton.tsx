"use client";

import { useCallback, type KeyboardEvent } from "react";
import { cn } from "@/lib/cn";
import { downloadTextFile } from "@/lib/clipboard";
import {
  useCopyToClipboard,
  type CopyStatus,
} from "@/lib/hooks/useCopyToClipboard";

export type ExportButtonVariant = "copy" | "export";

interface ExportButtonProps {
  text: string;
  variant?: ExportButtonVariant;
  label?: string;
  filename?: string;
  overlay?: boolean;
  className?: string;
  onCopied?: () => void;
}

const LABELS: Record<ExportButtonVariant, Record<CopyStatus, string>> = {
  copy: {
    idle: "Copy",
    copying: "Copying…",
    success: "Copied",
    error: "Failed",
  },
  export: {
    idle: "Export",
    copying: "Exporting…",
    success: "Exported",
    error: "Failed",
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
    return (
      <svg
        className="h-4 w-4 animate-spin text-muted-foreground"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
        />
      </svg>
    );
  }

  if (status === "success") {
    return (
      <svg
        className="h-4 w-4 text-success"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M20 6 9 17l-5-5" />
      </svg>
    );
  }

  if (status === "error") {
    return (
      <svg
        className="h-4 w-4 text-danger"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
    );
  }

  if (variant === "export") {
    return (
      <svg
        className="h-4 w-4"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
      </svg>
    );
  }

  return (
    <svg
      className="h-4 w-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
      <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
    </svg>
  );
}

export function ExportButton({
  text,
  variant = "copy",
  label,
  filename = "component.tsx",
  overlay = false,
  className,
  onCopied,
}: ExportButtonProps) {
  const { status, message, copy, isCopying } = useCopyToClipboard();
  const labels = LABELS[variant];
  const visibleLabel = label ?? labels[status];

  const handleClick = useCallback(async () => {
    if (!text || isCopying) return;

    if (variant === "export") {
      downloadTextFile(text, filename, "text/typescript;charset=utf-8");
      const result = await copy(text, "File downloaded and code copied");
      if (result.ok) onCopied?.();
      return;
    }

    const result = await copy(text, "Code copied to clipboard");
    if (result.ok) onCopied?.();
  }, [copy, filename, isCopying, onCopied, text, variant]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLButtonElement>) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        void handleClick();
      }
    },
    [handleClick],
  );

  const ariaLabel =
    status === "idle"
      ? `${visibleLabel} code`
      : message || visibleLabel;

  return (
    <>
      <button
        type="button"
        onClick={() => void handleClick()}
        onKeyDown={handleKeyDown}
        disabled={!text || isCopying}
        aria-label={ariaLabel}
        aria-busy={isCopying}
        className={cn(
          "inline-flex min-h-11 min-w-11 cursor-pointer touch-manipulation items-center justify-center gap-1.5 rounded-lg border border-border bg-card/95 px-3 py-2 text-sm font-semibold text-card-foreground shadow-sm backdrop-blur-sm",
          "transition-[background-color,opacity,border-color] duration-200 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          "disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transition-none",
          overlay && "absolute left-3 top-3 z-20",
          status === "success" && "border-success/40 bg-success/10 text-success",
          status === "error" && "border-danger/40 bg-danger/10 text-danger",
          className,
        )}
      >
        <StatusIcon status={status} variant={variant} />
        <span className="sr-only sm:not-sr-only sm:inline">{visibleLabel}</span>
      </button>
      <span className="sr-only" aria-live="polite" aria-atomic="true">
        {message}
      </span>
    </>
  );
}
