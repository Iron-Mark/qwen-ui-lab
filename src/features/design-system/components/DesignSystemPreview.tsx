"use client";

import {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ComponentPreviewCard } from "./ComponentPreviewCard";
import { ObservabilityErrorBoundary } from "@/components/providers/ObservabilityErrorBoundary";
import { Search, Tag } from "lucide-react";
import {
  filterCatalog,
  type AtomicLevel,
  type CatalogDomain,
} from "./catalog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { useObservability } from "@/components/providers/ObservabilityProvider";
import { useProviderMode } from "@/components/providers/ProviderModeProvider";
import { AnalyticsEvent, createAnalyticsClient } from "@/lib/analytics.client";
import { interpolate, localizedHref } from "@/lib/i18n";
import { useLocale } from "@/lib/i18n/use-locale.client";
import {
  createDesignSystemSearchParams,
  DOMAIN_VALUES,
  nextFromList,
  parseDomain,
  parseLevel,
  parsePreviewMode,
  pickSelectedId,
} from "../lib/design-system-state.mjs";
import {
  ATOMIC_LEVELS,
  TIER_META,
  TIER_OPTIONS,
  type PreviewMode,
} from "../lib/design-system-options";
import {
  EXTERNAL_REF_LINK_CLASS,
  getCatalogReferences,
} from "../lib/design-system-references";

/** Desktop keeps the catalog picker fixed-height while preview content scrolls with the page. */
const DESKTOP_CATALOG_GRID_CLASS =
  "lg:min-h-0 lg:items-start";
const DESKTOP_CATALOG_LIST_CLASS =
  "lg:sticky lg:top-[5.5rem] lg:h-[calc(100dvh-7rem)] lg:max-h-[calc(100dvh-7rem)] lg:min-h-0 lg:overflow-hidden lg:[contain:layout_paint_size_style]";

function levelHasMatches(
  query: string,
  domain: CatalogDomain | "all",
  level: AtomicLevel,
) {
  return filterCatalog(query, "all", domain).some(
    (entry) => entry.level === level,
  );
}

export function DesignSystemPreview() {
  const router = useRouter();
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
  const domainLabelById = useMemo(
    () => new Map(domains.map(({ id, label }) => [id, label])),
    [domains],
  );
  const initialQuery = searchParams.get("q") ?? "";
  const initialDomain = parseDomain(searchParams.get("domain")) as
    | CatalogDomain
    | "all";
  const initialLevel = parseLevel(searchParams.get("level")) as
    | AtomicLevel
    | "all";

  const [query, setQuery] = useState(initialQuery);
  const [levelFilter, setLevelFilter] = useState<AtomicLevel | "all">(
    initialLevel !== "all" && levelHasMatches(initialQuery, initialDomain, initialLevel)
      ? initialLevel
      : "all",
  );
  const [domainFilter, setDomainFilter] = useState<CatalogDomain | "all">(
    initialDomain,
  );
  const [previewMode, setPreviewMode] = useState<PreviewMode>(
    parsePreviewMode(searchParams.get("preview")) as PreviewMode,
  );
  const [selectedId, setSelectedId] = useState<string | null>(
    searchParams.get("selected"),
  );
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const previewAnchorRef = useRef<HTMLDivElement | null>(null);
  const hasMountedSelectionRef = useRef(false);
  const catalogReferences = useMemo(
    () => getCatalogReferences(domainFilter, t.refProductCatalog),
    [domainFilter, t.refProductCatalog],
  );
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

  const tierAvailability = useMemo<Record<AtomicLevel, number>>(() => {
    const domainAndQueryMatches = filterCatalog(query, "all", domainFilter);
    return ATOMIC_LEVELS.reduce<Record<AtomicLevel, number>>(
      (acc, level) => {
        acc[level] = domainAndQueryMatches.filter(
          (entry) => entry.level === level,
        ).length;
        return acc;
      },
      { atom: 0, molecule: 0, organism: 0 },
    );
  }, [domainFilter, query]);

  const enabledLevelValues = useMemo<Array<AtomicLevel | "all">>(
    () => [
      "all",
      ...ATOMIC_LEVELS.filter((level) => tierAvailability[level] > 0),
    ],
    [tierAvailability],
  );

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
    if (searchParams.get("account") === "1") {
      nextParams.set("account", "1");
    }
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
    const nextLevel =
      levelFilter !== "all" && !levelHasMatches(query, domain, levelFilter)
        ? "all"
        : levelFilter;
    analytics.track(AnalyticsEvent.DesignSystemDomainChanged, {
      source: "design_system_tabs",
      domain,
      level: nextLevel,
      totalVisible: filtered.length,
      status: "changed",
    });
    setDomainFilter(domain);
    if (nextLevel !== levelFilter) {
      setLevelFilter(nextLevel);
    }
  }, [analytics, filtered.length, levelFilter, query]);

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
          const nextDomain = DOMAIN_VALUES[Number(event.key) - 1] as
            | CatalogDomain
            | "all"
            | undefined;
          if (!nextDomain) return;
          setDomain(nextDomain);
          return;
        }
        if (event.altKey && event.shiftKey && /^[1-3]$/.test(event.key)) {
          const nextLevel = ATOMIC_LEVELS[Number(event.key) - 1];
          if (!nextLevel || tierAvailability[nextLevel] === 0) return;
          setLevelFilter(levelFilter === nextLevel ? "all" : nextLevel);
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
            enabledLevelValues,
            levelFilter,
            1,
          ) as AtomicLevel | "all";
          setLevelFilter(nextLevel);
          return;
        }
        if (event.key === "-") {
          const nextLevel = nextFromList(
            enabledLevelValues,
            levelFilter,
            -1,
          ) as AtomicLevel | "all";
          setLevelFilter(nextLevel);
        }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    domainFilter,
    enabledLevelValues,
    levelFilter,
    moveSelection,
    setDomain,
    tierAvailability,
  ]);

  return (
    <div lang={locale} className="space-y-4">
      <header
        data-testid="design-system-filter-controls"
        className="space-y-4 px-1 sm:px-2"
      >
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
          <div
            data-testid="catalog-search-shell"
            className="relative flex min-h-11 min-w-0 max-w-full items-center overflow-hidden rounded-xl border border-border/70 bg-background/70 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
          >
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            />
            <Label htmlFor="catalog-search" className="sr-only">
              {t.searchLabel}
            </Label>
            <Input
              ref={searchInputRef}
              id="catalog-search"
              type="search"
              value={query}
              onChange={(event) => {
                const nextQuery = event.target.value;
                setQuery(nextQuery);
                if (
                  levelFilter !== "all" &&
                  !levelHasMatches(nextQuery, domainFilter, levelFilter)
                ) {
                  setLevelFilter("all");
                }
              }}
              onBlur={(event) => {
                analytics.track(AnalyticsEvent.DesignSystemSearchUpdated, {
                  source: "design_system_search",
                  queryLength: event.target.value.length,
                  status: "updated",
                  totalVisible: filtered.length,
                });
              }}
              placeholder={t.searchPlaceholder}
              className="h-11 min-w-0 flex-1 border-0 bg-transparent pl-11 pr-12 shadow-none focus-visible:ring-0"
            />
            <kbd className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 rounded border border-border/70 px-1.5 py-0.5 text-[10px] text-muted-foreground sm:inline-flex">
              /
            </kbd>
          </div>
        </div>

        <div className="grid gap-2 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              {t.domain}
            </p>
            <Tabs
              value={domainFilter}
              onValueChange={(value) => setDomain(value as CatalogDomain | "all")}
            >
              <TabsList className="mt-1 grid w-full grid-cols-2 gap-1.5 rounded-xl border border-border/70 bg-muted/35 p-1.5 shadow-[inset_0_1px_3px_color-mix(in_oklch,var(--foreground)_14%,transparent),inset_0_-1px_0_color-mix(in_oklch,var(--background)_70%,transparent)] group-data-horizontal/tabs:h-auto min-[560px]:grid-cols-4">
                {domains.map(({ id, label }) => (
                  <TabsTrigger
                    key={id}
                    value={id}
                    className="h-10 min-h-10 min-w-0 flex-none overflow-hidden text-ellipsis rounded-lg border border-transparent bg-transparent px-2 text-xs font-medium shadow-none transition-[background-color,border-color,box-shadow,color] data-active:border-border/80 data-active:bg-background data-active:text-foreground data-active:shadow-[0_1px_2px_color-mix(in_oklch,var(--foreground)_16%,transparent),inset_0_1px_0_color-mix(in_oklch,var(--background)_85%,transparent)] dark:data-active:border-white/10 dark:data-active:bg-background/85 sm:text-sm"
                  >
                    {label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>

          <div className="min-w-0 md:min-w-80">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              {t.tier}
            </p>
            <div
              data-testid="tier-filter-controls"
              className="mt-1 flex flex-wrap gap-2 rounded-lg bg-background/70 p-1.5"
            >
              {TIER_OPTIONS.map(({ level, label, Icon }) => {
                const isAvailable = tierAvailability[level] > 0;
                const isActive = isAvailable && levelFilter === level;
                const nextLevel = isActive ? "all" : level;
                return (
                  <Button
                    key={level}
                    type="button"
                    size="sm"
                    variant={isActive ? "default" : "outline"}
                    disabled={!isAvailable}
                    aria-pressed={isActive}
                    title={
                      !isAvailable
                        ? `No ${label} components for this filter`
                        : isActive
                          ? `Clear ${label} filter`
                          : `Show ${label} components`
                    }
                    onClick={() => {
                      if (!isAvailable) return;
                      setLevelFilter(nextLevel);
                      analytics.track(AnalyticsEvent.DesignSystemLevelChanged, {
                        source: "design_system_level_filter",
                        domain: domainFilter,
                        level: nextLevel,
                        totalVisible: filtered.length,
                        status: "changed",
                      });
                    }}
                    className={cn(
                      "min-h-10 gap-1.5 rounded-md px-3 text-xs font-medium sm:text-sm",
                      !isAvailable &&
                        "border-border/40 bg-background/20 text-muted-foreground/45 opacity-60",
                    )}
                  >
                    <Icon className="size-3.5" aria-hidden="true" />
                    <span>{label}</span>
                  </Button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
          <span className="hidden min-w-0 flex-1 basis-full sm:inline sm:basis-auto">
            {t.keyboardHelp}
          </span>
          <span>{interpolate(t.visibleCount, { count: String(filtered.length) })}</span>
          <span data-testid="catalog-reference-row">
            {t.refs}{" "}
            {catalogReferences.map((reference, index) => (
              <Fragment key={reference.label}>
                {index > 0 ? (
                  <span aria-hidden="true" className="mx-1 text-muted-foreground/60">
                    ·
                  </span>
                ) : null}
                {reference.href ? (
                  <a
                    href={reference.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={EXTERNAL_REF_LINK_CLASS}
                  >
                    {reference.label}
                  </a>
                ) : (
                  <span className="text-foreground/70">{reference.label}</span>
                )}
              </Fragment>
            ))}
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
            "flex min-h-0 flex-col overflow-hidden rounded-2xl border border-border/70 bg-card/30 p-3",
            "max-lg:h-[min(28rem,calc(100dvh-14rem))] max-lg:max-h-[min(28rem,calc(100dvh-14rem))] max-lg:[contain:layout_paint_size_style]",
            DESKTOP_CATALOG_LIST_CLASS,
          )}
        >
          <div className="mb-3 flex shrink-0 items-center">
            <p className="text-sm font-semibold text-foreground">{t.componentList}</p>
          </div>
          <div className="min-h-0 flex-1 space-y-1 overflow-y-auto pr-1 lg:pb-1">
            {filtered.map((entry) => {
              const tierMeta = TIER_META[entry.level];
              const TierIcon = tierMeta.Icon;
              const domainLabel = domainLabelById.get(entry.domain) ?? entry.domain;

              return (
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
                  <dl
                    data-testid="component-list-metadata"
                    className="mt-2 flex flex-wrap items-center gap-2 text-[11px]"
                    aria-label={`${t.tierSrOnly} ${tierMeta.label}. ${t.domainSrOnly} ${domainLabel}.`}
                  >
                    <div className="inline-flex min-h-6 items-center gap-1.5 rounded-md border border-border/60 bg-background/55 px-2 text-foreground/85">
                      <TierIcon className="size-3.5 text-primary" aria-hidden="true" />
                      <dt className="font-medium text-muted-foreground">{t.tierSrOnly}</dt>
                      <dd className="font-semibold">{tierMeta.label}</dd>
                    </div>
                    <div className="inline-flex min-h-6 items-center gap-1.5 rounded-md border border-border/50 bg-background/35 px-2 text-muted-foreground">
                      <Tag className="size-3.5" aria-hidden="true" />
                      <dt className="font-medium">{t.domainSrOnly}</dt>
                      <dd className="font-semibold text-foreground/75">{domainLabel}</dd>
                    </div>
                  </dl>
                </button>
              );
            })}
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
            "min-h-0 min-w-0 scroll-mt-[5.5rem] sm:scroll-mt-24 lg:scroll-mt-24",
          )}
          aria-live="polite"
        >
          <div
            data-testid="component-preview-body"
            className="min-h-0"
          >
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
              <div className="rounded-xl border border-border/70 bg-card/30 p-8 text-sm text-muted-foreground">
                {t.pickComponent}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
