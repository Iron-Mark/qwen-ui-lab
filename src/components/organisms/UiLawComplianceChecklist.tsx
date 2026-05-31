"use client";

import { useMemo, useState } from "react";
import type { UiLawId } from "@/data/uilaws";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export type ComplianceStatus = "pass" | "warn" | "pending";

export interface ComplianceItem {
  id: string;
  label: string;
  detail: string;
  law: UiLawId;
  status: ComplianceStatus;
}

const DEFAULT_ITEMS: ComplianceItem[] = [
  {
    id: "touch-targets",
    label: "Primary controls ≥ 44px tall",
    detail: "Fitts's Law — enlarge Analyze, Copy, and nav hit areas.",
    law: "fitts",
    status: "pass",
  },
  {
    id: "single-cta",
    label: "One dominant action per step",
    detail: "Hick's Law — avoid competing CTAs during upload/analyze.",
    law: "hick",
    status: "pass",
  },
  {
    id: "familiar-chrome",
    label: "Familiar dashboard + file upload patterns",
    detail: "Jakob's Law — match common admin and dev-tool layouts.",
    law: "jakob",
    status: "pass",
  },
  {
    id: "token-consistency",
    label: "Shared borders, rings, and card shells",
    detail: "Consistency — catalog snippets mirror generated scaffold chrome.",
    law: "consistency",
    status: "warn",
  },
  {
    id: "preview-contrast",
    label: "Reference vs scaffold visually distinct",
    detail: "Contrast — split panes and labels separate screenshot from code.",
    law: "contrast",
    status: "pending",
  },
];

const STATUS_LABEL: Record<ComplianceStatus, string> = {
  pass: "Pass",
  warn: "Review",
  pending: "Pending",
};

const STATUS_BADGE: Record<ComplianceStatus, string> = {
  pass: "border-success/40 bg-success/10 text-success",
  warn: "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  pending: "border-border bg-muted text-muted-foreground",
};

interface UiLawComplianceChecklistProps {
  items?: ComplianceItem[];
  title?: string;
  className?: string;
}

export function UiLawComplianceChecklist({
  items = DEFAULT_ITEMS,
  title = "Scaffold compliance",
  className,
}: UiLawComplianceChecklistProps) {
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  const summary = useMemo(() => {
    const resolved = items.filter((item) => checked[item.id] || item.status === "pass");
    return { done: resolved.length, total: items.length };
  }, [checked, items]);

  return (
    <Card className={cn("shadow-sm", className)} aria-labelledby="compliance-title">
      <CardHeader className="flex-row flex-wrap items-start justify-between gap-3 space-y-0">
        <div>
          <CardTitle id="compliance-title">{title}</CardTitle>
          <CardDescription className="mt-1">
            Quick review checklist for generated UI scaffolds (inspired by{" "}
            <a
              href="https://www.uilaws.com/components"
              className="font-medium text-card-foreground underline-offset-2 hover:underline"
              target="_blank"
              rel="noreferrer"
            >
              UILaws components
            </a>
            ).
          </CardDescription>
        </div>
        <p className="text-sm font-semibold text-muted-foreground">
          {summary.done}/{summary.total} addressed
        </p>
      </CardHeader>

      <CardContent>
        <ul className="space-y-3">
          {items.map((item) => {
            const isChecked = Boolean(checked[item.id]);
            return (
              <li
                key={item.id}
                className="flex gap-3 rounded-lg border border-border bg-background/60 p-3"
              >
                <Checkbox
                  id={`compliance-${item.id}`}
                  checked={isChecked}
                  onCheckedChange={() =>
                    setChecked((prev) => ({
                      ...prev,
                      [item.id]: !prev[item.id],
                    }))
                  }
                  className="mt-0.5"
                />
                <Label htmlFor={`compliance-${item.id}`} className="min-w-0 flex-1 cursor-pointer">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium text-card-foreground">
                      {item.label}
                    </span>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[0.65rem] uppercase tracking-wide",
                        STATUS_BADGE[item.status],
                      )}
                    >
                      {STATUS_LABEL[item.status]}
                    </Badge>
                  </span>
                  <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                    {item.detail}
                  </span>
                </Label>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
