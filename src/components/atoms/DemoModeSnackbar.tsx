"use client";

import { useEffect, useRef } from "react";
import { Info, X } from "lucide-react";
import { toast } from "sonner";
import { useProviderMode } from "@/lib/provider-mode";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const SESSION_KEY = "qwen-ui-lab:demo-mode-snackbar-shown";
const TOAST_ID = "demo-mode-snackbar";
const DEFAULT_DURATION_MS = 8000;

export function DemoModeSnackbar({ durationMs = DEFAULT_DURATION_MS }: { durationMs?: number }) {
  const { mode } = useProviderMode();
  const shownRef = useRef(false);

  useEffect(() => {
    if (shownRef.current) return;
    if (mode !== "demo") return;

    try {
      if (sessionStorage.getItem(SESSION_KEY) === "1") return;
      sessionStorage.setItem(SESSION_KEY, "1");
    } catch {
      // Ignore storage errors (e.g. blocked), still show once per mount.
    }

    shownRef.current = true;

    toast.custom(
      (t) => (
        <div
          role="status"
          aria-live="polite"
          className={cn(
            "relative w-[min(92vw,460px)] overflow-hidden rounded-xl border bg-popover text-popover-foreground shadow-sm",
            "px-3 py-2.5",
          )}
        >
          <div className="flex items-start gap-2.5">
            <div
              className={cn(
                "mt-0.5 flex size-6 items-center justify-center rounded-full",
                "bg-amber-500/15 text-amber-700 dark:text-amber-200",
              )}
              aria-hidden
            >
              <Info className="size-3.5" />
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium leading-5">Demo mode</p>
              <p className="mt-0.5 text-xs leading-4 text-muted-foreground">
                Instant offline analysis. Set <span className="font-mono">QWEN_LIVE_ANALYSIS=true</span>{" "}
                (and <span className="font-mono">DASHSCOPE_API_KEY</span>) for live calls.
              </p>
            </div>

            <div className="flex items-start gap-1">
              <button
                type="button"
                className={cn(buttonVariants({ variant: "ghost", size: "icon-lg" }), "h-9 w-9")}
                title="Dismiss"
                aria-label="Dismiss demo mode notice"
                onClick={() => toast.dismiss(t)}
              >
                <X className="size-4" aria-hidden />
              </button>
            </div>
          </div>

          <div
            aria-hidden
            className={cn(
              "absolute inset-x-0 bottom-0 h-0.5 bg-amber-500/25",
              "[mask-image:linear-gradient(to_right,black,transparent)]",
            )}
            style={{
              animation: `demo-snackbar-decay ${durationMs}ms linear forwards`,
            }}
          />

          <style>{`
            @keyframes demo-snackbar-decay {
              from { transform: translateX(0%); }
              to { transform: translateX(-100%); }
            }
          `}</style>
        </div>
      ),
      { id: TOAST_ID, duration: durationMs },
    );
  }, [durationMs, mode]);

  return null;
}

