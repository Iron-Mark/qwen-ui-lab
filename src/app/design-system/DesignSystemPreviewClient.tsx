"use client";

import { useEffect, useState, type ComponentType } from "react";
import { DesignSystemPreviewSkeletonBody } from "@/components/design-system/DesignSystemPreviewSkeleton";

type PreviewComponent = ComponentType<Record<string, never>>;

export function DesignSystemPreviewClient() {
  const [Preview, setPreview] = useState<PreviewComponent | null>(null);
  const [allowImport, setAllowImport] = useState(false);

  useEffect(() => {
    const startImport = () => setAllowImport(true);
    if (typeof globalThis.requestIdleCallback === "function") {
      const idleId = globalThis.requestIdleCallback(startImport, { timeout: 1800 });
      return () => globalThis.cancelIdleCallback(idleId);
    }
    const timeoutId = globalThis.setTimeout(startImport, 1);
    return () => globalThis.clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    if (!allowImport) return;
    let cancelled = false;
    import("@/components/design-system/DesignSystemPreview").then((mod) => {
      if (cancelled) return;
      setPreview(() => mod.DesignSystemPreview);
    });
    return () => {
      cancelled = true;
    };
  }, [allowImport]);

  return (
    <div className="space-y-6" aria-busy={!Preview}>
      {!Preview ? <DesignSystemPreviewSkeletonBody /> : null}
      {Preview ? <Preview /> : null}
    </div>
  );
}
