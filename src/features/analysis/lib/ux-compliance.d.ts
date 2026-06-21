import type { LawOfUxId } from "@/lib/laws-of-ux";

export type ComplianceStatus = "met" | "partial" | "review";
export type ComplianceSurface = "upload-flow" | "dashboard" | "scaffold" | "catalog";

export interface UxComplianceCheck {
  id: LawOfUxId;
  name: string;
  status: ComplianceStatus;
  rationale: string;
  surface: ComplianceSurface;
}

export interface UxComplianceSummary {
  met: number;
  partial: number;
  review: number;
  total: number;
}

export interface UxComplianceArtifact {
  plan?: Array<{ title: string; body: string }>;
  generatedCode?: string;
  previewStats?: Array<{ label: string; value: string }>;
  steps?: Array<{ id: string; label: string }>;
  file?: {
    name?: string;
    type?: string;
    size?: number;
    width?: number | null;
    height?: number | null;
  };
}

export type LayoutArchetypeId =
  | "dashboard"
  | "auth"
  | "mobile"
  | "landing"
  | "settings"
  | "ecommerce";

export function lawOfUxCatalogHref(lawId: LawOfUxId): string;

export function inferArchetypeIdFromArtifact(
  artifact: UxComplianceArtifact | null | undefined,
): LayoutArchetypeId;

export function getArchetypeHighlightLaws(archetypeId: string): LawOfUxId[];

export const ARCHETYPE_HIGHLIGHT_LAWS: Record<LayoutArchetypeId, LawOfUxId[]>;

export function evaluateUxCompliance(
  artifact: UxComplianceArtifact | null | undefined,
): UxComplianceCheck[];

export function complianceSummary(checks: UxComplianceCheck[]): UxComplianceSummary;
