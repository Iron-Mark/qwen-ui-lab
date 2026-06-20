import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import type { AtomicLevel } from "@/features/design-system/data/catalog-types";

const SECTION_META: Record<
  AtomicLevel,
  { title: string; subtitle: string; accent: string }
> = {
  atom: {
    title: "Atoms",
    subtitle: "Minimal UI primitives — buttons, toggles, and single-purpose controls.",
    accent: "border-l-foreground",
  },
  molecule: {
    title: "Molecules",
    subtitle: "Composed widgets — cards and placeholders built from atoms.",
    accent: "border-l-muted-foreground",
  },
  organism: {
    title: "Organisms",
    subtitle: "Dashboard sections — banners, lists, and multi-part layouts.",
    accent: "border-l-chart-bar",
  },
};

interface AtomicSectionProps {
  level: AtomicLevel;
  children: ReactNode;
  className?: string;
}

export function AtomicSection({ level, children, className }: AtomicSectionProps) {
  const meta = SECTION_META[level];

  return (
    <section
      aria-labelledby={`atomic-${level}`}
      className={cn("scroll-mt-24", className)}
    >
      <div
        className={cn(
          "mb-6 border-l-4 pl-4",
          meta.accent,
        )}
      >
        <h2
          id={`atomic-${level}`}
          className="text-2xl font-bold tracking-tight text-foreground"
        >
          {meta.title}
        </h2>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          {meta.subtitle}
        </p>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">{children}</div>
    </section>
  );
}
