"use client";

import { useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type {
  AtomicLevel,
  CatalogDomain,
  CatalogPropDoc,
  CatalogVariant,
} from "@/data/catalog-types";
import { lawNames, type UiLawId } from "@/data/uilaws";
import { ExportButton } from "@/components/atoms/ExportButton";
import { useObservability } from "@/components/providers/ObservabilityProvider";
import { useProviderMode } from "@/lib/provider-mode";
import { AnalyticsEvent, createAnalyticsClient } from "@/lib/analytics";
import { SnippetPreview } from "@/components/molecules/SnippetPreview";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const LEVEL_VARIANT: Record<AtomicLevel, "default" | "secondary" | "outline"> = {
  atom: "default",
  molecule: "secondary",
  organism: "outline",
};

interface ComponentPreviewCardProps {
  id: string;
  title: string;
  description: string;
  usage?: string;
  level: AtomicLevel;
  domain?: CatalogDomain;
  sourcePath?: string;
  snippet: string;
  exportFilename?: string;
  props?: CatalogPropDoc[];
  variants?: CatalogVariant[];
  principles?: UiLawId[];
  children: ReactNode;
  className?: string;
}

export function ComponentPreviewCard({
  id,
  title,
  description,
  usage,
  level,
  domain = "product",
  sourcePath,
  snippet,
  exportFilename,
  props,
  variants,
  principles,
  children,
  className,
}: ComponentPreviewCardProps) {
  const pathname = usePathname();
  const observability = useObservability();
  const { mode } = useProviderMode();
  const principleLabels = principles ? lawNames(principles) : [];
  const filename = exportFilename ?? `${id}.tsx`;
  const [activeVariant, setActiveVariant] = useState(variants?.[0]?.id ?? "default");
  const selected =
    variants?.find((variant) => variant.id === activeVariant) ?? null;
  const previewNode = selected?.preview ?? children;
  const activeSnippet = selected?.code ?? snippet;
  const analytics = createAnalyticsClient({
    hooks: observability,
    providerMode: mode,
    route: pathname ?? "/",
  });

  return (
    <Card className={cn("overflow-hidden shadow-sm", className)}>
      <CardHeader className="border-b">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <CardTitle className="text-base">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
            {sourcePath ? (
              <p className="mt-1 font-mono text-[0.65rem] text-muted-foreground">
                src/{sourcePath}
              </p>
            ) : null}
            {usage ? (
              <p className="mt-2 text-xs leading-5 text-muted-foreground">
                <span className="font-semibold text-card-foreground">Usage: </span>
                {usage}
              </p>
            ) : null}
            {principleLabels.length > 0 ? (
              <ul className="mt-2 flex flex-wrap gap-1.5" aria-label="UI laws">
                {principleLabels.map((label) => (
                  <li key={label}>
                    <Badge variant="outline" className="text-[0.65rem]">
                      {label}
                    </Badge>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1">
            <Badge variant={LEVEL_VARIANT[level]} className="capitalize">
              {level}
            </Badge>
            <Badge variant="secondary" className="text-[0.65rem]">
              {domain}
            </Badge>
          </div>
        </div>

        {props && props.length > 0 ? (
          <dl className="mt-3 grid gap-1 text-xs">
            {props.map((prop) => (
              <div key={prop.name} className="grid grid-cols-[auto_1fr] gap-x-2">
                <dt className="font-mono font-medium text-card-foreground">{prop.name}</dt>
                <dd className="text-muted-foreground">
                  <span className="font-mono text-[0.7rem]">{prop.type}</span>
                  {" — "}
                  {prop.description}
                </dd>
              </div>
            ))}
          </dl>
        ) : null}

        {variants && variants.length > 1 ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {variants.map((variant) => (
              <Button
                key={variant.id}
                type="button"
                size="sm"
                variant={activeVariant === variant.id ? "default" : "outline"}
                onClick={() => {
                  setActiveVariant(variant.id);
                  analytics.track(AnalyticsEvent.DesignSystemVariantChanged, {
                    source: "component_preview_card",
                    entryId: id,
                    domain,
                    level,
                    status: "selected",
                  });
                }}
                className="rounded-full"
              >
                {variant.label}
              </Button>
            ))}
          </div>
        ) : null}
      </CardHeader>

      <CardContent className="relative min-h-[10rem] border-b bg-background/50 p-4 sm:p-6">
        <div className="absolute left-3 top-3 z-10 flex flex-wrap gap-2 sm:left-4 sm:top-4">
          <ExportButton
            text={activeSnippet}
            variant="copy"
            analyticsSource="component_preview_card"
            analyticsFeature="design_system_snippet"
          />
          <ExportButton
            text={activeSnippet}
            variant="export"
            filename={filename}
            analyticsSource="component_preview_card"
            analyticsFeature="design_system_snippet"
          />
        </div>
        <div className="pt-14 sm:pt-16">{previewNode}</div>
      </CardContent>

      <SnippetPreview code={activeSnippet} title={`${title} snippet`} showCopy />
    </Card>
  );
}
