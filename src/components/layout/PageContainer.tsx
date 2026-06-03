import type { ComponentPropsWithoutRef, ElementType } from "react";
import { PAGE_CONTAINER_CLASS } from "@/lib/page-layout";
import { cn } from "@/lib/utils";

type PageContainerProps<T extends ElementType = "div"> = {
  as?: T;
  className?: string;
} & Omit<ComponentPropsWithoutRef<T>, "as" | "className">;

export function PageContainer<T extends ElementType = "div">({
  as,
  className,
  ...props
}: PageContainerProps<T>) {
  const Component = (as ?? "div") as ElementType;
  return <Component className={cn(PAGE_CONTAINER_CLASS, className)} {...props} />;
}
