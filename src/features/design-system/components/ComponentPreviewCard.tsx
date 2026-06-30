"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Box, FileCode2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  AtomicLevel,
  CatalogDomain,
  CatalogPropDoc,
  CatalogVariant,
} from "../data/catalog-types";
import { lawNames, type UiLawId } from "../data/uilaws";
import { ExportButton } from "@/features/export/components/ExportButton";
import { useObservability } from "@/components/providers/ObservabilityProvider";
import { useProviderMode } from "@/components/providers/ProviderModeProvider";
import { AnalyticsEvent, createAnalyticsClient } from "@/lib/analytics.client";
import { SnippetPreview } from "@/features/analysis/components/SnippetPreview";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  PREVIEW_MODE_OPTIONS,
  PREVIEW_VIEWPORTS,
  TIER_META,
  type PreviewMode,
} from "../lib/design-system-options";
import { CollectionPill, ComponentLevelPill } from "./DesignSystemMetaPills";

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
  chromeless?: boolean;
  previewMode?: PreviewMode;
  onPreviewModeChange?: (mode: PreviewMode) => void;
  deferPreview?: boolean;
  showSnippet?: boolean;
  denseHeader?: boolean;
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
  chromeless = false,
  previewMode = "desktop",
  onPreviewModeChange,
  deferPreview = false,
  showSnippet = true,
  denseHeader = false,
}: ComponentPreviewCardProps) {
  const pathname = usePathname();
  const observability = useObservability();
  const { mode } = useProviderMode();
  const principleLabels = principles ? lawNames(principles) : [];
  const filename = exportFilename ?? `${id}.tsx`;
  const [activeVariant, setActiveVariant] = useState(variants?.[0]?.id ?? "default");
  const [canRenderPreview, setCanRenderPreview] = useState(!deferPreview);
  const previewHostRef = useRef<HTMLDivElement | null>(null);
  const selected =
    variants?.find((variant) => variant.id === activeVariant) ?? null;
  const previewNode = selected?.preview ?? children;
  const activeSnippet = selected?.code ?? snippet;
  const hasVariants = Boolean(variants && variants.length > 1);
  const analytics = createAnalyticsClient({
    hooks: observability,
    providerMode: mode,
    route: pathname ?? "/",
  });
  const previewViewport = PREVIEW_VIEWPORTS[previewMode];
  const tierMeta = TIER_META[level];
  const TierIcon = tierMeta.Icon;
  const levelLabel = tierMeta.label;
  const domainLabel =
    domain === "uilaws"
      ? "UI Laws"
      : domain === "laws-of-ux"
        ? "Laws of UX"
        : "Product";
  useEffect(() => {
    if (!deferPreview || canRenderPreview) return;
    const host = previewHostRef.current;
    if (!host || typeof IntersectionObserver === "undefined") {
      setCanRenderPreview(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        setCanRenderPreview(true);
        observer.disconnect();
      },
      { rootMargin: "180px 0px" },
    );
    observer.observe(host);
    return () => observer.disconnect();
  }, [canRenderPreview, deferPreview]);

  return (
    <Card
      className={cn(
        "overflow-hidden",
        chromeless ? "border-0 bg-transparent shadow-none" : "shadow-sm",
        className,
      )}
    >
      <CardHeader className={cn("border-b", denseHeader ? "p-4" : undefined)}>
        <div className="grid gap-3">
          <div className="grid gap-3">
            <div className="flex min-w-0 gap-3">
              <span
                className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary"
                aria-hidden="true"
              >
                <Box className="size-4" />
              </span>
              <div className="min-w-0 space-y-1">
                <p className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                  Component
                </p>
                <CardTitle className="text-lg leading-tight sm:text-xl">
                  {title}
                </CardTitle>
                <CardDescription className="max-w-2xl text-sm leading-6">
                  {description}
                </CardDescription>
                <div
                  className="flex flex-wrap items-center gap-2 pt-1 text-[11px]"
                  aria-label={`Component level ${levelLabel}. Collection ${domainLabel}.`}
                >
                  <ComponentLevelPill label={levelLabel} Icon={TierIcon} compact />
                  <CollectionPill label={domainLabel} compact />
                </div>
              </div>
            </div>
          </div>

          {usage ? (
            <p className="border-l border-border/80 pl-3 text-xs leading-5 text-muted-foreground">
              <span className="font-semibold text-card-foreground">Usage </span>
              {usage}
            </p>
          ) : null}

          {principleLabels.length > 0 ? (
            <ul className="flex flex-wrap gap-1.5" aria-label="UI laws">
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

        {props && props.length > 0 ? (
          <dl className="mt-3 grid gap-1 rounded-lg border border-border/70 bg-muted/20 p-2.5 text-xs">
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

      </CardHeader>

      <CardContent
        className={cn(
          "p-4 sm:p-6",
          chromeless ? "min-h-0 border-b-0 bg-transparent" : "min-h-[10rem] border-b bg-background/50",
        )}
      >
        <div
          ref={previewHostRef}
          className={cn(
            "overflow-hidden rounded-xl border shadow-inner",
            chromeless
              ? "border-border/60 bg-background/40"
              : "border-border/70 bg-card/40",
          )}
          aria-label="Component preview"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/80 bg-muted/65 px-3 py-2 sm:px-4">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Preview
              </span>
              <span
                data-testid="component-preview-mode-label"
                className="hidden min-w-0 rounded-full border border-border/70 bg-background/70 px-2 py-1 text-[0.65rem] font-medium text-muted-foreground sm:inline-flex"
              >
                {previewViewport.label}
              </span>
              {hasVariants ? (
                <div
                  className="flex min-w-0 flex-wrap items-center gap-1 rounded-full border border-border/70 bg-background/80 p-0.5"
                  aria-label="Component variant"
                >
                  {variants?.map((variant) => (
                    <Button
                      key={variant.id}
                      type="button"
                      size="sm"
                      variant={activeVariant === variant.id ? "default" : "ghost"}
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
                      className="h-8 rounded-full px-3 text-[0.7rem]"
                    >
                      {variant.label}
                    </Button>
                  ))}
                </div>
              ) : null}
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {onPreviewModeChange ? (
                <Tabs
                  value={previewMode}
                  onValueChange={(value) =>
                    onPreviewModeChange(value as PreviewMode)
                  }
                >
                  <TabsList
                    aria-label="Preview device mode"
                    className="h-9 rounded-full border border-border/70 bg-background/90 p-0.5 shadow-sm"
                  >
                    {PREVIEW_MODE_OPTIONS.map(({ value, label, Icon }) => (
                      <TabsTrigger
                        key={value}
                        value={value}
                        className="h-8 w-8 rounded-full p-0 hover:bg-muted/80 data-active:bg-muted data-active:text-foreground"
                        aria-label={label}
                        title={label}
                      >
                        <Icon className="size-4" aria-hidden="true" />
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>
              ) : null}
            </div>
          </div>
          <div className="min-w-0 p-3 sm:p-4">
            <div
              data-testid="component-preview-canvas"
              className="themed-scrollbar overflow-x-auto rounded-lg bg-background/45 p-2 shadow-inner"
            >
              <div
                data-testid="component-preview-viewport"
                data-preview-mode={previewMode}
                className={cn(
                  "mx-auto w-full rounded-lg border border-dashed border-border/70 bg-background shadow-sm transition-[max-width] duration-200 ease-out",
                  previewViewport.className,
                )}
                style={{ containerType: "inline-size" }}
                aria-label={`${previewViewport.label} viewport`}
              >
                <div
                  className={cn(
                    "flex items-start justify-start overflow-hidden",
                    previewViewport.stageClassName,
                  )}
                >
                  {canRenderPreview ? (
                    previewNode
                  ) : (
                    <div
                      className="h-40 w-full animate-pulse rounded-lg border border-dashed border-border/70 bg-muted/40"
                      aria-hidden="true"
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>

      {showSnippet ? (
        <SnippetPreview
          code={activeSnippet}
          title={`${title} snippet`}
          showCopy={false}
          headerActions={
            <div className="flex flex-wrap items-center gap-1.5">
              <ExportButton
                text={activeSnippet}
                variant="copy"
                label="Copy"
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
          }
          footer={
            sourcePath ? (
              <p className="flex w-full min-w-0 items-center gap-2 font-mono text-[0.7rem] text-muted-foreground">
                <FileCode2 className="size-3.5 shrink-0 text-primary" aria-hidden="true" />
                <span className="shrink-0 font-sans text-[0.65rem] font-semibold uppercase tracking-wider">
                  Source
                </span>
                <span className="text-muted-foreground/50" aria-hidden="true">
                  /
                </span>
                <span className="min-w-0 flex-1 truncate">src/{sourcePath}</span>
              </p>
            ) : null
          }
        />
      ) : null}
    </Card>
  );
}
