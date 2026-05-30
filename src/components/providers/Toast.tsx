"use client";

import { toast as sonnerToast } from "sonner";
import type { ReactNode } from "react";

export type ToastVariant = "default" | "success" | "error" | "warning";

export function useToast() {
  return {
    toast: (message: string, variant: ToastVariant = "default") => {
      switch (variant) {
        case "success":
          sonnerToast.success(message);
          break;
        case "error":
          sonnerToast.error(message);
          break;
        case "warning":
          sonnerToast.warning(message);
          break;
        default:
          sonnerToast(message);
      }
    },
  };
}

/** Passthrough wrapper — toasts render via Sonner `<Toaster />` in root layout. */
export function ToastProvider({ children }: { children: ReactNode }) {
  return children;
}
