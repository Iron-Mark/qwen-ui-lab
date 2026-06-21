import Link from "next/link";
import Image from "next/image";
import type { SVGProps } from "react";
import { Globe2 } from "lucide-react";
import { PageContainer } from "@/components/layout/PageContainer";
import { SITE_NAME } from "@/lib/seo";
import { DeveloperReadinessDialog } from "./DeveloperReadinessDialog";

const PRODUCT_LINKS = [
  { href: "/", label: "Dashboard" },
  { href: "/design-system", label: "Design system" },
  { href: "/demo", label: "One-click demo" },
] as const;

const RESOURCE_LINKS = [
  {
    href: "https://github.com/qwenlm/qwen3-vl",
    label: "Qwen3-VL",
  },
  {
    href: "https://qwenlm.github.io/qwen-code-docs/en/users/overview/",
    label: "Qwen Code",
  },
  {
    href: "https://github.com/Iron-Mark/qwen-ui-lab",
    label: "Source repo",
  },
] as const;

const SOCIAL_LINKS = [
  {
    href: "https://github.com/Iron-Mark",
    label: "GitHub",
    icon: GithubMark,
  },
  {
    href: "https://marksiazon.dev",
    label: "Portfolio",
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

function FooterLink({
  href,
  label,
  external = false,
}: {
  href: string;
  label: string;
  external?: boolean;
}) {
  const className =
    "text-sm text-muted-foreground transition-colors hover:text-card-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

  if (external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
      >
        {label}
      </a>
    );
  }

  return (
    <Link href={href} className={className}>
      {label}
    </Link>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-border/70 bg-card/95 backdrop-blur-sm">
      <PageContainer className="py-5 sm:py-6">
        <div className="grid gap-6 sm:grid-cols-[minmax(0,1fr)_minmax(16rem,20rem)] sm:items-start lg:grid-cols-[minmax(0,1fr)_auto]">
          <div className="max-w-xl sm:max-w-md">
            <Link
              href="/"
              className="inline-flex min-w-0 items-center gap-3 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
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
                  Screenshot to scaffold lab
                </span>
              </span>
            </Link>
            <p className="mt-3 max-w-sm text-sm leading-5 text-muted-foreground">
              Screenshot-to-React scaffolds with Qwen-ready export. Offline-safe
              for demos and reviews.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              {SOCIAL_LINKS.map(({ href, label, icon: Icon }) => (
                <a
                  key={href}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="inline-flex size-10 items-center justify-center rounded-lg border border-border/70 bg-background/60 text-muted-foreground transition-colors hover:border-primary/40 hover:text-card-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  <Icon className="size-4" aria-hidden />
                </a>
              ))}
            </div>
          </div>

          <div className="grid gap-5 min-[420px]:grid-cols-2 lg:min-w-[24rem]">
            <nav aria-label="Product">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-card-foreground/70">
                Product
              </p>
              <ul className="mt-3 space-y-2">
                {PRODUCT_LINKS.map((link) => (
                  <li key={link.href}>
                    <FooterLink {...link} />
                  </li>
                ))}
              </ul>
            </nav>

            <nav aria-label="Resources">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-card-foreground/70">
                Resources
              </p>
              <ul className="mt-3 space-y-2">
                {RESOURCE_LINKS.map((link) => (
                  <li key={link.href}>
                    <FooterLink {...link} external />
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-3 text-xs text-muted-foreground">
          <p>&copy; 2026 {SITE_NAME}. Built for screenshot-to-code workflows.</p>
          <DeveloperReadinessDialog />
        </div>
      </PageContainer>
    </footer>
  );
}
