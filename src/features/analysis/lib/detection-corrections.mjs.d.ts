export type DetectionCorrectionReason = {
  code: string;
  label: string;
  evidence: string;
  weight: number;
};

export function correctedDetectionConfidence(
  confidence: number | undefined,
  included: boolean,
): number;

export function mergeManualCorrectionReasons(args: {
  reasons?: DetectionCorrectionReason[];
  included: boolean;
  confidence: number;
  changes?: string[];
  source?: "editor" | "regeneration";
}): DetectionCorrectionReason[];

export function describeManualDetectionChanges(
  element: {
    kind?: string;
    primitive?: string;
    componentRole?: string;
    included?: boolean;
    box?: { x: number; y: number; width: number; height: number };
  },
  patch?: {
    kind?: string;
    primitive?: string;
    componentRole?: string;
    included?: boolean;
    box?: { x: number; y: number; width: number; height: number };
  },
): string[];

export function summarizeCorrectedElementChanges(element: {
  kind?: string;
  primitive?: string;
  componentRole?: string;
  included?: boolean;
  box?: { x: number; y: number; width: number; height: number };
}): string[];
