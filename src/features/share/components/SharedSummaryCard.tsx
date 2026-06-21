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
        {detections && detectionCounts ? (
          <div className="rounded-md border border-border bg-background/80 p-3 text-xs">
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">
                Detections: {detectionCounts.active}/{detections.elements.length}
              </Badge>
              <Badge variant="outline">
                Edited: {detectionCounts.edited}
              </Badge>
              <Badge variant="outline">
                Confidence:{" "}
                {typeof detections.quality.confidence === "number"
                  ? `${Math.round(detections.quality.confidence * 100)}%`
                  : "local"}
              </Badge>
              <Badge variant="outline">
                Ambiguity: {detections.quality.ambiguity}
              </Badge>
            </div>
            <div
              className="relative mt-3 h-56 overflow-hidden rounded-md border border-border"
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
                    <span className="block truncate font-medium">{element.primitive}</span>
                    <span className="block truncate opacity-75">{element.kind}</span>
                  </div>
                ))}
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
