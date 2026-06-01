"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AtomicSection } from "./AtomicSection";
import { ComponentPreviewCard } from "./ComponentPreviewCard";
import { ErrorBoundary } from "@/components/providers/ErrorBoundary";
import { useToast } from "@/components/providers/Toast";
import { Sparkles } from "lucide-react";
import {
  unifiedCatalog,
  filterCatalog,
  type AtomicLevel,
  type CatalogDomain,
} from "@/data/catalog";
import { downloadCatalogBundle } from "@/lib/export-bundle";
import { LAWS_OF_UX_SITE } from "@/data/lawsOfUx";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";

const LEVELS: AtomicLevel[] = ["atom", "molecule", "organism"];

const DOMAINS: { id: CatalogDomain | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "product", label: "Product" },
  { id: "uilaws", label: "UILaws" },
  { id: "laws-of-ux", label: "Laws of UX" },
];

function parseDomain(value: string | null): CatalogDomain | "all" {
  if (value === "product" || value === "uilaws" || value === "laws-of-ux") {
    return value;
  }
  return "all";
}

export function DesignSystemPreview() {
  const router = useRouter();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState("");
  const [levelFilter, setLevelFilter] = useState<AtomicLevel | "all">("all");
  const domainFilter = parseDomain(searchParams.get("domain"));

  const filtered = useMemo(
    () => filterCatalog(query, levelFilter, domainFilter),
    [query, levelFilter, domainFilter],
  );

  const grouped = useMemo(() => {
    if (levelFilter !== "all") {
      return [{ level: levelFilter, entries: filtered }];
    }
    return LEVELS.map((level) => ({
      level,
      entries: filtered.filter((entry) => entry.level === level),
    })).filter((group) => group.entries.length > 0);
  }, [filtered, levelFilter]);

  function setDomain(domain: CatalogDomain | "all") {
    const href =
      domain === "all" ? "/design-system" : `/design-system?domain=${domain}`;
    router.push(href);
  }

  return (
    <div className="mx-auto max-w-7xl space-y-10 px-4 py-10 sm:px-6 lg:px-8">
      <header className="max-w-3xl">
        <div className="inline-flex w-fit items-center gap-2 rounded-full border border-border/70 bg-background/80 px-3 py-1 text-xs font-semibold text-muted-foreground">
          <Sparkles className="size-3.5" />
          Curated component library
        </div>
        <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Design system
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Atomic component catalog
        </h1>
        <p className="mt-3 text-base leading-7 text-muted-foreground">
          Components organized by atomic tier (atoms → molecules → organisms) and
          domain (product, UILaws, Laws of UX). Live previews with copy/export and
          Prism snippets. Reference:{" "}
          <a
            href={LAWS_OF_UX_SITE}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            lawsofux.com
          </a>
          ,{" "}
          <a
            href="https://www.uilaws.com/components"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            uilaws.com
          </a>
          .
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href="/"
            className="inline-flex min-h-11 items-center text-sm font-medium text-foreground underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            ← Back to dashboard demo
          </Link>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              downloadCatalogBundle(filtered.length ? filtered : unifiedCatalog);
              toast("Design system bundle downloaded", "success");
            }}
          >
            Export all snippets
          </Button>
        </div>
      </header>

      <Tabs
        value={domainFilter}
        onValueChange={(value) => setDomain(value as CatalogDomain | "all")}
      >
        <TabsList>
          {DOMAINS.map(({ id, label }) => (
            <TabsTrigger key={id} value={id}>
              {label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex-1">
          <Label htmlFor="catalog-search" className="sr-only">
            Search catalog
          </Label>
          <Input
            id="catalog-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search components…"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {(["all", ...LEVELS] as const).map((level) => (
            <Button
              key={level}
              type="button"
              size="sm"
              variant={levelFilter === level ? "default" : "outline"}
              onClick={() => setLevelFilter(level)}
              className="rounded-full capitalize"
            >
              {level}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="bg-muted/40">
          <CardContent className="p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Visible</p>
            <p className="mt-1 text-2xl font-semibold">{filtered.length}</p>
          </CardContent>
        </Card>
        <Card className="bg-muted/40">
          <CardContent className="p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Domain</p>
            <p className="mt-1 text-2xl font-semibold capitalize">{domainFilter}</p>
          </CardContent>
        </Card>
        <Card className="bg-muted/40">
          <CardContent className="p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Tier</p>
            <p className="mt-1 text-2xl font-semibold capitalize">{levelFilter}</p>
          </CardContent>
        </Card>
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-sm text-muted-foreground">
            No components match your search.
          </CardContent>
        </Card>
      ) : (
        grouped.map(({ level, entries }) => (
          <ErrorBoundary
            key={level}
            fallbackTitle={`Could not render ${level} section.`}
          >
            <AtomicSection level={level}>
              {entries.map((entry) => (
                <ErrorBoundary
                  key={entry.id}
                  fallbackTitle={`Could not render ${entry.name}.`}
                >
                  <ComponentPreviewCard
                    id={entry.id}
                    title={entry.name}
                    description={entry.description}
                    usage={entry.usage}
                    level={entry.level}
                    domain={entry.domain}
                    sourcePath={entry.sourcePath}
                    snippet={entry.code}
                    exportFilename={entry.exportFilename}
                    props={entry.props}
                    variants={entry.variants}
                    principles={entry.principles}
                  >
                    {entry.preview}
                  </ComponentPreviewCard>
                </ErrorBoundary>
              ))}
            </AtomicSection>
          </ErrorBoundary>
        ))
      )}
    </div>
  );
}
