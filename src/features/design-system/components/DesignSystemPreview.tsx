"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ComponentPreviewCard } from "./ComponentPreviewCard";
import { ObservabilityErrorBoundary } from "@/components/providers/ObservabilityErrorBoundary";
import { useToast } from "@/components/providers/Toast";
import { Search } from "lucide-react";
import {
  unifiedCatalog,
  filterCatalog,
  type AtomicLevel,
  type CatalogDomain,
} from "@/features/design-system/data/catalog";
import { downloadCatalogBundle } from "@/features/design-system/lib/export-bundle";
import { LAWS_OF_UX_SITE } from "@/features/design-system/data/lawsOfUx";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useObservability } from "@/components/providers/ObservabilityProvider";
import { useProviderMode } from "@/lib/provider-mode";
import { AnalyticsEvent, createAnalyticsClient } from "@/lib/analytics";
import { interpolate, localizedHref, useLocale } from "@/lib/i18n";
import {
  createDesignSystemSearchParams,
  DOMAIN_VALUES,
  LEVEL_VALUES,
  nextFromList,
  parseDomain,
  parseLevel,
  parsePreviewMode,
  pickSelectedId,
} from "@/features/design-system/lib/design-system-state.mjs";
import type { AtomicCatalogEntry } from "@/features/design-system/data/catalog-types";

const LEVELS: AtomicLevel[] = ["atom", "molecule", "organism"];

const DOMAIN_SHORTCUTS = ["all", "product", "uilaws", "laws-of-ux"] as const;

/** Desktop workspace below sticky site + page headers; list/preview scroll inside. */
const DESKTOP_CATALOG_GRID_CLASS =
  "lg:h-[calc(100dvh-13.5rem)] lg:max-h-[calc(100dvh-13.5rem)] lg:min-h-0 lg:overflow-clip lg:[contain:layout_size_style] lg:items-stretch";
const DESKTOP_CATALOG_COLUMN_CLASS =
  "lg:h-full lg:max-h-full lg:min-h-0 lg:overflow-clip";

export function DesignSystemPreview() {
  const router = useRouter();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const { locale, dict } = useLocale();
  const t = dict.designSystem;
  const observability = useObservability();
  const { mode } = useProviderMode();

  const domains = useMemo(
    (): { id: CatalogDomain | "all"; label: string }[] => [
      { id: "all", label: t.domainAll },
      { id: "product", label: t.domainProduct },
      { id: "uilaws", label: t.domainUiLaws },
      { id: "laws-of-ux", label: t.domainLawsOfUx },
    ],
    [t],
  );
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [levelFilter, setLevelFilter] = useState<AtomicLevel | "all">(
    parseLevel(searchParams.get("level")) as AtomicLevel | "all",
  );
  const [domainFilter, setDomainFilter] = useState<CatalogDomain | "all">(
    parseDomain(searchParams.get("domain")) as CatalogDomain | "all",
  );
  const [previewMode, setPreviewMode] = useState<"desktop" | "tablet" | "mobile">(
    parsePreviewMode(searchParams.get("preview")) as "desktop" | "tablet" | "mobile",
  );
  const [selectedId, setSelectedId] = useState<string | null>(
    searchParams.get("selected"),
  );
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const previewAnchorRef = useRef<HTMLDivElement | null>(null);
  const hasMountedSelectionRef = useRef(false);
  const analytics = useMemo(
    () =>
      createAnalyticsClient({
        hooks: observability,
        providerMode: mode,
        route: "/design-system",
      }),
    [mode, observability],
  );

  const filtered = useMemo(
    () => filterCatalog(query, levelFilter, domainFilter),
    [query, levelFilter, domainFilter],
  );

  const grouped = useMemo<Record<string, AtomicCatalogEntry[]>>(() => {
    return LEVELS.reduce<Record<string, AtomicCatalogEntry[]>>((acc, level) => {
      acc[level] = filtered.filter((entry) => entry.level === level);
      return acc;
    }, {});
  }, [filtered]);

  const selectedEntry = useMemo(() => {
    if (filtered.length === 0) return null;
    const ensured = pickSelectedId(selectedId, filtered.map((entry) => entry.id));
    return filtered.find((entry) => entry.id === ensured) ?? filtered[0];
  }, [filtered, selectedId]);

  const effectiveSelectedId = selectedEntry?.id ?? null;

  useEffect(() => {
    if (!effectiveSelectedId) return;
    if (!hasMountedSelectionRef.current) {
      hasMountedSelectionRef.current = true;
      return;
    }
    if (typeof window === "undefined") return;
    if (!window.matchMedia("(max-width: 1023px)").matches) return;
    previewAnchorRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, [effectiveSelectedId]);

  useEffect(() => {
    const nextParams = createDesignSystemSearchParams({
      domain: domainFilter,
      level: levelFilter,
      query: query.trim(),
      selected: selectedEntry?.id ?? null,
      previewMode,
      lang: locale,
    });
    const current = searchParams.toString();
    const next = nextParams.toString();
    if (current === next) return;
    const href = next ? `/design-system?${next}` : localizedHref("/design-system", locale);
    router.replace(href, { scroll: false });
  }, [
    domainFilter,
    levelFilter,
    locale,
    previewMode,
    query,
    router,
    searchParams,
    selectedEntry?.id,
  ]);

  useEffect(() => {
    analytics.track(AnalyticsEvent.DesignSystemViewed, {
      source: "design_system_page",
      domain: domainFilter,
      level: levelFilter,
      totalVisible: filtered.length,
      status: "view",
    });
  }, [analytics, domainFilter, filtered.length, levelFilter]);

  const setDomain = useCallback((domain: CatalogDomain | "all") => {
    analytics.track(AnalyticsEvent.DesignSystemDomainChanged, {
      source: "design_system_tabs",
      domain,
      level: levelFilter,
      totalVisible: filtered.length,
      status: "changed",
    });
    setDomainFilter(domain);
  }, [analytics, filtered.length, levelFilter]);

  const moveSelection = useCallback((direction: 1 | -1) => {
    if (!filtered.length) return;
    const currentIndex = Math.max(
      0,
      filtered.findIndex((entry) => entry.id === effectiveSelectedId),
    );
    const nextIndex = (currentIndex + direction + filtered.length) % filtered.length;
    setSelectedId(filtered[nextIndex]?.id ?? filtered[0]?.id ?? null);
  }, [effectiveSelectedId, filtered]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
        const target = event.target as HTMLElement | null;
        const isTyping =
          target?.tagName === "INPUT" ||
          target?.tagName === "TEXTAREA" ||
          target?.getAttribute("contenteditable") === "true";
        if (event.key === "/" && !isTyping) {
          event.preventDefault();
          searchInputRef.current?.focus();
          return;
        }
        if (isTyping) return;

        const isInInteractive =
          !!target?.closest(
            'button,a,input,textarea,select,[role="button"],[role="tab"],[role="menuitem"],[role="option"]',
          );
        if (isInInteractive) return;

        if (event.altKey && !event.shiftKey && /^[1-4]$/.test(event.key)) {
          const nextDomain = DOMAIN_SHORTCUTS[Number(event.key) - 1];
          setDomain(nextDomain);
          return;
        }
        if (event.altKey && event.shiftKey && /^[0-3]$/.test(event.key)) {
          const nextLevel =
            event.key === "0"
              ? "all"
              : event.key === "1"
                ? "atom"
                : event.key === "2"
                  ? "molecule"
                  : "organism";
          setLevelFilter(nextLevel);
          return;
        }
        if (event.key === "j") {
          moveSelection(1);
          return;
        }
        if (event.key === "k") {
          moveSelection(-1);
          return;
        }
        if (event.key === "]") {
          const nextDomain = nextFromList(
            DOMAIN_VALUES,
            domainFilter,
            1,
          ) as CatalogDomain | "all";
          setDomain(nextDomain);
          return;
        }
        if (event.key === "[") {
          const nextDomain = nextFromList(
            DOMAIN_VALUES,
            domainFilter,
            -1,
          ) as CatalogDomain | "all";
          setDomain(nextDomain);
          return;
        }
        if (event.key === "=") {
          const nextLevel = nextFromList(
            LEVEL_VALUES,
            levelFilter,
            1,
          ) as AtomicLevel | "all";
          setLevelFilter(nextLevel);
          return;
        }
        if (event.key === "-") {
          const nextLevel = nextFromList(
            LEVEL_VALUES,
            levelFilter,
            -1,
          ) as AtomicLevel | "all";
          setLevelFilter(nextLevel);
        }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [domainFilter, levelFilter, moveSelection, setDomain]);

  return (
    <div lang={locale}>
      <header className="rounded-2xl border border-border/70 bg-background/95 p-4">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
          <div className="flex items-center gap-2 rounded-xl border border-border/70 bg-muted/30 px-3 py-2">
            <Search className="size-4 text-muted-foreground" />
            <Label htmlFor="catalog-search" className="sr-only">
              {t.searchLabel}
            </Label>
            <Input
              ref={searchInputRef}
              id="catalog-search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onBlur={(event) => {
                analytics.track(AnalyticsEvent.DesignSystemSearchUpdated, {
                  source: "design_system_search",
                  queryLength: event.target.value.length,
                  status: "updated",
                  totalVisible: filtered.length,
                });
              }}
              placeholder={t.searchPlaceholder}
              className="h-9 border-0 bg-transparent px-0 focus-visible:ring-0"
            />
            <kbd className="rounded border border-border/70 px-1.5 py-0.5 text-[10px] text-muted-foreground">
              /
            </kbd>
          </div>
        </div>

        <div className="mt-3 grid gap-2 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
          <div className="rounded-xl border border-border/70 bg-muted/20 p-2">
            <p className="px-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              {t.domain}
            </p>
            <Tabs
              value={domainFilter}
              onValueChange={(value) => setDomain(value as CatalogDomain | "all")}
            >
              <TabsList className="mt-1 h-auto w-full flex-wrap justify-start gap-1.5 rounded-lg bg-background/70 p-1.5">
                {domains.map(({ id, label }) => (
                  <TabsTrigger
                    key={id}
                    value={id}
                    className="min-h-10 rounded-md px-3 text-xs font-medium sm:text-sm"
                  >
                    {label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>

          <div className="rounded-xl border border-border/70 bg-muted/20 p-2">
            <p className="px-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              {t.tier}
            </p>
            <div className="mt-1 flex flex-wrap gap-2 rounded-lg bg-background/70 p-1.5">
              {(["all", ...LEVELS] as const).map((level) => (
                <Button
                  key={level}
                  type="button"
                  size="sm"
                  variant={levelFilter === level ? "default" : "outline"}
                  onClick={() => {
                    setLevelFilter(level);
                    analytics.track(AnalyticsEvent.DesignSystemLevelChanged, {
                      source: "design_system_level_filter",
                      domain: domainFilter,
                      level,
                      totalVisible: filtered.length,
                      status: "changed",
                    });
                  }}
                  className="min-h-10 rounded-md px-3 text-xs font-medium capitalize sm:text-sm"
                >
                  {level === "all" ? t.tierAll : level}
                </Button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
          <span className="hidden min-w-0 flex-1 basis-full sm:inline sm:basis-auto">
            {t.keyboardHelp}
          </span>
          <span>{interpolate(t.visibleCount, { count: String(filtered.length) })}</span>
          <span>
            {t.refs}{" "}
            <a
              href={LAWS_OF_UX_SITE}
              target="_blank"
              rel="noopener noreferrer"
              className="cursor-pointer text-foreground/80 underline-offset-4 transition-colors hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              lawsofux.com
            </a>
          </span>
        </div>
      </header>

      <div
        className={cn(
          "grid min-h-0 items-start gap-4 lg:grid-cols-[23rem_minmax(0,1fr)] xl:grid-cols-[25rem_minmax(0,1fr)]",
          DESKTOP_CATALOG_GRID_CLASS,
        )}
      >
        <section
          className={cn(
            "flex min-h-0 flex-col overflow-clip rounded-2xl border border-border/70 bg-card/30 p-3",
            "max-lg:max-h-[min(28rem,calc(100dvh-14rem))]",
            DESKTOP_CATALOG_COLUMN_CLASS,
          )}
        >
          <div className="mb-3 flex shrink-0 items-center justify-between">
            <p className="text-sm font-semibold text-foreground">{t.componentList}</p>
            <p className="text-xs text-muted-foreground">{t.denseView}</p>
          </div>
          <div className="min-h-0 flex-1 space-y-1 overflow-y-auto pr-1 lg:pb-1">
            {filtered.map((entry) => (
              <button
                key={entry.id}
                type="button"
                className={cn(
                  "w-full min-h-11 cursor-pointer rounded-lg border px-3 py-2.5 text-left transition-colors",
                  "hover:border-foreground/40 hover:bg-muted/50",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  selectedEntry?.id === entry.id
                    ? "border-foreground/50 bg-muted/60"
                    : "border-transparent bg-background/40",
                )}
                onClick={() => setSelectedId(entry.id)}
              >
                <p className="text-sm font-medium text-foreground">{entry.name}</p>
                <p className="line-clamp-2 text-xs text-muted-foreground">{entry.description}</p>
                <div className="mt-1 flex items-center gap-1.5">
                  <Badge
                    variant="outline"
                    className="h-5 rounded-full bg-background/40 px-2 text-[10px] font-medium capitalize text-muted-foreground"
                  >
                    <span className="sr-only">{t.tierSrOnly}</span>
                    {entry.level}
                  </Badge>
                  <span aria-hidden="true" className="text-[10px] text-muted-foreground/70">
                    ·
                  </span>
                  <Badge
                    variant="outline"
                    className="h-5 rounded-full bg-background/40 px-2 text-[10px] font-medium text-muted-foreground"
                  >
                    <span className="sr-only">{t.domainSrOnly}</span>
                    {entry.domain}
                  </Badge>
                </div>
              </button>
            ))}
            {filtered.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center text-sm text-muted-foreground">
                  {t.noResults}
                </CardContent>
              </Card>
            ) : null}
          </div>
        </section>

        <section
          ref={previewAnchorRef}
          id="component-preview-panel"
          className={cn(
            "flex min-h-0 scroll-mt-[5.5rem] flex-col overflow-clip rounded-2xl border border-border/70 bg-background/30 sm:scroll-mt-24 lg:sticky lg:top-[8.75rem] lg:scroll-mt-0",
            DESKTOP_CATALOG_COLUMN_CLASS,
          )}
          aria-live="polite"
        >
          <div
            role="toolbar"
            aria-label={t.previewToolbarAria}
            className="flex shrink-0 flex-col gap-3 border-b border-border/70 bg-background/60 px-3 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/45 max-sm:sticky max-sm:top-16 max-sm:z-10 sm:flex-row sm:items-center sm:justify-between sm:px-4"
          >
            <Link
              href={localizedHref("/", locale)}
              className="order-2 inline-flex min-h-10 cursor-pointer items-center text-sm text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:order-1"
            >
              {t.backToDashboard}
            </Link>
            <div className="order-1 flex flex-wrap items-center gap-2 sm:order-2 sm:justify-end">
              <Button
                type="button"
                className="min-h-10"
                onClick={() => {
                  downloadCatalogBundle(filtered.length ? filtered : unifiedCatalog);
                  analytics.track(AnalyticsEvent.ExportTriggered, {
                    source: "design_system_page",
                    feature: "catalog_bundle",
                    trigger: "export",
                    status: "success",
                  });
                  toast(t.bundleDownloaded, "success");
                }}
              >
                {t.exportAll}
              </Button>
              <Link
                href={localizedHref("/", locale)}
                className={cn(buttonVariants({ variant: "outline" }), "min-h-10")}
              >
                {t.tryWorkflow}
              </Link>
            </div>
          </div>
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain p-3 pt-4">
            <div className="rounded-2xl border border-border/70 bg-muted/15 shadow-inner">
              {selectedEntry ? (
                <ObservabilityErrorBoundary
                  fallbackTitle={interpolate(t.renderError, { name: selectedEntry.name })}
                >
                  <ComponentPreviewCard
                    id={selectedEntry.id}
                    title={selectedEntry.name}
                    description={selectedEntry.description}
                    usage={selectedEntry.usage}
                    level={selectedEntry.level}
                    domain={selectedEntry.domain}
                    sourcePath={selectedEntry.sourcePath}
                    snippet={selectedEntry.code}
                    exportFilename={selectedEntry.exportFilename}
                    props={selectedEntry.props}
                    variants={selectedEntry.variants}
                    principles={selectedEntry.principles}
                    previewMode={previewMode}
                    onPreviewModeChange={setPreviewMode}
                    deferPreview
                    chromeless
                    showSnippet={selectedEntry.id !== "snippet-preview"}
                    className="rounded-2xl"
                  >
                    {selectedEntry.preview}
                  </ComponentPreviewCard>
                </ObservabilityErrorBoundary>
              ) : (
                <div className="p-8 text-sm text-muted-foreground">
                  {t.pickComponent}
                </div>
              )}
            </div>

            {levelFilter === "all" ? (
              <Card className="bg-muted/20 shadow-none">
                <CardContent className="grid gap-2 p-4 text-xs text-muted-foreground sm:grid-cols-3">
                  {LEVELS.map((level) => (
                    <div key={level} className="rounded-lg border border-border/60 bg-background/40 p-3">
                      <p className="text-[11px] uppercase tracking-wide">{level}</p>
                      <p className="mt-1 text-lg font-semibold text-foreground">
                        {grouped[level]?.length ?? 0}
                      </p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ) : null}
          </div>
        </section>
      </div>
    </div>
  );
}
