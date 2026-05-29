"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import type { AtomicLevel } from "@/data/atomicCatalog";
import { ExportButton } from "./ExportButton";
import { SnippetPreview } from "./SnippetPreview";

const LEVEL_STYLES: Record<AtomicLevel, string> = {
  atom: "bg-foreground/10 text-foreground ring-1 ring-border",
  molecule: "bg-muted text-muted-foreground ring-1 ring-border",
  organism: "bg-card text-card-foreground ring-1 ring-border",
};

interface ComponentPreviewCardProps {
  id: string;
  title: string;
  description: string;
  level: AtomicLevel;
  snippet: string;
  exportFilename?: string;
  children: ReactNode;
  className?: string;
}

export function ComponentPreviewCard({
  id,
  title,
  description,
  level,
  snippet,
  exportFilename,
  children,
  className,
}: ComponentPreviewCardProps) {
  const filename = exportFilename ?? `${id}.tsx`;

  return (
    <article
      className={cn(
        "flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm",
        className,
      )}
    >
      <header className="border-b border-border px-4 py-3 sm:px-5">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-semibold text-card-foreground">{title}</h3>
            <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
          </div>
          <span
            className={cn(
              "shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize",
              LEVEL_STYLES[level],
            )}
          >
            {level}
          </span>
        </div>
      </header>

      <div className="relative min-h-[10rem] border-b border-border bg-background/50 p-4 sm:p-6">
        <div className="absolute left-3 top-3 z-10 flex flex-wrap gap-2 sm:left-4 sm:top-4">
          <ExportButton text={snippet} variant="copy" />
          <ExportButton
            text={snippet}
            variant="export"
            filename={filename}
          />
        </div>
        <div className="pt-14 sm:pt-16">{children}</div>
      </div>

      <SnippetPreview code={snippet} title={`${title} snippet`} showCopy />
    </article>
  );
}
