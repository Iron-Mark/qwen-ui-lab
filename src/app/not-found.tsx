import Link from "next/link";
import { PageContainer } from "@/components/layout/PageContainer";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function NotFound() {
  return (
    <PageContainer
      as="section"
      aria-labelledby="not-found-heading"
      className="flex flex-col items-center py-16 text-center sm:py-24"
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
        <Link href="/" className={cn(buttonVariants(), "min-h-11 px-5")}>
          Back to dashboard
        </Link>
        <Link
          href="/design-system"
          className={cn(buttonVariants({ variant: "outline" }), "min-h-11 px-5")}
        >
          Design system
        </Link>
      </nav>
    </PageContainer>
  );
}
