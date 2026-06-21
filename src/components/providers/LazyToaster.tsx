"use client";

import dynamic from "next/dynamic";
import type { ComponentProps } from "react";
import type { Toaster } from "./SonnerToaster";

const ToasterLazy = dynamic(
  () => import("./SonnerToaster").then((mod) => ({ default: mod.Toaster })),
  { ssr: false },
);

export function LazyToaster(props: ComponentProps<typeof Toaster>) {
  return <ToasterLazy {...props} />;
}
