"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { CopyPlus } from "lucide-react";
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
import { useToast } from "@/components/providers/Toast";
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
  LEVEL_BADGE_VARIANT,
  PREVIEW_MODE_OPTIONS,
  PREVIEW_VIEWPORTS,
  type PreviewMode,
} from "../lib/design-system-options";

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
  const { toast } = useToast();
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
  const analytics = createAnalyticsClient({
    hooks: observability,
    providerMode: mode,
    route: pathname ?? "/",
  });
  const importPath = sourcePath
    ? sourcePath.replace(/\.tsx$/, "")
    : "path/to/component";
  const importLine = `import { Component } from "@/components/${importPath}";`;
  const previewViewport = PREVIEW_VIEWPORTS[previewMode];
  const copyImportAndSnippet = async () => {
    try {
      await navigator.clipboard.writeText(`${importLine}\n\n${activeSnippet}`);
      toast("Import and snippet copied", "success");
    } catch {
      toast("Copy failed. Try again.", "error");
    }
  };

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
            <div className="mt-2">
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={copyImportAndSnippet}
                aria-label="Copy import line and snippet"
                className="min-h-10 px-3 text-[0.7rem] text-muted-foreground hover:bg-muted/80 hover:text-card-foreground"
              >
                <CopyPlus className="mr-1 size-3.5" aria-hidden="true" />
                Copy import + snippet
              </Button>
            </div>
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
            <Badge variant={LEVEL_BADGE_VARIANT[level]} className="capitalize">
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
            <div className="flex min-w-0 items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Preview
              </span>
              <span
                data-testid="component-preview-mode-label"
                className="hidden min-w-0 rounded-full border border-border/70 bg-background/70 px-2 py-1 text-[0.65rem] font-medium text-muted-foreground sm:inline-flex"
              >
                {previewViewport.label}
              </span>
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
          </div>
          <div className="min-w-0 p-3 sm:p-4">
            <div
              data-testid="component-preview-canvas"
              className="overflow-x-auto rounded-lg bg-background/45 p-2 shadow-inner"
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
        />
      ) : null}
    </Card>
  );
}
