"use client";

import { useProviderMode } from "@/lib/provider-mode";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function ProviderModeBadge() {
  const { mode } = useProviderMode();

  const label =
    mode === "live"
      ? "Live Qwen"
      : mode === "demo"
        ? "Demo mode"
        : "Checking…";

  const tooltip =
    mode === "live"
      ? "QWEN_LIVE_ANALYSIS=true — Analyze calls Qwen vision."
      : "Demo mode — instant offline analysis. Set QWEN_LIVE_ANALYSIS=true (and DASHSCOPE_API_KEY) for live calls.";

  return (
    <Badge
      variant="outline"
      title={tooltip}
      className={cn(
        "hidden sm:inline-flex",
        mode === "live" && "border-success/40 bg-success/10 text-success",
        mode === "demo" &&
          "border-amber-500/40 bg-amber-500/10 text-amber-900 dark:text-amber-100",
      )}
    >
      {label}
    </Badge>
  );
}
