import Link from "next/link";
import type { UiLawId } from "@/data/uilaws";
import { lawNames } from "@/data/uilaws";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";

export interface LawInformationCardProps {
  title: string;
  description: string;
  href?: string;
  linkLabel?: string;
  principles?: UiLawId[];
  className?: string;
}

export function LawInformationCard({
  title,
  description,
  href,
  linkLabel = "View details",
  principles = ["proximity", "white-space", "typography-hierarchy"],
  className,
}: LawInformationCardProps) {
  const labels = lawNames(principles);

  return (
    <Card className={cn(className)}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <p className="text-sm leading-6 text-muted-foreground">{description}</p>
      </CardHeader>

      {labels.length > 0 ? (
        <CardContent className="pt-0">
          <ul className="flex flex-wrap gap-2" aria-label="Demonstrates UI laws">
            {labels.map((label) => (
              <li key={label}>
                <Badge variant="secondary">{label}</Badge>
              </li>
            ))}
          </ul>
        </CardContent>
      ) : null}

      {href ? (
        <CardFooter className="border-t">
          <Link href={href} className={buttonVariants({ variant: "link" })}>
            {linkLabel}
          </Link>
        </CardFooter>
      ) : null}
    </Card>
  );
}
