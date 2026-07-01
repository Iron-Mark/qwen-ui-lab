import { createHash } from "node:crypto";

export const SCAFFOLD_RECIPE_SCHEMA = "qwen-ui-lab/scaffold-recipe@1";

/**
 * @param {string} content
 */
export function extractProductionScaffoldBlueprint(content) {
  const source = String(content || "");
  const designTokens = readJsonConst(source, "designTokens");
  const detectedElements = readJsonConst(source, "detectedElements");
  const detectedPatterns = readJsonConst(source, "detectedPatterns");
  const responsiveIntent = readJsonConst(source, "responsiveIntent");
  const screenIntent = readJsonConst(source, "screenIntent");
  const layoutRegions = readJsonConst(source, "layoutRegions");
  const shadcnPrimitiveMap = readJsonConst(source, "shadcnPrimitiveMap");
  const correctionSummary = readJsonConst(source, "correctionSummary");

  if (
    !designTokens &&
    !detectedElements &&
    !detectedPatterns &&
    !layoutRegions &&
    !screenIntent
  ) {
    return null;
  }

  const primitiveSummary = summarizeRecipePrimitives({
    detectedElements,
    layoutRegions,
    detectedPatterns,
  });

  return {
    schema: SCAFFOLD_RECIPE_SCHEMA,
    generator: "offline-detection",
    sourceHash: hashContent(source),
    componentName: inferGeneratedComponentName(source),
    designTokens: designTokens ?? {},
    screenIntent: screenIntent ?? null,
    responsiveIntent: responsiveIntent ?? null,
    detectedPatterns: detectedPatterns ?? {},
    detectedElements: Array.isArray(detectedElements) ? detectedElements : [],
    layoutRegions: Array.isArray(layoutRegions) ? layoutRegions : [],
    shadcnPrimitiveMap: shadcnPrimitiveMap ?? {},
    correctionSummary: normalizeCorrectionSummary(correctionSummary, detectedElements),
    primitiveSummary,
    reviewChecklist: buildReviewChecklist({
      detectedElements,
      detectedPatterns,
      layoutRegions,
      primitiveSummary,
    }),
  };
}

function normalizeCorrectionSummary(correctionSummary, detectedElements) {
  const elements = Array.isArray(detectedElements) ? detectedElements : [];
  const fallback = {
    activeElements: elements.filter((element) => element.included !== false).length,
    appliedEdits: elements.filter((element) => element.userEdited === true).length,
    excludedBoxes: elements.filter((element) => element.included === false).length,
    sourceOfTruth: "Detection boxes are the source of truth for this regenerated scaffold.",
  };

  if (!correctionSummary || typeof correctionSummary !== "object") {
    return fallback;
  }

  return {
    activeElements:
      typeof correctionSummary.activeElements === "number"
        ? correctionSummary.activeElements
        : fallback.activeElements,
    appliedEdits:
      typeof correctionSummary.appliedEdits === "number"
        ? correctionSummary.appliedEdits
        : fallback.appliedEdits,
    excludedBoxes:
      typeof correctionSummary.excludedBoxes === "number"
        ? correctionSummary.excludedBoxes
        : fallback.excludedBoxes,
    sourceOfTruth:
      typeof correctionSummary.sourceOfTruth === "string" &&
      correctionSummary.sourceOfTruth.trim()
        ? correctionSummary.sourceOfTruth
        : fallback.sourceOfTruth,
  };
}

export function hashContent(content) {
  return createHash("sha256").update(String(content || "")).digest("hex");
}

export function inferGeneratedComponentName(source) {
  const defaultMatch = /export\s+default\s+function\s+([A-Za-z_$][\w$]*)/.exec(source);
  if (defaultMatch) return defaultMatch[1];
  const namedMatch = /export\s+function\s+([A-Za-z_$][\w$]*)/.exec(source);
  return namedMatch?.[1] ?? "GeneratedComponent";
}

function readJsonConst(source, name) {
  const raw = readConstLiteral(source, name);
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    try {
      return JSON.parse(stripJsonTrailingCommas(raw));
    } catch {
      return null;
    }
  }
}

function readConstLiteral(source, name) {
  const declaration = new RegExp(
    `\\bconst\\s+${escapeRegExp(name)}(?:\\s*:\\s*[^=]+)?\\s*=\\s*`,
    "m",
  );
  const match = declaration.exec(source);
  if (!match) return null;

  const valueStart = match.index + match[0].length;
  const opener = source[valueStart];
  const closer = opener === "{" ? "}" : opener === "[" ? "]" : null;
  if (!closer) return null;

  let depth = 0;
  let quote = "";
  let escaped = false;
  for (let index = valueStart; index < source.length; index += 1) {
    const char = source[index];
    if (quote) {
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === quote) {
        quote = "";
      }
      continue;
    }

    if (char === '"' || char === "'") {
      quote = char;
      continue;
    }
    if (char === opener) {
      depth += 1;
      continue;
    }
    if (char === closer) {
      depth -= 1;
      if (depth === 0) {
        return source.slice(valueStart, index + 1).trim();
      }
    }
  }

  return null;
}

function stripJsonTrailingCommas(value) {
  return value.replace(/,\s*([}\]])/g, "$1");
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function summarizeRecipePrimitives({ detectedElements, layoutRegions, detectedPatterns }) {
  const primitiveCounts = new Map();
  const regionItems = Array.isArray(layoutRegions) ? layoutRegions : [];
  const elementItems = Array.isArray(detectedElements) ? detectedElements : [];
  const summaryItems = regionItems.length ? regionItems : elementItems;
  for (const item of summaryItems) {
    const key = item.componentRole || item.primitive || item.kind;
    if (!key) continue;
    primitiveCounts.set(key, (primitiveCounts.get(key) ?? 0) + 1);
  }

  return {
    primitives: Object.fromEntries([...primitiveCounts.entries()].sort()),
    patternCounts: Object.fromEntries(
      Object.entries(detectedPatterns ?? {})
        .filter(([, value]) => Array.isArray(value) || typeof value === "number")
        .map(([key, value]) => [key, Array.isArray(value) ? value.length : value])
        .sort(([first], [second]) => first.localeCompare(second)),
    ),
  };
}

function buildReviewChecklist({
  detectedElements,
  detectedPatterns,
  layoutRegions,
  primitiveSummary,
}) {
  const elements = Array.isArray(detectedElements) ? detectedElements : [];
  const regions = Array.isArray(layoutRegions) ? layoutRegions : [];
  const patterns = detectedPatterns ?? {};
  const checklist = [
    `Review ${elements.length} detected element${elements.length === 1 ? "" : "s"} against the source screenshot.`,
    "Keep semantic landmarks, visible labels, focus states, and keyboard order while wiring real data.",
    "Use the recipe JSON as the deterministic source for future correction/regeneration.",
  ];

  if (regions.length) {
    checklist.push(
      `Validate ${regions.length} generated layout region${regions.length === 1 ? "" : "s"} before deleting or merging sections.`,
    );
  }
  if ((patterns.dataTables ?? []).length) {
    checklist.push("Replace sample table rows with typed data and accessible column headers.");
  }
  if ((patterns.formGroups ?? []).length) {
    checklist.push("Connect form fields to validation, helper text, and submit states.");
  }
  if ((patterns.dialogPanels ?? []).length) {
    checklist.push("Move dialog regions into real Dialog components with focus management.");
  }
  if ((patterns.charts ?? []).length) {
    checklist.push("Replace chart placeholders with chart data, labels, and text summaries.");
  }
  if (Object.keys(primitiveSummary?.primitives ?? {}).length === 0) {
    checklist.push(
      "No primitive summary was available; verify imports, controls, and semantic wrappers before import.",
    );
  }

  return checklist;
}
