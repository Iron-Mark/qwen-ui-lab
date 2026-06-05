"use client";

import { useEffect } from "react";

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;

    const register = () => {
      void navigator.serviceWorker
        .register("/sw.js", { scope: "/", updateViaCache: "none" })
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
      globalThis.location.reload();
    };
    navigator.serviceWorker?.addEventListener("controllerchange", reloadOnControllerChange);
    return () => {
      navigator.serviceWorker?.removeEventListener("controllerchange", reloadOnControllerChange);
    };
  }, []);

  return null;
}
