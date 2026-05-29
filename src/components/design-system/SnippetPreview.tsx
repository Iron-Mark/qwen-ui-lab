"use client";

import { cn } from "@/lib/cn";
import { ExportButton } from "./ExportButton";

interface SnippetPreviewProps {
  code: string;
  title?: string;
  className?: string;
  showCopy?: boolean;
}

export function SnippetPreview({
  code,
  title = "Snippet",
  className,
  showCopy = true,
}: SnippetPreviewProps) {
  return (
    <section
      className={cn("bg-muted/30", className)}
      aria-label={title}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-2.5">
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
      <pre
        className="max-h-80 overflow-auto px-4 py-4 font-mono text-[0.8125rem] leading-6 text-card-foreground sm:text-sm"
        tabIndex={0}
      >
        <code className="block whitespace-pre-wrap break-words">{code}</code>
      </pre>
    </section>
  );
}
