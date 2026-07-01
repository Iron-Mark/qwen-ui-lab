"use client";

import { Check, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type WorkflowStep = {
  id: string;
  label: string;
};

interface WorkflowStepperProps {
  ariaLabel: string;
  currentStepIndex: number;
  steps: WorkflowStep[];
}

export function WorkflowStepper({
  ariaLabel,
  currentStepIndex,
  steps,
}: WorkflowStepperProps) {
  return (
    <div
      data-testid="upload-flow-stepper"
      className="mb-5 flex flex-wrap items-center gap-2 rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-ring/50 sm:flex-nowrap sm:overflow-x-auto sm:pb-2"
      aria-label={ariaLabel}
      tabIndex={0}
    >
      {steps.map((step, index) => {
        const stepState =
          index === currentStepIndex
            ? "current"
            : index < currentStepIndex
              ? "complete"
              : "locked";
        const isCurrent = stepState === "current";
        const isComplete = stepState === "complete";
        const isLocked = stepState === "locked";

        return (
          <div key={step.id} className="flex min-w-0 shrink-0 items-center gap-2">
            <Badge
              variant={isCurrent ? "default" : "outline"}
              data-testid="upload-flow-step"
              data-step-id={step.id}
              data-step-state={stepState}
              aria-current={isCurrent ? "step" : undefined}
              aria-disabled={isLocked ? true : undefined}
              className={cn(
                "min-h-8 rounded-full px-2.5 py-1 text-[11px] transition-colors sm:h-7 sm:px-3 sm:text-xs",
                isCurrent &&
                  "border-primary bg-primary text-white shadow-sm dark:text-primary-foreground",
                isComplete &&
                  "border-border/70 bg-muted/50 text-muted-foreground",
                isLocked &&
                  "border-border/70 bg-muted/35 text-muted-foreground",
              )}
            >
              {isComplete ? <Check className="size-3" aria-hidden="true" /> : null}
              {step.label}
            </Badge>
            {index < steps.length - 1 ? (
              <ChevronRight
                className={cn(
                  "hidden size-3 sm:block",
                  index < currentStepIndex
                    ? "text-muted-foreground/70"
                    : "text-muted-foreground/35",
                )}
                aria-hidden
              />
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
