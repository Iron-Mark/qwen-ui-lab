"use client";

import dynamic from "next/dynamic";
import { PageContainer } from "@/components/layout/PageContainer";

function DesignSystemPreviewSkeleton() {
  return (
    <PageContainer
      className="space-y-6 py-6"
      aria-busy="true"
      aria-label="Loading design system"
    >
      <div className="min-h-[11.5rem] animate-pulse rounded-2xl border border-border/70 bg-muted/25" />
      <div className="grid min-h-[calc(100vh-14rem)] gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <div className="min-h-[28rem] animate-pulse rounded-2xl border border-border/70 bg-muted/20" />
        <div className="min-h-[32rem] animate-pulse rounded-2xl border border-border/70 bg-muted/20" />
      </div>
    </PageContainer>
  );
}

const DesignSystemPreviewLazy = dynamic(
  () =>
    import("@/components/design-system/DesignSystemPreview").then((mod) => ({
      default: mod.DesignSystemPreview,
    })),
  {
    loading: () => <DesignSystemPreviewSkeleton />,
    ssr: false,
  },
);

export function DesignSystemPreviewClient() {
  return <DesignSystemPreviewLazy />;
}
