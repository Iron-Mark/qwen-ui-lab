export function Footer() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="text-center sm:text-left">
            <p className="text-sm font-medium text-card-foreground">
              qwen-ui-lab
            </p>
            <p className="text-xs text-muted-foreground">
              Screenshot → Plan → Patch workflow
            </p>
          </div>
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
                  href="https://github.com/qwenlm"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-muted-foreground transition-colors hover:text-card-foreground"
                >
                  GitHub
                </a>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </footer>
  );
}
