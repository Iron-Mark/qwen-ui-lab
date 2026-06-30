"use client"

import type * as React from "react"

import { cn } from "@/lib/utils"
import { TabsList } from "./tabs"

type ResponsiveTabsListProps = React.ComponentProps<typeof TabsList> & {
  columns?: 2 | 3 | 4
  compactUntil?: "sm" | "md"
}

function ResponsiveTabsList({
  className,
  columns = 3,
  compactUntil = "sm",
  ...props
}: ResponsiveTabsListProps) {
  const mobileColumns =
    columns === 4 ? "grid-cols-2" : columns === 3 ? "grid-cols-3" : "grid-cols-2"
  const desktopColumns =
    columns === 4 ? "sm:grid-cols-4" : columns === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2"
  const inlineAt = compactUntil === "md" ? "md:inline-grid md:w-auto" : "sm:inline-grid sm:w-auto"

  return (
    <TabsList
      className={cn(
        "grid h-auto w-full gap-1.5 rounded-xl border border-border/70 bg-muted/40 p-1.5 shadow-[inset_0_1px_3px_color-mix(in_oklch,var(--foreground)_14%,transparent),inset_0_-1px_0_color-mix(in_oklch,var(--background)_70%,transparent)] group-data-horizontal/tabs:h-auto",
        mobileColumns,
        desktopColumns,
        inlineAt,
        className,
      )}
      {...props}
    />
  )
}

export { ResponsiveTabsList }
