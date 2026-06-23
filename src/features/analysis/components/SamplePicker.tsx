"use client";

import { UploadCloud } from "lucide-react";
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
  BUNDLED_REFERENCE_SAMPLES,
  getReferenceSampleById,
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

export function SamplePicker({
  copy,
  disabled = false,
  loading = false,
  onLoadSample,
  onSelectedSampleChange,
  selectedSampleId,
  showPathHint = false,
}: SamplePickerProps) {
  const selectedSample = getReferenceSampleById(selectedSampleId);
  const selectedCopy = getSampleCopy(selectedSample.id, copy);

  return (
    <div className="grid min-w-0 gap-2 md:max-w-xl md:flex-1" data-testid="sample-picker">
      <p className="text-xs font-medium text-muted-foreground">
        {copy.tryBundledReference}
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
            aria-label={copy.tryBundledReference}
            className="min-h-11 w-full sm:min-w-64"
            data-testid="sample-select"
          >
            <SelectValue>
              {(value) =>
                getSampleCopy(
                  typeof value === "string" ? value : selectedSample.id,
                  copy,
                ).label
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent data-testid="sample-select-content">
            {BUNDLED_REFERENCE_SAMPLES.map((sample) => {
              const localized = getSampleCopy(sample.id, copy);
              return (
                <SelectItem
                  key={sample.id}
                  value={sample.id}
                  label={localized.label}
                  data-testid={`sample-select-option-${sample.id}`}
                >
                  <span className="grid min-w-0 gap-0.5">
                    <span className="truncate font-medium">{localized.label}</span>
                    <span className="truncate text-xs text-muted-foreground">
                      {localized.hint}
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
          disabled={disabled}
          aria-label={interpolate(copy.loadSampleAria, {
            label: selectedCopy.label,
          })}
        >
          <UploadCloud className="size-4" aria-hidden />
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
