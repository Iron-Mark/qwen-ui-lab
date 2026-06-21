"use client";

import { ServerCog } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ProductionReadinessPanel } from "@/features/ops/components/ProductionReadinessPanel";

export function DeveloperReadinessDialog() {
  return (
    <Dialog>
      <DialogTrigger
        type="button"
        data-testid="developer-readiness-trigger"
        aria-haspopup="dialog"
        className="inline-flex items-center gap-1.5 rounded-md px-1.5 py-0.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/50 hover:text-card-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <ServerCog className="size-3.5" aria-hidden />
        Developer
      </DialogTrigger>

      <DialogContent className="flex max-h-[min(88vh,44rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-4xl">
        <DialogHeader className="border-b border-border px-4 pt-4 pb-3">
          <DialogTitle>Developer status</DialogTitle>
          <DialogDescription>
            Runtime readiness checks for deploy configuration and fallback paths.
          </DialogDescription>
        </DialogHeader>
        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          <ProductionReadinessPanel
            compact
            contained={false}
            className="shadow-none"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
