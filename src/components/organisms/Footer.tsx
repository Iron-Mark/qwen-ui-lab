import Link from "next/link";
import { PageContainer } from "@/components/layout/PageContainer";
import { SITE_PITCH } from "@/lib/seo";

export function Footer() {
  return (
    <footer className="border-t border-border/70 bg-card/80 backdrop-blur-sm">
      <PageContainer className="py-6">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row sm:items-start">
          <div className="max-w-sm text-center sm:text-left">
            <p className="text-sm font-semibold text-card-foreground">
              qwen-ui-lab
            </p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              {SITE_PITCH} Demo mode runs locally for meetups and reviews.
            </p>
          </div>
          <nav aria-label="Internal links">
            <ul className="flex items-center gap-6">
              <li>
                <Link
                  href="/"
                  className="text-xs text-muted-foreground transition-colors hover:text-card-foreground"
                >
                  Dashboard
                </Link>
              </li>
              <li>
                <Link
                  href="/design-system"
                  className="text-xs text-muted-foreground transition-colors hover:text-card-foreground"
                >
                  Design system
                </Link>
              </li>
            </ul>
          </nav>
          <nav aria-label="External links">
            <ul className="flex items-center gap-6">
              <li>
                <a
                  href="https://github.com/qwenlm/qwen3-vl"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-muted-foreground transition-colors hover:text-card-foreground"
                >
                  Qwen3-VL
                </a>
              </li>
              <li>
                <a
                  href="https://qwenlm.github.io/qwen-code-docs/en/users/overview/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-muted-foreground transition-colors hover:text-card-foreground"
                >
                  Qwen Code
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/Iron-Mark/qwen-ui-lab"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-muted-foreground transition-colors hover:text-card-foreground"
                >
                  Source repo
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/qwenlm"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-muted-foreground transition-colors hover:text-card-foreground"
                >
                  QwenLM
                </a>
              </li>
            </ul>
          </nav>
        </div>
      </PageContainer>
    </footer>
  );
}
