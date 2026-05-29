import { ThemeToggle } from "./ThemeToggle";

export function Header() {
  return (
    <header className="border-b border-border bg-card">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-foreground">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-background"
            >
              <path d="M3 3v18h18" />
              <path d="m19 9-5 5-4-4-3 3" />
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-semibold text-card-foreground">
              qwen-ui-lab
            </h1>
            <p className="text-xs text-muted-foreground">
              AI-assisted UI scaffolding
            </p>
          </div>
        </div>
        <ThemeToggle />
      </div>
    </header>
  );
}
