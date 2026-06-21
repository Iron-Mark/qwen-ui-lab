"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

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
  const languageClass = `language-${language.toLowerCase()}`;

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
          "code-highlight max-h-80 overflow-auto bg-card px-4 py-4 font-mono text-[0.8125rem] leading-6 text-card-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card sm:text-sm",
          className,
        )}
        tabIndex={0}
      >
        <code className={cn(languageClass, "block whitespace-pre-wrap break-words")}>
          {code}
        </code>
      </pre>
    );
  }

  return (
    <pre
      className={cn(
        "code-highlight max-h-80 overflow-auto bg-card px-4 py-4 font-mono text-[0.8125rem] leading-6 text-card-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card sm:text-sm",
        className,
      )}
      tabIndex={0}
    >
      <code
        className={cn(languageClass, "block whitespace-pre-wrap break-words")}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </pre>
  );
}
