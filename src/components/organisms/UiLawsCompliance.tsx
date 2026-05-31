"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  evaluateUxCompliance,
  complianceSummary,
} from "@/lib/ux-compliance.mjs";
import type { UxComplianceArtifact } from "@/lib/ux-compliance.d.ts";
import { LAWS_OF_UX_SITE } from "@/data/lawsOfUx";

const STATUS_STYLES = {
  met: "border-success/30 bg-success/10 text-success",
  partial: "border-amber-500/40 bg-amber-500/10 text-amber-900 dark:text-amber-100",
  review: "border-border bg-muted text-muted-foreground",
} as const;

interface UiLawsComplianceProps {
  artifact: UxComplianceArtifact | null;
  stage?: "analyzed" | "generated";
}

export function UiLawsCompliance({ artifact, stage = "analyzed" }: UiLawsComplianceProps) {
  const checks = useMemo(() => evaluateUxCompliance(artifact), [artifact]);
  const summary = useMemo(() => complianceSummary(checks), [checks]);

  if (!artifact || checks.length === 0) return null;

  return (
    <section
      className="rounded-lg border border-border bg-card p-4"
      aria-labelledby="ux-compliance-heading"
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
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
        <p className="text-xs font-semibold text-muted-foreground">
          {summary.met} met · {summary.partial} partial · {summary.review} review
        </p>
      </div>

      <ul className="mt-4 space-y-2">
        {checks.map((check) => (
          <li
            key={check.id}
            className={`rounded-lg border px-3 py-2 text-xs ${STATUS_STYLES[check.status]}`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-semibold">{check.name}</span>
              <span className="capitalize opacity-80">{check.status}</span>
            </div>
            <p className="mt-1 opacity-90">{check.rationale}</p>
            <p className="mt-1 text-[10px] uppercase tracking-wide opacity-70">
              Surface: {check.surface.replace("-", " ")}
            </p>
          </li>
        ))}
      </ul>

      <p className="mt-4 flex flex-wrap gap-3 text-xs text-muted-foreground">
        <Link
          href="/design-system?domain=laws-of-ux"
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
