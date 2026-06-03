"use client";

import type { RefObject } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface UploadDropzoneProps {
  previewUrl?: string | null;
  onFile: (file: File | null) => void;
  onDropFile?: (file: File | null) => void;
  disabled?: boolean;
  className?: string;
  inputRef?: RefObject<HTMLInputElement | null>;
}

export function UploadDropzone({
  previewUrl,
  onFile,
  onDropFile,
  disabled = false,
  className,
  inputRef,
}: UploadDropzoneProps) {
  const accept = "image/png,image/jpeg,image/svg+xml,image/webp";

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
        accept={accept}
        className="sr-only"
        disabled={disabled}
        onChange={(event) => onFile(event.target.files?.item(0) ?? null)}
      />
      <Button
        type="button"
        variant="outline"
        disabled={disabled}
        onClick={() => inputRef?.current?.click()}
        className="flex min-h-72 h-auto w-full flex-col items-center justify-center border-dashed bg-background px-6 py-8 text-center whitespace-normal"
      >
        {previewUrl ? (
          <span className="relative block h-64 w-full max-w-full overflow-hidden rounded-md">
            <Image
              src={previewUrl}
              alt="Uploaded UI reference"
              className="object-contain"
              fill
              sizes="(max-width: 1024px) 100vw, 640px"
              loading="lazy"
              unoptimized
            />
          </span>
        ) : (
          <span className="space-y-2">
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
