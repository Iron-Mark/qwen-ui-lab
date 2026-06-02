"use client";

import { cn } from "@/lib/cn";
import { ExportButton } from "@/components/atoms/ExportButton";
import { CodeHighlight } from "@/components/atoms/CodeHighlight";

interface SnippetPreviewProps {
  code: string;
  title?: string;
  className?: string;
  showCopy?: boolean;
  language?: string;
}

export function SnippetPreview({
  code,
  title = "Snippet",
  className,
  showCopy = true,
  language = "tsx",
}: SnippetPreviewProps) {
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
        {showCopy ? (
          <ExportButton
            text={code}
            variant="copy"
            label="Copy code"
          />
        ) : null}
      </div>
      <CodeHighlight code={code} language={language} />
    </section>
  );
}
