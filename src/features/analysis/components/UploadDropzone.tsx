"use client";

import type { RefObject } from "react";
import Image from "next/image";
import { UploadCloud } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { UPLOAD_ACCEPT_ATTRIBUTE } from "../lib/upload-constraints.mjs";

interface UploadDropzoneProps {
  previewUrl?: string | null;
  onFile: (file: File | null) => void;
  onDropFile?: (file: File | null) => void;
  disabled?: boolean;
  className?: string;
  inputRef?: RefObject<HTMLInputElement | null>;
  buttonRef?: RefObject<HTMLButtonElement | null>;
}

export function UploadDropzone({
  previewUrl,
  onFile,
  onDropFile,
  disabled = false,
  className,
  inputRef,
  buttonRef,
}: UploadDropzoneProps) {
  return (
    <div
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault();
        if (disabled) return;
        const file = event.dataTransfer.files.item(0);
        (onDropFile ?? onFile)(file);
      }}
      className={cn(className)}
    >
      <input
        ref={inputRef}
        type="file"
        accept={UPLOAD_ACCEPT_ATTRIBUTE}
        aria-label="Upload UI screenshot"
        className="sr-only upload-dropzone-input"
        disabled={disabled}
        suppressHydrationWarning
        onChange={(event) => onFile(event.target.files?.item(0) ?? null)}
      />
      <Button
        ref={buttonRef}
        type="button"
        variant="outline"
        data-testid="upload-dropzone-button"
        disabled={disabled}
        onClick={() => inputRef?.current?.click()}
        className="relative flex h-auto min-h-72 w-full flex-col items-center justify-center overflow-hidden border-dashed border-primary/45 bg-muted/25 px-6 py-8 text-center whitespace-normal shadow-[inset_0_2px_18px_color-mix(in_oklch,var(--foreground)_12%,transparent),inset_0_0_0_1px_color-mix(in_oklch,var(--background)_70%,transparent)] ring-1 ring-inset ring-primary/15 transition-[background-color,border-color,box-shadow,transform] duration-200 hover:border-primary/70 hover:bg-primary/5 hover:shadow-[inset_0_3px_22px_color-mix(in_oklch,var(--foreground)_14%,transparent),inset_0_0_0_1px_color-mix(in_oklch,var(--primary)_24%,transparent)] focus-visible:border-primary/70 focus-visible:bg-primary/5 focus-visible:ring-3 focus-visible:ring-ring/45 active:translate-y-0 disabled:opacity-60 dark:bg-muted/15 dark:shadow-[inset_0_2px_22px_color-mix(in_oklch,var(--foreground)_8%,transparent),inset_0_0_0_1px_color-mix(in_oklch,var(--primary)_14%,transparent)]"
      >
        {previewUrl ? (
          <span className="relative block h-64 w-full max-w-full overflow-hidden rounded-md bg-background/70 shadow-sm ring-1 ring-border/70">
            <Image
              src={previewUrl}
              alt="Uploaded UI screenshot"
              className="object-contain"
              fill
              sizes="(max-width: 1024px) 100vw, 640px"
              loading="lazy"
              unoptimized
            />
          </span>
        ) : (
          <span className="flex flex-col items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-full bg-background/85 text-primary shadow-sm ring-1 ring-primary/20">
              <UploadCloud className="size-5" aria-hidden />
            </span>
            <span className="block min-h-[1.75rem] text-lg font-semibold text-card-foreground">
              Drop a screenshot here
            </span>
            <span className="block text-sm font-normal text-muted-foreground">
              PNG, JPG, SVG, or WebP
            </span>
          </span>
        )}
      </Button>
    </div>
  );
}
