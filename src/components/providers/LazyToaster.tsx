"use client";

import dynamic from "next/dynamic";
import type { ComponentProps } from "react";
import type { Toaster } from "@/components/ui/sonner";

const ToasterLazy = dynamic(
  () => import("@/components/ui/sonner").then((mod) => ({ default: mod.Toaster })),
  { ssr: false },
);

export function LazyToaster(props: ComponentProps<typeof Toaster>) {
  return <ToasterLazy {...props} />;
}
