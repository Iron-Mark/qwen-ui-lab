export const DESIGN_MD_FILENAME = "DESIGN.md";

const MAX_DETECTED_ELEMENT_ROWS = 12;
const MAX_REASON_ROWS = 8;

function text(value, fallback = "") {
  return String(value ?? fallback).trim();
}

function normalizeLine(value) {
  return text(value)
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n");
}

function tableCell(value) {
  return text(value, "-")
    .replace(/\|/g, "\\|")
    .replace(/\r?\n/g, " ")
    .trim() || "-";
}

function percent(value) {
  if (typeof value !== "number" || Number.isNaN(value)) return "n/a";
  return `${Math.round(Math.max(0, Math.min(1, value)) * 100)}%`;
}

function average(values) {
  const safeValues = values.filter((value) => typeof value === "number" && !Number.isNaN(value));
  if (!safeValues.length) return null;
  return safeValues.reduce((sum, value) => sum + value, 0) / safeValues.length;
}

function confidenceBand(value) {
  if (typeof value !== "number" || Number.isNaN(value)) return "review";
  if (value >= 0.82) return "high";
  if (value >= 0.66) return "medium";
  return "review";
}

function sourceDimensions(artifact) {
  const source = artifact?.detections?.source ?? {};
  const file = artifact?.file ?? {};
  const width = source.width ?? file.width ?? null;
  const height = source.height ?? file.height ?? null;
  return width && height ? `${width} x ${height}px` : "unknown";
}

function detectionElements(artifact) {
  return Array.isArray(artifact?.detections?.elements)
    ? artifact.detections.elements
    : [];
}

function activeDetectionElements(artifact) {
  return detectionElements(artifact).filter((element) => element?.included !== false);
}

function detectionLayoutTree(artifact) {
  const tree = artifact?.detections?.layoutTree;
  return tree && typeof tree === "object" ? tree : null;
}

function exportedComponentNames(code) {
  const names = new Set();
  const source = text(code);
  const functionPattern = /export\s+(?:default\s+)?function\s+([A-Z][A-Za-z0-9_]*)/g;
  const constPattern = /export\s+const\s+([A-Z][A-Za-z0-9_]*)\s*=/g;
  for (const match of source.matchAll(functionPattern)) {
    names.add(match[1]);
  }
  for (const match of source.matchAll(constPattern)) {
    names.add(match[1]);
  }
  return [...names];
}

function summarizeComponents(elements) {
  const groups = new Map();
  for (const element of elements) {
    const name = text(element.primitive || element.kind, "component");
    const current = groups.get(name) ?? {
      count: 0,
      edited: 0,
      averageConfidence: [],
      kinds: new Set(),
    };
    current.count += 1;
    current.edited += element.userEdited ? 1 : 0;
    current.averageConfidence.push(element.confidence);
    current.kinds.add(text(element.kind, "unknown"));
    groups.set(name, current);
  }

  return [...groups.entries()]
    .map(([name, group]) => ({
      name,
      count: group.count,
      edited: group.edited,
      confidence: average(group.averageConfidence),
      kinds: [...group.kinds].join(", "),
    }))
    .sort((first, second) => {
      if (second.count !== first.count) return second.count - first.count;
      return first.name.localeCompare(second.name);
    });
}

function summarizeReasons(elements) {
  const counts = new Map();
  const weights = new Map();
  for (const element of elements) {
    for (const reason of element.reasons ?? []) {
      const label = text(reason.label || reason.code, "Detector signal");
      counts.set(label, (counts.get(label) ?? 0) + 1);
      weights.set(label, (weights.get(label) ?? 0) + (Number(reason.weight) || 0));
    }
  }

  return [...counts.keys()]
    .map((label) => ({
      label,
      count: counts.get(label) ?? 0,
      weight: weights.get(label) ?? 0,
    }))
    .sort((first, second) => {
      if (second.weight !== first.weight) return second.weight - first.weight;
      return second.count - first.count;
    })
    .slice(0, MAX_REASON_ROWS);
}

function layoutBandSummary(artifact, elements) {
  const height =
    artifact?.detections?.source?.height ??
    artifact?.file?.height ??
    800;
  const rowHeight = Math.max(80, Math.round(height / 8));
  const buckets = new Map();

  for (const element of elements) {
    const y = Number(element?.box?.y) || 0;
    const key = Math.floor(y / rowHeight);
    buckets.set(key, (buckets.get(key) ?? 0) + 1);
  }

  const repeatedRows = [...buckets.values()].filter((count) => count >= 3).length;
  const tree = detectionLayoutTree(artifact);
  const treeGroups = Array.isArray(tree?.groups)
    ? tree.groups.length
    : buckets.size;

  return {
    bands: buckets.size,
    repeatedRows,
    treeGroups,
    rowHeight,
  };
}

function renderList(items) {
  if (!items.length) return "- None";
  return items.map((item) => `- ${item}`).join("\n");
}

function renderPlan(plan) {
  if (!Array.isArray(plan) || !plan.length) {
    return "No plan sections were generated.";
  }

  return plan
    .map(
      (section, index) =>
        `${index + 1}. ${text(section.title, "Plan section")}\n   ${normalizeLine(section.body)}`,
    )
    .join("\n");
}

function renderStats(stats) {
  if (!Array.isArray(stats) || !stats.length) return "- None";
  return stats
    .map((stat) => `- ${text(stat.label, "Metric")}: ${text(stat.value, "n/a")}`)
    .join("\n");
}

function renderTokens(tokens) {
  if (!tokens || typeof tokens !== "object") {
    return "No design tokens were detected.";
  }

  const entries = Object.entries(tokens).filter(([, value]) => text(value));
  if (!entries.length) return "No design tokens were detected.";

  return [
    "| Token | Value |",
    "| --- | --- |",
    ...entries.map(([key, value]) => `| ${tableCell(key)} | ${tableCell(value)} |`),
  ].join("\n");
}

function renderComponentInventory(components) {
  if (!components.length) {
    return "No active detection boxes were available. Review the generated code directly.";
  }

  return [
    "| Primitive | Count | Avg confidence | Source kinds | Edited |",
    "| --- | ---: | ---: | --- | ---: |",
    ...components.map(
      (component) =>
        `| ${tableCell(component.name)} | ${component.count} | ${percent(component.confidence)} | ${tableCell(component.kinds)} | ${component.edited} |`,
    ),
  ].join("\n");
}

function renderReasonSummary(reasons) {
  if (!reasons.length) {
    return "No confidence reasons were attached to detected elements.";
  }

  return [
    "| Signal | Elements | Weight |",
    "| --- | ---: | ---: |",
    ...reasons.map(
      (reason) =>
        `| ${tableCell(reason.label)} | ${reason.count} | ${reason.weight.toFixed(2)} |`,
    ),
  ].join("\n");
}

function renderDetectedElements(elements) {
  if (!elements.length) return "No active detection boxes were available.";

  return [
    "| Order | Element | Primitive | Confidence | Box | Reasons |",
    "| ---: | --- | --- | ---: | --- | --- |",
    ...elements.slice(0, MAX_DETECTED_ELEMENT_ROWS).map((element, index) => {
      const box = element.box ?? {};
      const reasons = (element.reasons ?? [])
        .slice(0, 2)
        .map((reason) => text(reason.label || reason.code))
        .filter(Boolean)
        .join(", ");
      return `| ${index + 1} | ${tableCell(element.kind)} | ${tableCell(
        element.primitive || element.kind,
      )} | ${percent(element.confidence)} | ${tableCell(
        `${Math.round(Number(box.x) || 0)},${Math.round(Number(box.y) || 0)},${Math.round(Number(box.width) || 0)}x${Math.round(Number(box.height) || 0)}`,
      )} | ${tableCell(reasons)} |`;
    }),
  ].join("\n");
}

/**
 * Build deterministic DESIGN.md notes from the current analysis artifact.
 * The algorithm uses detected geometry, primitive snapping, and confidence
 * reasons so the document follows user edits and offline detector results.
 *
 * @param {{
 *   artifact: {
 *     file?: { name?: string; type?: string; size?: number; readableSize?: string; width?: number | null; height?: number | null };
 *     steps?: Array<{ id: string; label: string }>;
 *     plan?: Array<{ title: string; body: string }>;
 *     previewStats?: Array<{ label: string; value: string }>;
 *     generatedCode?: string;
 *     modeLabel?: string;
 *     summary?: string;
 *     detections?: {
 *       source?: { width?: number | null; height?: number | null };
 *       designTokens?: Record<string, unknown> | null;
 *       elements?: Array<{
 *         id?: string;
 *         kind?: string;
 *         primitive?: string;
 *         confidence?: number;
 *         included?: boolean;
 *         userEdited?: boolean;
 *         reasons?: Array<{ code?: string; label?: string; evidence?: string; weight?: number }>;
 *         box?: { x?: number; y?: number; width?: number; height?: number };
 *       }>;
 *       layoutTree?: unknown;
 *       quality?: { confidence?: number; ambiguity?: string; elementCount?: number; strategy?: string } | null;
 *     };
 *   };
 *   componentFilename?: string;
 *   exportedAt?: string;
 * }} args
 */
export function buildDesignMarkdown({
  artifact,
  componentFilename = "generated-component.tsx",
  exportedAt = new Date().toISOString(),
}) {
  const allElements = detectionElements(artifact);
  const activeElements = activeDetectionElements(artifact);
  const components = summarizeComponents(activeElements);
  const reasonSummary = summarizeReasons(allElements);
  const averageConfidence = average(activeElements.map((element) => element.confidence));
  const tree = detectionLayoutTree(artifact);
  const qualityConfidence =
    typeof artifact?.detections?.quality?.confidence === "number"
      ? artifact.detections.quality.confidence
      : averageConfidence;
  const layout = layoutBandSummary(artifact, activeElements);
  const componentNames = exportedComponentNames(artifact?.generatedCode).join(", ") || "Review generated export";
  const excludedCount = allElements.length - activeElements.length;
  const editedCount = allElements.filter((element) => element.userEdited).length;
  const algorithmNotes = [
    `Primitive snapping grouped ${activeElements.length} active detections into ${components.length} component families.`,
    `Reading order uses top-to-bottom, left-to-right geometry across ${layout.bands} visual bands.`,
    `Repeated-list detection found ${layout.repeatedRows} dense row group${layout.repeatedRows === 1 ? "" : "s"}.`,
    `Layout tree strategy: ${text(tree?.strategy || artifact?.detections?.quality?.strategy, "not available")}.`,
  ];
  const e2eChecklist = [
    "Upload or paste the source screenshot.",
    `Assert ${artifact?.plan?.length ?? 0} generated plan card${artifact?.plan?.length === 1 ? "" : "s"} render.`,
    `Download ${componentFilename} and verify it contains ${componentNames}.`,
    `Download ${DESIGN_MD_FILENAME} and verify component inventory plus detector signals are present.`,
    activeElements.length
      ? `Assert ${activeElements.length} active detection box${activeElements.length === 1 ? "" : "es"} remain visible before generation.`
      : "Run a manual visual review because no detection boxes were available.",
  ];

  return [
    "# DESIGN.md",
    "",
    "## Screen Summary",
    "",
    `- Source file: ${text(artifact?.file?.name, "uploaded screenshot")}`,
    `- Source type: ${text(artifact?.file?.type, "unknown")}`,
    `- Source size: ${text(artifact?.file?.readableSize, "unknown")}`,
    `- Source dimensions: ${sourceDimensions(artifact)}`,
    `- Analysis mode: ${text(artifact?.modeLabel, "unknown")}`,
    `- Exported at: ${exportedAt}`,
    `- Component file: ${componentFilename}`,
    `- Exported components: ${componentNames}`,
    "",
    normalizeLine(artifact?.summary)
      ? `> ${normalizeLine(artifact.summary).replace(/\n/g, "\n> ")}`
      : "> No summary was generated.",
    "",
    "## Confidence",
    "",
    `- Average active confidence: ${percent(averageConfidence)} (${confidenceBand(averageConfidence)})`,
    `- Detector quality confidence: ${percent(qualityConfidence)} (${confidenceBand(qualityConfidence)})`,
    `- Active elements: ${activeElements.length}`,
    `- Excluded elements: ${excludedCount}`,
    `- User-edited elements: ${editedCount}`,
    `- Ambiguity: ${text(artifact?.detections?.quality?.ambiguity, "not reported")}`,
    "",
    "## Algorithm Notes",
    "",
    renderList(algorithmNotes),
    "",
    "## Component Inventory",
    "",
    renderComponentInventory(components),
    "",
    "## Design Tokens",
    "",
    renderTokens(artifact?.detections?.designTokens),
    "",
    "## Plan",
    "",
    renderPlan(artifact?.plan),
    "",
    "## Preview Metrics",
    "",
    renderStats(artifact?.previewStats),
    "",
    "## Detector Signals",
    "",
    renderReasonSummary(reasonSummary),
    "",
    "## Detected Elements",
    "",
    renderDetectedElements(activeElements),
    "",
    "## E2E Contract",
    "",
    renderList(e2eChecklist),
    "",
    "## Review Notes",
    "",
    "- Generated code needs review for imports, data wiring, and accessibility before production.",
    "- Detection boxes reflect the current browser session, including user edits and excluded elements.",
    "- Use the component inventory as a checklist for replacing scaffold primitives with app-specific components.",
    "",
  ].join("\n");
}
