import type { UploadFlowDictionary } from "@/lib/i18n";

type SampleId = keyof UploadFlowDictionary["samples"];

export function getSampleCopy(
  sampleId: string,
  copy: UploadFlowDictionary,
): { label: string; hint: string } {
  const samples = copy.samples;
  if (sampleId in samples) {
    return samples[sampleId as SampleId];
  }
  return { label: sampleId, hint: "" };
}
