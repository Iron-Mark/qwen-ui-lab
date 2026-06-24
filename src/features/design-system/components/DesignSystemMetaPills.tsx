"use client";

import { Tag, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetaPillProps {
  label: string;
  Icon?: LucideIcon;
  compact?: boolean;
  className?: string;
}

export function ComponentLevelPill({
  label,
  Icon,
  compact = false,
  className,
}: MetaPillProps) {
  const LevelIcon = Icon;

  if (compact) {
    return (
      <div
        className={cn(
          "inline-flex min-h-7 items-center gap-1.5 rounded-md border border-primary/35 bg-primary/10 px-2 text-primary shadow-[inset_0_1px_0_color-mix(in_oklch,var(--background)_72%,transparent)]",
          className,
        )}
      >
        <span className="flex size-4 shrink-0 items-center justify-center rounded bg-primary text-primary-foreground">
          {LevelIcon ? <LevelIcon className="size-3" aria-hidden="true" /> : null}
        </span>
        <span className="font-medium text-primary/80">Level</span>
        <span className="font-bold text-foreground">{label}</span>
      </div>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex min-h-12 items-center gap-2.5 rounded-2xl border border-primary/35 bg-primary/10 px-3 text-primary shadow-[0_10px_24px_color-mix(in_oklch,var(--primary)_10%,transparent),inset_0_1px_0_color-mix(in_oklch,var(--background)_76%,transparent)] dark:bg-primary/15",
        className,
      )}
    >
      <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
        {LevelIcon ? <LevelIcon className="size-4" aria-hidden="true" /> : null}
      </span>
      <span className="grid gap-1 leading-none">
        <span className="text-[0.58rem] font-bold uppercase tracking-[0.18em] text-primary/80">
          Component level
        </span>
        <span className="text-sm font-semibold text-foreground">{label}</span>
      </span>
    </span>
  );
}

export function CollectionPill({
  label,
  compact = false,
  className,
}: MetaPillProps) {
  if (compact) {
    return (
      <div
        className={cn(
          "inline-flex min-h-7 items-center gap-1.5 rounded-full border border-dashed border-amber-500/35 bg-amber-500/[0.07] px-2 text-muted-foreground shadow-[inset_0_1px_0_color-mix(in_oklch,var(--background)_78%,transparent)] dark:bg-amber-500/10",
          className,
        )}
      >
        <Tag className="size-3.5 shrink-0 text-amber-600 dark:text-amber-300" aria-hidden="true" />
        <span className="font-medium text-amber-700/90 dark:text-amber-200/90">Collection</span>
        <span className="font-semibold text-foreground/80">{label}</span>
      </div>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex min-h-11 items-center gap-2.5 rounded-2xl border border-dashed border-amber-500/35 bg-amber-500/[0.07] px-3 text-muted-foreground shadow-[inset_0_1px_0_color-mix(in_oklch,var(--background)_80%,transparent)] dark:bg-amber-500/10",
        className,
      )}
    >
      <span className="flex size-7 shrink-0 items-center justify-center rounded-lg border border-amber-500/35 bg-background/55 text-amber-600 dark:text-amber-300">
        <Tag className="size-3.5" aria-hidden="true" />
      </span>
      <span className="grid gap-1 leading-none">
        <span className="text-[0.58rem] font-bold uppercase tracking-[0.18em] text-amber-700/85 dark:text-amber-200/85">
          Collection
        </span>
        <span className="text-xs font-semibold text-foreground/85">{label}</span>
      </span>
    </span>
  );
}
