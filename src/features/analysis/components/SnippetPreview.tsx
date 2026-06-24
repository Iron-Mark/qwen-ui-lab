"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { ExportButton } from "@/features/export/components/ExportButton";
import { CodeHighlight } from "./CodeHighlight";

interface SnippetPreviewProps {
  code: string;
  title?: string;
  className?: string;
  showCopy?: boolean;
  /** Omit the built-in header (e.g. when a parent provides a unified preview toolbar). */
  hideHeader?: boolean;
  /** Replace the default title + copy row (ignored when `hideHeader` is true). */
  headerActions?: ReactNode;
  footer?: ReactNode;
  language?: string;
}

export function SnippetPreview({
  code,
  title = "Snippet",
  className,
  showCopy = true,
  hideHeader = false,
  headerActions,
  footer,
  language = "tsx",
}: SnippetPreviewProps) {
  if (hideHeader) {
    return (
      <CodeHighlight
        code={code}
        language={language}
        className={cn("rounded-xl", className)}
      />
    );
  }

  return (
    <section
      className={cn(
        "overflow-hidden rounded-xl border border-border bg-muted/40 shadow-xs",
        className,
      )}
      aria-label={title}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/80 bg-muted/65 px-4 py-2.5">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {title}
        </span>
        {headerActions ??
          (showCopy ? (
            <ExportButton text={code} variant="copy" label="Copy" />
          ) : null)}
      </div>
      <CodeHighlight code={code} language={language} />
      {footer ? (
        <div className="border-t border-border/80 bg-muted/45 px-4 py-2.5">
          {footer}
        </div>
      ) : null}
    </section>
  );
}
