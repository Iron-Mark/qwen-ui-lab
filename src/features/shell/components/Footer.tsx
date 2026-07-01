import Link from "next/link";
import Image from "next/image";
import type { ReactElement, SVGProps } from "react";
import { Globe2 } from "lucide-react";
import { PageContainer } from "@/components/layout/PageContainer";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { SITE_NAME } from "@/lib/seo";

interface FooterLinkConfig {
  href: string;
  label: string;
  tooltip: string;
}

const PRODUCT_LINKS = [
  {
    href: "/",
    label: "Dashboard",
    tooltip: "Return to your workspace and continue building from the uploaded screenshots.",
  },
  {
    href: "/design-system",
    label: "Design system",
    tooltip: "Browse reusable components, variants, and export snippets.",
  },
  {
    href: "/demo",
    label: "Sample reference",
    tooltip: "Open a screenshot sample reference and review the export package.",
  },
] satisfies readonly FooterLinkConfig[];

const RESOURCE_LINKS = [
  {
    href: "https://github.com/qwenlm/qwen3-vl",
    label: "Qwen3-VL",
    tooltip: "Open the vision model project used for live analysis.",
  },
  {
    href: "https://qwenlm.github.io/qwen-code-docs/en/users/overview/",
    label: "Qwen Code",
    tooltip: "Read the Qwen Code docs for generated React output.",
  },
  {
    href: "https://github.com/Iron-Mark/qwen-ui-lab",
    label: "Source repo",
    tooltip: "View this app's source code on GitHub.",
  },
] satisfies readonly FooterLinkConfig[];

const SOCIAL_LINKS = [
  {
    href: "https://github.com/Iron-Mark",
    label: "GitHub",
    tooltip: "Open Mark's GitHub profile.",
    icon: GithubMark,
  },
  {
    href: "https://ph.linkedin.com/in/mark-siazon",
    label: "LinkedIn",
    tooltip: "Open Mark's LinkedIn profile.",
    icon: LinkedinMark,
  },
  {
    href: "https://marksiazon.dev",
    label: "Website",
    tooltip: "Open Mark's portfolio website.",
    icon: Globe2,
  },
] as const;

function GithubMark(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M12 .5a12 12 0 0 0-3.79 23.39c.6.11.82-.26.82-.58v-2.04c-3.34.73-4.04-1.42-4.04-1.42-.55-1.39-1.34-1.76-1.34-1.76-1.09-.75.08-.73.08-.73 1.2.08 1.84 1.24 1.84 1.24 1.07 1.83 2.8 1.3 3.49.99.11-.78.42-1.3.76-1.6-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.13-.3-.54-1.52.12-3.18 0 0 1-.32 3.3 1.23a11.45 11.45 0 0 1 6 0c2.3-1.55 3.3-1.23 3.3-1.23.66 1.66.25 2.88.12 3.18.77.84 1.24 1.91 1.24 3.22 0 4.61-2.81 5.63-5.48 5.92.43.37.81 1.1.81 2.22v3.29c0 .32.22.69.83.57A12 12 0 0 0 12 .5Z" />
    </svg>
  );
}

function LinkedinMark(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.13 1.45-2.13 2.94v5.67H9.35V8.98h3.41v1.57h.05a3.74 3.74 0 0 1 3.36-1.85c3.6 0 4.26 2.37 4.26 5.45v6.3ZM5.34 7.41a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12Zm1.78 13.04H3.55V8.98h3.57v11.47Z" />
    </svg>
  );
}

function FooterTooltip({
  children,
  content,
}: {
  children: ReactElement;
  content: string;
}) {
  return (
    <Tooltip>
      <TooltipTrigger render={children} />
      <TooltipContent
        side="top"
        sideOffset={8}
        className="max-w-64 text-balance text-center leading-5"
      >
        {content}
      </TooltipContent>
    </Tooltip>
  );
}

function FooterLink({
  external = false,
  href,
  label,
  tooltip,
}: {
  external?: boolean;
  href: string;
  label: string;
  tooltip: string;
}) {
  const className =
    "inline-flex min-h-11 w-fit min-w-0 items-center rounded-md px-2 text-sm font-medium text-muted-foreground underline-offset-4 transition-colors hover:bg-muted/50 hover:text-card-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

  if (external) {
    return (
      <FooterTooltip content={tooltip}>
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className={className}
        >
          {label}
        </a>
      </FooterTooltip>
    );
  }

  return (
    <FooterTooltip content={tooltip}>
      <Link href={href} className={className}>
        {label}
      </Link>
    </FooterTooltip>
  );
}

function FooterNavSection({
  external = false,
  label,
  links,
}: {
  external?: boolean;
  label: string;
  links: readonly FooterLinkConfig[];
}) {
  return (
    <nav aria-label={label} className="min-w-0">
      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-card-foreground/80">
        {label}
      </p>
      <ul className="mt-3 space-y-1.5">
        {links.map((link) => (
          <li key={link.href}>
            <FooterLink {...link} external={external} />
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-border/70 bg-card/95 backdrop-blur-sm">
      <PageContainer className="py-5 sm:py-6">
        <div className="grid gap-6 sm:grid-cols-[minmax(0,1fr)_minmax(16rem,20rem)] sm:items-start lg:grid-cols-[minmax(0,1fr)_auto]">
          <div className="max-w-xl sm:max-w-md">
            <FooterTooltip content="Return to the main screenshot-to-React workspace.">
              <Link
                href="/"
                className="inline-flex min-h-11 min-w-0 items-center gap-3 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                <Image
                  src="/icons/icon.svg"
                  alt=""
                  width={40}
                  height={40}
                  className="size-10 shrink-0 rounded-xl shadow-[0_8px_24px_color-mix(in_oklch,var(--primary)_28%,transparent)]"
                  fetchPriority="low"
                />
                <span className="min-w-0">
                  <span className="block truncate text-base font-semibold text-card-foreground">
                    {SITE_NAME}
                  </span>
                  <span className="block truncate text-xs text-muted-foreground">
                    React + Tailwind package
                  </span>
                </span>
              </Link>
            </FooterTooltip>
            <p className="mt-3 max-w-sm text-sm leading-5 text-muted-foreground">
              Create reviewable React + Tailwind export packages from
              screenshot analysis.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              {SOCIAL_LINKS.map(({ href, label, tooltip, icon: Icon }) => (
                <FooterTooltip key={href} content={tooltip}>
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="inline-flex size-10 items-center justify-center rounded-lg border border-border/70 bg-background/60 text-muted-foreground transition-colors hover:border-primary/40 hover:text-card-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  >
                    <Icon className="size-4" aria-hidden />
                  </a>
                </FooterTooltip>
              ))}
            </div>
          </div>

          <div className="grid gap-8 min-[420px]:grid-cols-2 lg:min-w-[24rem]">
            <FooterNavSection label="Product" links={PRODUCT_LINKS} />
            <FooterNavSection
              external
              label="Resources"
              links={RESOURCE_LINKS}
            />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-3 text-xs text-muted-foreground">
          <p>
            &copy; 2026 {SITE_NAME}. Built for practical React+Tailwind
            export packages.
          </p>
          <FooterTooltip content="Open Mark's portfolio and project work.">
            <a
              href="https://marksiazon.dev"
              target="_blank"
              rel="noopener noreferrer"
              data-testid="footer-portfolio-cta"
              className="inline-flex min-h-11 items-center gap-1.5 rounded-md px-3 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/50 hover:text-card-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <Globe2 className="size-3.5" aria-hidden />
              Check my portfolio
            </a>
          </FooterTooltip>
        </div>
      </PageContainer>
    </footer>
  );
}
