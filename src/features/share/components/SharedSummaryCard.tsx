"use client";

import { Link2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { interpolate, useLocale } from "@/lib/i18n";
import { buildShareableSummary } from "@/features/share/lib/share-result.mjs";

type SharedSummaryCardProps = {
  summary: NonNullable<ReturnType<typeof buildShareableSummary>>;
  testId?: string;
};

export function SharedSummaryCard({
  summary,
  testId = "shared-result-summary",
}: SharedSummaryCardProps) {
  const { dict } = useLocale();
  const t = dict.uploadFlow;

  return (
    <Card className="border-primary/30 bg-primary/5" data-testid={testId}>
      <CardHeader className="pb-2">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <Link2 className="size-4 text-primary" aria-hidden />
              {t.sharedSummaryTitle}
            </CardTitle>
            <CardDescription className="mt-1 text-xs">
              {interpolate(t.sharedSummaryDescription, { file: summary.file })}
            </CardDescription>
          </div>
          <Badge variant="outline">{summary.mode}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        <p className="text-sm text-muted-foreground">{summary.summary}</p>
        {summary.stats.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {summary.stats.map((stat) => (
              <Badge key={`${stat.l}-${stat.v}`} variant="secondary">
                {stat.l}: {stat.v}
              </Badge>
            ))}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
