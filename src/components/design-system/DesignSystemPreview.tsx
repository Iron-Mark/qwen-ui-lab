"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ComponentPreviewCard } from "./ComponentPreviewCard";
import { ErrorBoundary } from "@/components/providers/ErrorBoundary";
import { useToast } from "@/components/providers/Toast";
import { Search } from "lucide-react";
import {
  unifiedCatalog,
  filterCatalog,
  type AtomicLevel,
  type CatalogDomain,
} from "@/data/catalog";
import { downloadCatalogBundle } from "@/lib/export-bundle";
import { LAWS_OF_UX_SITE } from "@/data/lawsOfUx";
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
import {
  createDesignSystemSearchParams,
  DOMAIN_VALUES,
  LEVEL_VALUES,
  nextFromList,
  parseDomain,
  parseLevel,
  parsePreviewMode,
  pickSelectedId,
} from "@/lib/design-system-state.mjs";
import type { AtomicCatalogEntry } from "@/data/catalog-types";

const LEVELS: AtomicLevel[] = ["atom", "molecule", "organism"];

const DOMAINS: { id: CatalogDomain | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "product", label: "Product" },
  { id: "uilaws", label: "UILaws" },
  { id: "laws-of-ux", label: "Laws of UX" },
];

const DOMAIN_SHORTCUTS = ["all", "product", "uilaws", "laws-of-ux"] as const;

export function DesignSystemPreview() {
  const router = useRouter();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const observability = useObservability();
  const { mode } = useProviderMode();
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
    });
    const current = searchParams.toString();
    const next = nextParams.toString();
    if (current === next) return;
    const href = next ? `/design-system?${next}` : "/design-system";
    router.replace(href, { scroll: false });
  }, [domainFilter, levelFilter, previewMode, query, router, searchParams, selectedEntry?.id]);

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
    <div className="mx-auto max-w-[96rem] space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <header className="sticky top-3 z-20 rounded-2xl border border-border/70 bg-background/95 p-4 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="grid gap-3 lg:grid-cols-[1.1fr_1fr_auto] lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Design system
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Atomic component lab
            </h1>
            <p className="growth-snippet mt-1 text-sm text-muted-foreground">
              Filter fast, inspect one component deeply, and copy implementation snippets.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-border/70 bg-muted/30 px-3 py-2">
            <Search className="size-4 text-muted-foreground" />
            <Label htmlFor="catalog-search" className="sr-only">
              Search catalog
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
              placeholder="Search components…"
              className="h-9 border-0 bg-transparent px-0 focus-visible:ring-0"
            />
            <kbd className="rounded border border-border/70 px-1.5 py-0.5 text-[10px] text-muted-foreground">
              /
            </kbd>
          </div>
          <div />
        </div>

        <div className="mt-3 grid gap-2 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
          <div className="rounded-xl border border-border/70 bg-muted/20 p-2">
            <p className="px-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Domain
            </p>
            <Tabs
              value={domainFilter}
              onValueChange={(value) => setDomain(value as CatalogDomain | "all")}
            >
              <TabsList className="mt-1 h-auto w-full flex-wrap justify-start gap-1 rounded-lg bg-background/70 p-1">
                {DOMAINS.map(({ id, label }) => (
                  <TabsTrigger
                    key={id}
                    value={id}
                    className="rounded-md px-2.5 text-[11px] font-medium sm:text-xs"
                  >
                    {label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>

          <div className="rounded-xl border border-border/70 bg-muted/20 p-2">
            <p className="px-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Tier
            </p>
            <div className="mt-1 flex flex-wrap gap-1.5 rounded-lg bg-background/70 p-1">
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
                  className="h-8 rounded-md px-2.5 text-[11px] font-medium capitalize sm:text-xs"
                >
                  {level}
                </Button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
          <span>
            Press <kbd className="rounded border border-border/70 px-1 py-0.5 font-mono text-[10px]">/</kbd> to
            search, <kbd className="rounded border border-border/70 px-1 py-0.5 font-mono text-[10px]">j</kbd> and{" "}
            <kbd className="rounded border border-border/70 px-1 py-0.5 font-mono text-[10px]">k</kbd> to move through
            the list. Alt+1–4 changes domain; Alt+Shift+0–3 changes tier.
          </span>
          <span>{filtered.length} visible</span>
          <span>
            Refs:{" "}
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

      <div className="grid items-start gap-4 lg:grid-cols-[23rem_minmax(0,1fr)] xl:grid-cols-[25rem_minmax(0,1fr)]">
        <section className="min-h-[30rem] rounded-2xl border border-border/70 bg-card/30 p-3 lg:max-h-[calc(100vh-8.5rem)] lg:overflow-hidden">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-semibold text-foreground">Component list</p>
            <p className="text-xs text-muted-foreground">Dense view</p>
          </div>
          <div className="max-h-[calc(100vh-18rem)] space-y-1 overflow-auto pr-1 lg:max-h-none lg:pb-1">
            {filtered.map((entry) => (
              <button
                key={entry.id}
                type="button"
                className={cn(
                  "w-full cursor-pointer rounded-lg border px-3 py-2 text-left transition-colors",
                  "hover:border-foreground/40 hover:bg-muted/50",
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
                    <span className="sr-only">Tier</span>
                    {entry.level}
                  </Badge>
                  <span aria-hidden="true" className="text-[10px] text-muted-foreground/70">
                    ·
                  </span>
                  <Badge
                    variant="outline"
                    className="h-5 rounded-full bg-background/40 px-2 text-[10px] font-medium text-muted-foreground"
                  >
                    <span className="sr-only">Domain</span>
                    {entry.domain}
                  </Badge>
                </div>
              </button>
            ))}
            {filtered.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center text-sm text-muted-foreground">
                  No components match your search.
                </CardContent>
              </Card>
            ) : null}
          </div>
        </section>

        <section
          ref={previewAnchorRef}
          id="component-preview-panel"
          className="flex flex-col rounded-2xl border border-border/70 bg-background/30 lg:sticky lg:top-[6.5rem] lg:max-h-[calc(100vh-8.5rem)] lg:overflow-auto"
          aria-live="polite"
        >
          <div
            role="toolbar"
            aria-label="Preview panel actions"
            className="flex flex-col gap-3 border-b border-border/70 bg-background/60 px-3 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/45 sm:flex-row sm:items-center sm:justify-between sm:px-4"
          >
            <Link
              href="/"
              className="order-2 inline-flex min-h-9 cursor-pointer items-center text-sm text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:order-1"
            >
              ← Back to dashboard demo
            </Link>
            <div className="order-1 flex flex-wrap items-center gap-2 sm:order-2 sm:justify-end">
              <Button
                type="button"
                onClick={() => {
                  downloadCatalogBundle(filtered.length ? filtered : unifiedCatalog);
                  analytics.track(AnalyticsEvent.ExportTriggered, {
                    source: "design_system_page",
                    feature: "catalog_bundle",
                    trigger: "export",
                    status: "success",
                  });
                  toast("Design system bundle downloaded", "success");
                }}
              >
                Export all snippets
              </Button>
              <Link
                href="/"
                className={cn(buttonVariants({ variant: "outline" }), "min-h-9")}
              >
                Try screenshot-to-scaffold workflow →
              </Link>
            </div>
          </div>
          <div className="space-y-4 p-3 pt-4">
            <div className="rounded-2xl border border-border/70 bg-muted/15 shadow-inner">
              {selectedEntry ? (
                <ErrorBoundary fallbackTitle={`Could not render ${selectedEntry.name}.`}>
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
                    className="rounded-2xl"
                  >
                    {selectedEntry.preview}
                  </ComponentPreviewCard>
                </ErrorBoundary>
              ) : (
                <div className="p-8 text-sm text-muted-foreground">
                  Pick a component from the list to inspect preview, props, and snippet.
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
