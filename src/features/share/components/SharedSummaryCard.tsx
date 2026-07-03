"use client";

import { CheckCircle2, FileText, Link2, ScanSearch, SlidersHorizontal } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  detectionKindLabel,
  detectionPrimitiveLabel,
  detectionReviewNeedLabel,
} from "@/lib/detection-labels";
import { interpolate } from "@/lib/i18n";
import { useLocale } from "@/lib/i18n/use-locale.client";
import { buildShareableSummary } from "../lib/share-result.mjs";

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
  const detections = summary.detections;
  const detectionCounts = detections ? detectionSummaryCounts(detections) : null;
  const confidenceLabel =
    detections && typeof detections.quality.confidence === "number"
      ? `${Math.round(detections.quality.confidence * 100)}%`
      : "Local";
  const metrics =
    detections && detectionCounts
      ? [
          {
            label: "Included",
            value: `${detectionCounts.active}/${detections.elements.length}`,
            icon: CheckCircle2,
          },
          {
            label: "Updated",
            value: String(detectionCounts.edited),
            icon: SlidersHorizontal,
          },
          {
            label: "Confidence",
            value: confidenceLabel,
            icon: ScanSearch,
          },
        ]
      : [];

  return (
    <Card
      className="overflow-hidden border-border/80 bg-background shadow-sm"
      data-testid={testId}
    >
      <CardHeader className="border-b border-border/70 bg-muted/25 pb-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 space-y-2">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <span className="grid size-8 shrink-0 place-items-center rounded-lg border border-primary/20 bg-primary/10 text-primary">
                <Link2 className="size-4" aria-hidden />
              </span>
              {t.sharedSummaryTitle}
            </CardTitle>
            <CardDescription className="text-sm">
              {interpolate(t.sharedSummaryDescription, { file: summary.file })}
            </CardDescription>
          </div>
          <Badge
            variant="secondary"
            className="w-fit rounded-full border border-border bg-background px-3 py-1 text-xs font-medium"
          >
            {summary.mode}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-5 p-4 sm:p-5">
        <div className="space-y-2">
          <p className="text-sm leading-6 text-foreground">{summary.summary}</p>
          <div className="flex min-h-8 flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <FileText className="size-3.5" aria-hidden />
            <span className="break-all font-medium text-foreground">{summary.file}</span>
          </div>
        </div>
        {summary.stats.length > 0 ? (
          <div className="grid gap-2 sm:grid-cols-2">
            {summary.stats.map((stat) => (
              <div
                key={`${stat.l}-${stat.v}`}
                className="rounded-lg border border-border/80 bg-muted/25 px-3 py-2"
              >
                <p className="text-[11px] font-medium uppercase text-muted-foreground">
                  {stat.l}
                </p>
                <p className="mt-1 text-base font-semibold text-foreground">{stat.v}</p>
              </div>
            ))}
          </div>
        ) : null}
        {detections && detectionCounts ? (
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(16rem,0.8fr)]">
            <div className="grid gap-2 sm:grid-cols-3">
              {metrics.map(({ label, value, icon: Icon }) => (
                <div
                  key={label}
                  className="flex min-h-16 items-center gap-3 rounded-lg border border-border/80 bg-background px-3 py-2"
                >
                  <span className="grid size-9 shrink-0 place-items-center rounded-md bg-muted text-muted-foreground">
                    <Icon className="size-4" aria-hidden />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[11px] font-medium uppercase text-muted-foreground">
                      {label}
                    </span>
                    <span className="block truncate text-sm font-semibold text-foreground">
                      {value}
                    </span>
                  </span>
                </div>
              ))}
            </div>
            <div
              className="relative h-52 overflow-hidden rounded-lg border border-border bg-muted/20"
              data-testid="shared-detection-preview"
              style={{
                backgroundColor: detections.designTokens.surface ?? undefined,
                color: detections.designTokens.foreground ?? undefined,
              }}
            >
              {detections.elements
                .filter((element) => element.included)
                .map((element) => (
                  <div
                    key={element.id}
                    className="absolute overflow-hidden rounded-sm border p-1 text-[10px]"
                    data-testid="shared-detection-element"
                    data-detection-id={element.id}
                    data-kind={element.kind}
                    data-primitive={element.primitive}
                    style={{
                      left: `${(element.box.x / detections.source.width) * 100}%`,
                      top: `${(element.box.y / detections.source.height) * 100}%`,
                      width: `${(element.box.width / detections.source.width) * 100}%`,
                      height: `${(element.box.height / detections.source.height) * 100}%`,
                      minHeight: "1.5rem",
                      borderColor: detections.designTokens.border ?? undefined,
                      backgroundColor: /header|nav|action|button|field/i.test(
                        element.primitive,
                      )
                        ? detections.designTokens.accent
                        : detections.designTokens.muted,
                      color: /header|nav|action|button|field/i.test(element.primitive)
                        ? detections.designTokens.accentForeground
                        : detections.designTokens.foreground,
                    }}
                  >
                    <span className="block truncate font-medium">
                      {detectionPrimitiveLabel(element.primitive)}
                    </span>
                    <span className="block truncate opacity-75">
                      {detectionKindLabel(element.kind)}
                    </span>
                  </div>
                ))}
              <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-between bg-gradient-to-t from-background/85 to-transparent px-3 pb-2 pt-8 text-[11px] text-muted-foreground">
                <span>Detected layout</span>
                <span>{detectionReviewNeedLabel(detections.quality.ambiguity)}</span>
              </div>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function detectionSummaryCounts(
  detections: NonNullable<SharedSummaryCardProps["summary"]["detections"]>,
) {
  return {
    active: detections.elements.filter((element) => element.included).length,
    edited: detections.elements.filter((element) => element.userEdited).length,
  };
}
