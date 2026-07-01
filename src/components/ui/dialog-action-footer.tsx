"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

type DialogActionFooterProps = React.ComponentProps<"div"> & {
  align?: "between" | "end"
}

function DialogActionFooter({
  className,
  align = "end",
  ...props
}: DialogActionFooterProps) {
  return (
    <div
      data-slot="dialog-action-footer"
      className={cn(
        "shrink-0 border-t border-border/70 bg-background/95 px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-3 shadow-[0_-1px_0_color-mix(in_oklch,var(--background)_80%,transparent)] backdrop-blur sm:px-5 sm:py-4",
        align === "between"
          ? "grid gap-3 sm:flex sm:flex-wrap sm:items-center sm:justify-between"
          : "flex flex-col-reverse gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end",
        className,
      )}
      {...props}
    />
  )
}

function DialogActionGroup({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-action-group"
      className={cn("flex flex-wrap items-center gap-2", className)}
      {...props}
    />
  )
}

export { DialogActionFooter, DialogActionGroup }
