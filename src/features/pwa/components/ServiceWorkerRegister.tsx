"use client";

import { useEffect, useRef } from "react";
import { RefreshCw, X } from "lucide-react";
import { toast } from "sonner";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const UPDATE_TOAST_ID = "pwa-update-available";

function showUpdateToast(
  registration: ServiceWorkerRegistration,
  onRefresh: () => void,
) {
  const waiting = registration.waiting;
  if (!waiting) return;

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
              "bg-primary/15 text-primary",
            )}
            aria-hidden
          >
            <RefreshCw className="size-3.5" />
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium leading-5">Update available</p>
            <p className="mt-0.5 text-xs leading-4 text-muted-foreground">
              A new version of qwen-ui-lab is ready. Refresh when convenient.
            </p>
          </div>

          <div className="flex items-start gap-1">
            <button
              type="button"
              className={cn(buttonVariants({ variant: "default", size: "sm" }), "min-h-11 px-3")}
              onClick={() => {
                onRefresh();
                waiting.postMessage({ type: "SKIP_WAITING" });
                toast.dismiss(t);
              }}
            >
              Refresh
            </button>
            <button
              type="button"
              className={buttonVariants({ variant: "ghost", size: "icon-lg" })}
              title="Dismiss"
              aria-label="Dismiss update notice"
              onClick={() => toast.dismiss(t)}
            >
              <X className="size-4" aria-hidden />
            </button>
          </div>
        </div>
      </div>
    ),
    { id: UPDATE_TOAST_ID, duration: Number.POSITIVE_INFINITY, position: "bottom-left" },
  );
}

function watchWaitingWorker(
  registration: ServiceWorkerRegistration,
  onRefresh: () => void,
) {
  if (registration.waiting && navigator.serviceWorker.controller) {
    showUpdateToast(registration, onRefresh);
  }

  registration.addEventListener("updatefound", () => {
    const installing = registration.installing;
    if (!installing) return;

    installing.addEventListener("statechange", () => {
      if (installing.state !== "installed") return;
      if (!navigator.serviceWorker.controller) return;
      showUpdateToast(registration, onRefresh);
    });
  });
}

export function ServiceWorkerRegister() {
  const pendingRefreshRef = useRef(false);

  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;

    const markPendingRefresh = () => {
      pendingRefreshRef.current = true;
    };

    const register = () => {
      void navigator.serviceWorker
        .register("/sw.js", { scope: "/", updateViaCache: "none" })
        .then((registration) => {
          watchWaitingWorker(registration, markPendingRefresh);
          void registration.update();
        })
        .catch(() => {
          /* PWA is best-effort */
        });
    };

    if (typeof globalThis.requestIdleCallback === "function") {
      const idleId = globalThis.requestIdleCallback(register, { timeout: 4000 });
      return () => globalThis.cancelIdleCallback(idleId);
    }

    const timeoutId = globalThis.setTimeout(register, 1500);
    return () => globalThis.clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;

    const reloadOnControllerChange = () => {
      if (!pendingRefreshRef.current) return;
      globalThis.location.reload();
    };

    navigator.serviceWorker?.addEventListener("controllerchange", reloadOnControllerChange);
    return () => {
      navigator.serviceWorker?.removeEventListener("controllerchange", reloadOnControllerChange);
    };
  }, []);

  return null;
}
