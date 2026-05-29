"use client";

import Link from "next/link";
import { AtomicSection } from "./AtomicSection";
import { ComponentPreviewCard } from "./ComponentPreviewCard";
import {
  catalogByLevel,
  type AtomicLevel,
} from "@/data/atomicCatalog";

const LEVELS: AtomicLevel[] = ["atom", "molecule", "organism"];

export function DesignSystemPreview() {
  return (
    <div className="mx-auto max-w-7xl space-y-16 px-4 py-10 sm:px-6 lg:px-8">
      <header className="max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Design system
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Atomic component catalog
        </h1>
        <p className="mt-3 text-base leading-7 text-muted-foreground">
          Live previews with copy and export on the top-left of each component.
          Snippets share clipboard feedback, readable monospace type, and
          project color tokens.
        </p>
        <Link
          href="/"
          className="mt-4 inline-flex text-sm font-medium text-foreground underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          ← Back to dashboard demo
        </Link>
      </header>

      {LEVELS.map((level) => (
        <AtomicSection key={level} level={level}>
          {catalogByLevel(level).map((entry) => (
            <ComponentPreviewCard
              key={entry.id}
              id={entry.id}
              title={entry.name}
              description={entry.description}
              level={entry.level}
              snippet={entry.code}
              exportFilename={entry.exportFilename}
            >
              {entry.preview}
            </ComponentPreviewCard>
          ))}
        </AtomicSection>
      ))}
    </div>
  );
}
