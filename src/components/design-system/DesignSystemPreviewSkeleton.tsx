export function DesignSystemPreviewSkeletonBody() {
  return (
    <>
      <div className="min-h-[11.5rem] animate-pulse rounded-2xl border border-border/70 bg-muted/25" />
      <div className="grid items-start gap-4 lg:h-[calc(100dvh-13.5rem)] lg:max-h-[calc(100dvh-13.5rem)] lg:grid-cols-[23rem_minmax(0,1fr)] lg:overflow-hidden lg:[contain:layout_size_style]">
        <div className="h-[min(28rem,calc(100dvh-14rem))] animate-pulse rounded-2xl border border-border/70 bg-muted/20 lg:h-full" />
        <div className="h-64 animate-pulse rounded-2xl border border-border/70 bg-muted/20 lg:h-full" />
      </div>
    </>
  );
}

export function DesignSystemPreviewSkeleton() {
  return (
    <div
      className="space-y-6"
      aria-busy="true"
      aria-label="Loading design system"
    >
      <DesignSystemPreviewSkeletonBody />
    </div>
  );
}
