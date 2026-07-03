/**
 * Heuristic compliance mapping for analysis and starter scaffolds vs Laws of UX.
 * @typedef {'met' | 'partial' | 'review'} ComplianceStatus
 * @typedef {'upload-flow' | 'dashboard' | 'scaffold' | 'catalog'} ComplianceSurface
 * @typedef {import('../../../lib/laws-of-ux').LawOfUxId} LawOfUxId
 */

import { classifyLayoutArchetype, lookupKnownSample } from "./offline-analyze.mjs";
import { getSampleRunByFileName } from "./reference-samples.data.mjs";

/** Priority laws to surface per detected UI archetype. */
export const ARCHETYPE_HIGHLIGHT_LAWS = {
  dashboard: ["jakob", "miller", "chunking", "doherty", "serial-position"],
  auth: ["fitts", "hick", "cognitive-load", "aesthetic-usability", "peak-end"],
  mobile: ["fitts", "goal-gradient", "hick", "chunking", "serial-position"],
  landing: ["von-restorff", "peak-end", "aesthetic-usability", "serial-position", "hick"],
  settings: ["hick", "miller", "cognitive-load", "chunking", "fitts"],
  ecommerce: ["choice-overload", "hick", "fitts", "jakob", "chunking"],
};

/**
 * @param {LawOfUxId} lawId
 */
export function lawOfUxCatalogHref(lawId) {
  return `/design-system?domain=laws-of-ux&selected=law-of-ux-${lawId}`;
}

/**
 * @param {object | null | undefined} artifact
 * @param {{ name?: string; type?: string; size?: number; width?: number | null; height?: number | null }} [artifact.file]
 */
export function inferArchetypeIdFromArtifact(artifact) {
  if (!artifact?.file?.name) return "dashboard";
  if (lookupKnownSample(artifact.file.name)) {
    return getSampleRunByFileName(artifact.file.name).id;
  }
  const { archetypeId } = classifyLayoutArchetype(artifact.file);
  return archetypeId;
}

/**
 * @param {string} archetypeId
 * @returns {LawOfUxId[]}
 */
export function getArchetypeHighlightLaws(archetypeId) {
  return ARCHETYPE_HIGHLIGHT_LAWS[archetypeId] ?? ARCHETYPE_HIGHLIGHT_LAWS.dashboard;
}

/** @type {Record<LawOfUxId, { name: string; surface: ComplianceSurface }>} */
const LAW_META = {
  "aesthetic-usability": { name: "Aesthetic-Usability Effect", surface: "scaffold" },
  fitts: { name: "Fitts's Law", surface: "upload-flow" },
  hick: { name: "Hick's Law", surface: "upload-flow" },
  jakob: { name: "Jakob's Law", surface: "dashboard" },
  miller: { name: "Miller's Law", surface: "scaffold" },
  parkinson: { name: "Parkinson's Law", surface: "upload-flow" },
  "peak-end": { name: "Peak-End Rule", surface: "upload-flow" },
  "serial-position": { name: "Serial Position Effect", surface: "upload-flow" },
  tesler: { name: "Tesler's Law", surface: "upload-flow" },
  "von-restorff": { name: "Von Restorff Effect", surface: "scaffold" },
  doherty: { name: "Doherty Threshold", surface: "upload-flow" },
  "choice-overload": { name: "Choice Overload", surface: "catalog" },
  "cognitive-load": { name: "Cognitive Load", surface: "scaffold" },
  "goal-gradient": { name: "Goal-Gradient Effect", surface: "upload-flow" },
  chunking: { name: "Chunking", surface: "scaffold" },
};

/**
 * @param {object | null | undefined} artifact
 * @param {Array<{ title: string; body: string }>} [artifact.plan]
 * @param {string} [artifact.generatedCode]
 * @param {Array<{ label: string; value: string }>} [artifact.previewStats]
 * @param {Array<{ id: string; label: string }>} [artifact.steps]
 */
export function evaluateUxCompliance(artifact) {
  if (!artifact) return [];

  const plan = artifact.plan ?? [];
  const code = artifact.generatedCode ?? "";
  const stats = artifact.previewStats ?? [];
  const steps = artifact.steps ?? [];
  const planText = plan.map((s) => `${s.title} ${s.body}`).join(" ");
  const combined = `${planText} ${code}`.toLowerCase();

  /** @type {Array<{ id: LawOfUxId; name: string; status: ComplianceStatus; rationale: string; surface: ComplianceSurface }>} */
  const checks = [];

  checks.push({
    id: "fitts",
    ...LAW_META.fitts,
    status: /min-h-11|min-h-72|px-4 py-2\.5|rounded-lg bg-accent/.test(combined)
      ? "met"
      : "partial",
    rationale:
      "Scaffold or plan should reference large touch targets (upload zone, primary CTAs).",
  });

  checks.push({
    id: "hick",
    ...LAW_META.hick,
    status: plan.length > 0 && plan.length <= 6 ? "met" : plan.length > 8 ? "review" : "partial",
    rationale: `Plan has ${plan.length} sections — keep primary decisions staged, not overwhelming.`,
  });

  checks.push({
    id: "jakob",
    ...LAW_META.jakob,
    status: /dashboard|header|statcard|upload/i.test(combined) ? "met" : "partial",
    rationale: "Familiar dashboard/upload patterns improve learnability.",
  });

  checks.push({
    id: "miller",
    ...LAW_META.miller,
    status: plan.length >= 3 && plan.length <= 7 ? "met" : "partial",
    rationale: "Chunk analysis into roughly 7±2 plan sections for working memory.",
  });

  checks.push({
    id: "aesthetic-usability",
    ...LAW_META["aesthetic-usability"],
    status: /rounded-lg|border-border|shadow|accent/.test(combined) ? "met" : "review",
    rationale: "Tailwind card polish signals quality before deep review.",
  });

  checks.push({
    id: "serial-position",
    ...LAW_META["serial-position"],
    status: plan.length >= 2 ? "met" : "partial",
    rationale: "Lead with Visual Input and end with Human Review so endpoints stick.",
  });

  checks.push({
    id: "peak-end",
    ...LAW_META["peak-end"],
    status: steps.length >= 4 ? "met" : "partial",
    rationale: "Workflow should end on download with a clear success moment.",
  });

  checks.push({
    id: "chunking",
    ...LAW_META.chunking,
    status: plan.some((s) => s.title) ? "met" : "review",
    rationale: "Titled plan cards chunk the decomposition for reviewers.",
  });

  checks.push({
    id: "cognitive-load",
    ...LAW_META["cognitive-load"],
    status: /accessibility|semantic|aria/i.test(combined) ? "met" : "partial",
    rationale: "Accessibility pass in plan reduces extraneous cognitive load.",
  });

  checks.push({
    id: "von-restorff",
    ...LAW_META["von-restorff"],
    status: /accent|success|danger|primary/i.test(combined) ? "met" : "partial",
    rationale: "Primary actions and status colors should contrast neutral chrome.",
  });

  checks.push({
    id: "tesler",
    ...LAW_META.tesler,
    status: /demo|review|manual/i.test(combined) ? "met" : "partial",
    rationale: "Flag irreducible complexity (live API, chart libs) for human review.",
  });

  checks.push({
    id: "goal-gradient",
    ...LAW_META["goal-gradient"],
    status: steps.length >= 3 ? "met" : "partial",
    rationale: `${steps.length} workflow steps show progress toward export.`,
  });

  checks.push({
    id: "doherty",
    ...LAW_META.doherty,
    status: stats.length > 0 && stats.length <= 6 ? "met" : "partial",
    rationale: "Preview stats should load quickly without blocking the main thread.",
  });

  checks.push({
    id: "parkinson",
    ...LAW_META.parkinson,
    status: "met",
    rationale: "Bounded analyze step list prevents unbounded wait perception.",
  });

  checks.push({
    id: "choice-overload",
    ...LAW_META["choice-overload"],
    status: stats.length <= 6 ? "met" : "review",
    rationale: `${stats.length} preview stats — prefer a focused metric row.`,
  });

  return checks;
}

export function complianceSummary(checks) {
  const met = checks.filter((c) => c.status === "met").length;
  const partial = checks.filter((c) => c.status === "partial").length;
  const review = checks.filter((c) => c.status === "review").length;
  return { met, partial, review, total: checks.length };
}
