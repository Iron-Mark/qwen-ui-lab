"use client";

import {
  LayoutDashboard,
  ListChecks,
  Loader2,
  LogIn,
  PanelsTopLeft,
  Settings2,
  ShoppingBag,
  Smartphone,
  Table2,
  UploadCloud,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { interpolate, type UploadFlowDictionary } from "@/lib/i18n";
import {
  SAMPLE_RUNS,
  getSampleRunById,
} from "../lib/reference-samples.mjs";
import { getSampleCopy } from "../lib/sample-copy";

interface SamplePickerProps {
  copy: UploadFlowDictionary;
  disabled?: boolean;
  loading?: boolean;
  onLoadSample: (sampleId: string) => void;
  onSelectedSampleChange: (sampleId: string) => void;
  selectedSampleId: string;
  showPathHint?: boolean;
}

function SampleIconBadge({
  className = "size-8 rounded-md",
  iconClassName = "size-4",
  sampleId,
}: {
  className?: string;
  iconClassName?: string;
  sampleId: string;
}) {
  return (
    <span
      className={`flex shrink-0 items-center justify-center border border-primary/15 bg-primary/10 text-primary ${className}`}
      aria-hidden
    >
      <SampleIcon className={iconClassName} sampleId={sampleId} />
    </span>
  );
}

function SampleIcon({
  className,
  sampleId,
}: {
  className?: string;
  sampleId: string;
}) {
  switch (sampleId) {
    case "auth":
      return <LogIn className={className} />;
    case "dashboard":
      return <LayoutDashboard className={className} />;
    case "ecommerce":
      return <ShoppingBag className={className} />;
    case "landing":
      return <PanelsTopLeft className={className} />;
    case "mobile":
      return <Smartphone className={className} />;
    case "settings":
      return <Settings2 className={className} />;
    case "stress-dashboard":
      return <Table2 className={className} />;
    case "stress-list":
      return <ListChecks className={className} />;
    default:
      return <UploadCloud className={className} />;
  }
}

export function SamplePicker({
  copy,
  disabled = false,
  loading = false,
  onLoadSample,
  onSelectedSampleChange,
  selectedSampleId,
  showPathHint = false,
}: SamplePickerProps) {
  const selectedSample = getSampleRunById(selectedSampleId);
  const selectedCopy = getSampleCopy(selectedSample.id, copy);

  return (
    <div className="grid min-w-0 gap-2 md:max-w-xl md:flex-1" data-testid="sample-picker">
      <p className="text-xs font-medium text-muted-foreground">
        {copy.trySampleRun}
      </p>
      <div className="flex min-w-0 flex-col gap-2 sm:flex-row">
        <Select
          value={selectedSample.id}
          onValueChange={(value) => {
            if (typeof value === "string") {
              onSelectedSampleChange(value);
            }
          }}
          disabled={disabled}
        >
          <SelectTrigger
            aria-label={copy.trySampleRun}
            className="min-h-11 w-full sm:min-w-64"
            data-testid="sample-select"
          >
            <SelectValue>
              {(value) => {
                const sampleId = typeof value === "string" ? value : selectedSample.id;
                const localized = getSampleCopy(sampleId, copy);

                return (
                  <span className="flex min-w-0 items-center gap-2">
                    <SampleIconBadge
                      sampleId={sampleId}
                      className="size-6 rounded-md"
                      iconClassName="size-3.5"
                    />
                    <span className="min-w-0 truncate">{localized.label}</span>
                  </span>
                );
              }}
            </SelectValue>
          </SelectTrigger>
          <SelectContent data-testid="sample-select-content">
            {SAMPLE_RUNS.map((sample) => {
              const localized = getSampleCopy(sample.id, copy);
              return (
                <SelectItem
                  key={sample.id}
                  value={sample.id}
                  label={localized.label}
                  data-testid={`sample-select-option-${sample.id}`}
                >
                  <span className="flex min-w-0 items-start gap-3">
                    <SampleIconBadge sampleId={sample.id} />
                    <span className="grid min-w-0 gap-0.5">
                      <span className="truncate font-medium">{localized.label}</span>
                      <span className="truncate text-xs text-muted-foreground">
                        {localized.hint}
                      </span>
                    </span>
                  </span>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
        <Button
          type="button"
          variant="outline"
          onClick={() => onLoadSample(selectedSample.id)}
          className="min-h-11 gap-2 px-3 sm:w-auto"
          disabled={disabled || loading}
          aria-label={interpolate(copy.loadSampleAria, {
            label: selectedCopy.label,
          })}
        >
          {loading ? (
            <Loader2 className="size-4 animate-spin" aria-hidden />
          ) : (
            <UploadCloud className="size-4" aria-hidden />
          )}
          {loading ? copy.loading : copy.loadSampleButton}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">{selectedCopy.hint}</p>
      {showPathHint ? (
        <p className="text-xs text-muted-foreground">{copy.samplePathHint}</p>
      ) : null}
    </div>
  );
}
