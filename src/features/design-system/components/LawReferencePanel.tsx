import Link from "next/link";
import { UI_LAWS, UILAWS_SITE, type UiLawId } from "@/features/design-system/data/uilaws";
import { cn } from "@/lib/cn";

const ROUTE_HINTS: Partial<Record<UiLawId, { label: string; href: string }>> = {
  fitts: { label: "Design system → Export controls", href: "/design-system" },
  hick: { label: "Dashboard upload flow", href: "/" },
  jakob: { label: "App header navigation", href: "/" },
  consistency: { label: "Atomic catalog", href: "/design-system" },
  proximity: { label: "Plan cards after analyze", href: "/" },
  contrast: { label: "Reference vs scaffold split", href: "/" },
  "white-space": { label: "Catalog preview panes", href: "/design-system" },
  "typography-hierarchy": { label: "UILaws section", href: "/design-system?domain=uilaws" },
};

interface LawReferencePanelProps {
  className?: string;
  /** Show only laws with product route hints */
  productOnly?: boolean;
}

export function LawReferencePanel({
  className,
  productOnly = false,
}: LawReferencePanelProps) {
  const laws = productOnly
    ? UI_LAWS.filter((law) => ROUTE_HINTS[law.id])
    : UI_LAWS;

  return (
    <section
      className={cn(
        "rounded-xl border border-border bg-card p-5 shadow-sm",
        className,
      )}
      aria-labelledby="law-reference-title"
    >
      <header className="mb-4">
        <h3
          id="law-reference-title"
          className="text-lg font-semibold text-card-foreground"
        >
          Laws → product map
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Principles from{" "}
          <a
            href={UILAWS_SITE}
            className="font-medium text-card-foreground underline-offset-2 hover:underline"
            target="_blank"
            rel="noreferrer"
          >
            Laws of UI
          </a>{" "}
          mapped to qwen-ui-lab surfaces you can improve today.
        </p>
      </header>

      <ul className="grid gap-3 sm:grid-cols-2">
        {laws.map((law) => {
          const hint = ROUTE_HINTS[law.id];
          return (
            <li
              key={law.id}
              className="rounded-lg border border-border bg-background/50 p-3"
            >
              <p className="text-sm font-semibold text-card-foreground">
                {law.name}
              </p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                {law.application}
              </p>
              {hint ? (
                <Link
                  href={hint.href}
                  className="mt-2 inline-flex min-h-11 items-center text-xs font-semibold text-card-foreground underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {hint.label} →
                </Link>
              ) : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
