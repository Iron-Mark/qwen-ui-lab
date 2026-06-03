export function DesignSystemLcpHeader() {
  return (
    <header className="sticky top-16 z-20 scroll-mt-16 rounded-2xl border border-border/70 bg-background/95 p-4 backdrop-blur supports-[backdrop-filter]:bg-background/80 lg:top-[4.5rem]">
      <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        Design system
      </p>
      <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
        Atomic component lab
      </h1>
      <p className="growth-snippet mt-1 text-sm text-muted-foreground">
        Filter fast, inspect one component deeply, and copy implementation snippets.
      </p>
    </header>
  );
}
