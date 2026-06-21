"use client";

import { useMemo } from "react";
import Link from "next/link";
import { ChevronRightIcon, ExternalLink } from "lucide-react";
import {
  evaluateUxCompliance,
  complianceSummary,
  inferArchetypeIdFromArtifact,
  getArchetypeHighlightLaws,
  lawOfUxCatalogHref,
} from "../lib/ux-compliance.mjs";
import type { UxComplianceArtifact } from "../lib/ux-compliance.d.ts";
import {
  LAWS_OF_UX_SITE,
  lawOfUxById,
} from "@/lib/laws-of-ux";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";

const STATUS_STYLES = {
  met: "border-success/30 bg-success/10 text-success",
  partial: "border-amber-500/40 bg-amber-500/10 text-amber-900 dark:text-amber-100",
  review: "border-border bg-muted text-muted-foreground",
} as const;

const ARCHETYPE_LABELS: Record<string, string> = {
  dashboard: "Dashboard / analytics",
  auth: "Authentication",
  mobile: "Mobile app shell",
  landing: "Marketing landing",
  settings: "Settings / profile",
  ecommerce: "E-commerce / catalog",
};

function formatStats(summary: { met: number; partial: number; review: number }) {
  return `${summary.met} met · ${summary.partial} partial · ${summary.review} review`;
}

interface UiLawsComplianceProps {
  artifact: UxComplianceArtifact | null;
  stage?: "analyzed" | "generated";
}

export function UiLawsCompliance({ artifact, stage = "analyzed" }: UiLawsComplianceProps) {
  const checks = useMemo(() => evaluateUxCompliance(artifact), [artifact]);
  const summary = useMemo(() => complianceSummary(checks), [checks]);
  const statsLabel = formatStats(summary);
  const archetypeId = useMemo(() => inferArchetypeIdFromArtifact(artifact), [artifact]);
  const highlightLawIds = useMemo(
    () => getArchetypeHighlightLaws(archetypeId),
    [archetypeId],
  );
  const highlightChecks = useMemo(
    () =>
      highlightLawIds
        .map((id) => checks.find((check) => check.id === id))
        .filter((check): check is NonNullable<typeof check> => Boolean(check)),
    [checks, highlightLawIds],
  );

  if (!artifact || checks.length === 0) return null;

  const archetypeLabel = ARCHETYPE_LABELS[archetypeId] ?? "UI layout";

  return (
    <section
      className="rounded-lg border border-border bg-card p-4"
      aria-labelledby="ux-compliance-heading"
      data-testid="ux-compliance-section"
    >
      <div>
        <h3
          id="ux-compliance-heading"
          className="text-sm font-semibold text-card-foreground"
        >
          Laws of UX compliance
        </h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Heuristic check of this {stage === "generated" ? "scaffold" : "analysis"} against{" "}
          <a
            href={LAWS_OF_UX_SITE}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-foreground underline-offset-2 hover:underline"
          >
            lawsofux.com
          </a>{" "}
          patterns used in qwen-ui-lab.
        </p>
      </div>

      <div
        className="mt-3 rounded-lg border border-border/80 bg-muted/20 p-3"
        data-testid="ux-compliance-archetype-links"
      >
        <p className="text-xs font-semibold text-foreground">
          Relevant for {archetypeLabel}
        </p>
        <ul className="mt-2 flex flex-wrap gap-2">
          {highlightChecks.map((check) => (
            <li key={check.id}>
              <Link
                href={lawOfUxCatalogHref(check.id)}
                className="inline-flex min-h-9 items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-1 text-xs font-medium text-foreground underline-offset-2 transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                data-testid={`ux-law-link-${check.id}`}
              >
                {check.name}
                <Badge
                  variant="outline"
                  className={`h-5 px-1.5 text-[10px] capitalize ${STATUS_STYLES[check.status]}`}
                >
                  {check.status}
                </Badge>
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <Dialog>
        <DialogTrigger
          type="button"
          data-testid="ux-compliance-details-trigger"
          aria-haspopup="dialog"
          className="mt-3 flex w-full items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2.5 text-left text-xs transition-colors hover:bg-muted/50 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <span className="font-semibold text-foreground">View details</span>
          <span className="min-w-0 flex-1 truncate text-muted-foreground">{statsLabel}</span>
          <ChevronRightIcon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
        </DialogTrigger>

        <DialogContent className="flex max-h-[min(85vh,36rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-lg">
          <DialogHeader className="border-b border-border px-4 pt-4 pb-3">
            <DialogTitle>Laws of UX compliance</DialogTitle>
            <DialogDescription id="ux-compliance-dialog-description">
              {statsLabel} — expand each law for rationale and surface mapping.
            </DialogDescription>
          </DialogHeader>

          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-2">
            <Accordion multiple className="w-full">
              {checks.map((check) => {
                const law = lawOfUxById(check.id);
                return (
                  <AccordionItem key={check.id} value={check.id}>
                    <AccordionTrigger className="gap-2 py-3 hover:no-underline">
                      <span className="min-w-0 flex-1 text-left font-semibold">{check.name}</span>
                      <span
                        className={`shrink-0 rounded-md border px-2 py-0.5 text-[10px] font-semibold capitalize ${STATUS_STYLES[check.status]}`}
                      >
                        {check.status}
                      </span>
                    </AccordionTrigger>
                    <AccordionContent>
                      <p className="text-xs opacity-90">{check.rationale}</p>
                      <p className="mt-2 text-[10px] uppercase tracking-wide text-muted-foreground">
                        Surface: {check.surface.replace("-", " ")}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-3">
                        <Link
                          href={lawOfUxCatalogHref(check.id)}
                          className="inline-flex min-h-9 items-center gap-1 text-xs font-semibold text-foreground underline-offset-4 hover:underline"
                        >
                          Open in catalog →
                        </Link>
                        {law ? (
                          <a
                            href={`${LAWS_OF_UX_SITE}/${law.slug}/`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex min-h-9 items-center gap-1 text-xs font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                          >
                            lawsofux.com
                            <ExternalLink className="size-3" aria-hidden />
                          </a>
                        ) : null}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          </div>
        </DialogContent>
      </Dialog>

      <p className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
        <Link
          href={`/design-system?domain=laws-of-ux&selected=law-of-ux-${highlightLawIds[0] ?? "fitts"}`}
          className="font-semibold text-foreground underline-offset-4 hover:underline"
        >
          Laws of UX demos →
        </Link>
        <Link
          href="/design-system?domain=uilaws"
          className="font-semibold text-foreground underline-offset-4 hover:underline"
        >
          UILaws manual checklist →
        </Link>
      </p>
    </section>
  );
}
