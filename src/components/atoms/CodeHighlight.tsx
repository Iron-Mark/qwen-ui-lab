"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";

interface CodeHighlightProps {
  code: string;
  language?: string;
  className?: string;
}

export function CodeHighlight({
  code,
  language = "tsx",
  className,
}: CodeHighlightProps) {
  const [html, setHtml] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function highlight() {
      const Prism = (await import("prismjs")).default;
      await import("prismjs/components/prism-clike");
      await import("prismjs/components/prism-javascript");
      await import("prismjs/components/prism-jsx");
      await import("prismjs/components/prism-typescript");
      await import("prismjs/components/prism-tsx");

      const grammar =
        Prism.languages[language] ||
        Prism.languages.tsx ||
        Prism.languages.typescript;
      if (cancelled || !grammar) return;
      setHtml(Prism.highlight(code, grammar, language));
    }

    void highlight();
    return () => {
      cancelled = true;
    };
  }, [code, language]);

  if (!html) {
    return (
      <pre
        className={cn(
          "max-h-80 overflow-auto px-4 py-4 font-mono text-[0.8125rem] leading-6 text-card-foreground sm:text-sm",
          className,
        )}
      >
        <code className="block whitespace-pre-wrap break-words">{code}</code>
      </pre>
    );
  }

  return (
    <pre
      className={cn(
        "code-highlight max-h-80 overflow-auto px-4 py-4 font-mono text-[0.8125rem] leading-6 sm:text-sm",
        className,
      )}
      tabIndex={0}
    >
      <code
        className="block whitespace-pre-wrap break-words"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </pre>
  );
}
