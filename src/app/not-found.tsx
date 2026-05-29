import Link from "next/link";

export default function NotFound() {
  return (
    <section
      aria-labelledby="not-found-heading"
      className="mx-auto flex max-w-7xl flex-col items-center px-4 py-16 text-center sm:px-6 sm:py-24 lg:px-8"
    >
      <p
        aria-hidden="true"
        className="text-7xl font-bold tracking-tight text-success sm:text-8xl"
      >
        404
      </p>

      <h1
        id="not-found-heading"
        className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl"
      >
        Page not found
      </h1>

      <p className="mt-3 max-w-md text-base leading-7 text-muted-foreground">
        The page you requested doesn&apos;t exist or may have been moved. Choose
        a destination below to continue exploring qwen-ui-lab.
      </p>

      <nav
        aria-label="Back to known pages"
        className="mt-8 flex flex-col gap-3 sm:flex-row sm:gap-4"
      >
        <Link
          href="/"
          className="inline-flex min-h-11 items-center justify-center rounded-lg bg-foreground px-5 text-sm font-medium text-background transition-colors hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          Back to dashboard
        </Link>
        <Link
          href="/design-system"
          className="inline-flex min-h-11 items-center justify-center rounded-lg border border-border bg-card px-5 text-sm font-medium text-card-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          Design system
        </Link>
      </nav>
    </section>
  );
}
