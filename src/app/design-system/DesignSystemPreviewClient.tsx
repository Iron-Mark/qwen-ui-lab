"use client";

import dynamic from "next/dynamic";

function DesignSystemFallback() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 text-sm text-muted-foreground">
      Loading design system…
    </div>
  );
}

const DesignSystemPreviewLazy = dynamic(
  () =>
    import("@/components/design-system/DesignSystemPreview").then((mod) => ({
      default: mod.DesignSystemPreview,
    })),
  {
    loading: () => <DesignSystemFallback />,
    ssr: false,
  },
);

export function DesignSystemPreviewClient() {
  return <DesignSystemPreviewLazy />;
}

