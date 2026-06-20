"use client";

import { useEffect, useRef } from "react";
import { Info, X } from "lucide-react";
import { toast } from "sonner";
import { useLocale } from "@/lib/i18n";
import { useProviderMode } from "@/lib/provider-mode";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const SESSION_KEY = "qwen-ui-lab:demo-mode-snackbar-shown";
const TOAST_ID = "demo-mode-snackbar";
const DEFAULT_DURATION_MS = 6000;

export function DemoModeSnackbar({ durationMs = DEFAULT_DURATION_MS }: { durationMs?: number }) {
  const { dict } = useLocale();
  const t = dict.demoBanner;
  const { mode } = useProviderMode();
  const shownRef = useRef(false);

  useEffect(() => {
    if (shownRef.current) return;
    if (mode !== "demo") return;

    try {
      if (sessionStorage.getItem(SESSION_KEY) === "1") return;
    } catch {
      // Ignore storage errors (e.g. blocked), still attempt once per mount.
    }

    shownRef.current = true;

    const markShownForSession = () => {
      try {
        sessionStorage.setItem(SESSION_KEY, "1");
      } catch {
        // Ignore storage errors.
      }
    };

    const startedAt = performance.now();
    const maxWaitMs = 20_000;

    const showWhenToasterReady = () => {
      const toaster = document.querySelector("[data-sonner-toaster]");
      const toasterReady =
        toaster instanceof HTMLElement &&
        toaster.getAttribute("data-x-position") &&
        toaster.getAttribute("data-y-position");

      if (!toasterReady) {
        if (performance.now() - startedAt < maxWaitMs) {
          requestAnimationFrame(showWhenToasterReady);
          return;
        }
      }

      markShownForSession();

      toast.custom(
        (toastId) => (
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
                <p className="text-sm font-medium leading-5">{t.title}</p>
                <p className="mt-0.5 text-xs leading-4 text-muted-foreground">{t.body}</p>
              </div>

              <div className="flex items-start gap-1">
                <button
                  type="button"
                  className={cn(buttonVariants({ variant: "ghost", size: "icon-lg" }), "h-9 w-9")}
                  title={t.dismissTitle}
                  aria-label={t.dismissAria}
                  onClick={() => toast.dismiss(toastId)}
                >
                  <X className="size-4" aria-hidden />
                </button>
              </div>
            </div>

            <div
              aria-hidden
              className="absolute inset-x-0 bottom-0 h-1 overflow-hidden bg-amber-500/15"
            >
              <div
                className="h-full origin-left bg-amber-500/70"
                style={{
                  animation: `demo-snackbar-decay ${durationMs}ms linear forwards`,
                }}
              />
            </div>

            <style>{`
            @keyframes demo-snackbar-decay {
              from { transform: scaleX(1); }
              to { transform: scaleX(0); }
            }
          `}</style>
          </div>
        ),
        { id: TOAST_ID, duration: durationMs, position: "bottom-left" },
      );
    };

    requestAnimationFrame(showWhenToasterReady);
  }, [durationMs, mode, t.body, t.dismissAria, t.dismissTitle, t.title]);

  return null;
}
