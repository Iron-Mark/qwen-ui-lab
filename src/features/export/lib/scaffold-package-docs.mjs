export const DEFAULT_EXPORT_SOURCE_REPO = "Iron-Mark/qwen-ui-lab";
const DEFAULT_REVIEW_BASIS =
  "Detection boxes and review edits are captured in the recipe JSON.";
export { DEFAULT_EXPORT_PACKAGE_DESCRIPTION } from "./export-package-constants.mjs";
const EXPORT_PACKAGE_SCHEMA = "qwen-ui-lab/export-package@1";
const EXPORT_README_TITLE = "Screenshot-to-React starter package";
const STARTER_PACKAGE_INTRO =
  "Use this as a starter package: place the files in your app, connect product data, and compare the screen against the uploaded screenshot.";
const RICH_PACKAGE_INTRO =
  "This package turns the screenshot analysis into files you can compare, adapt, and iterate in your app. Treat it as a starter package that still needs product data and visual parity checks.";

export function buildScaffoldReadme({
  filename,
  description = DEFAULT_EXPORT_PACKAGE_DESCRIPTION,
  sourceRepo = DEFAULT_EXPORT_SOURCE_REPO,
}) {
  return `# ${EXPORT_README_TITLE}

${description}

${STARTER_PACKAGE_INTRO}

## Files

- \`README.md\` - package overview and integration checklist
- \`DESIGN.md\` - design notes, review items, and responsive assumptions
- \`${filename}\` - React + Tailwind starter component

## Next steps

1. Unzip this export package into your app.
2. Install any missing dependencies referenced by the component.
3. Adjust imports and routes to match your project structure.
4. Review the design notes and detection notes before connecting the component to a route.

Exported from [qwen-ui-lab](https://github.com/${sourceRepo}).
`;
}

export function buildProductionScaffoldReadme({
  description = DEFAULT_EXPORT_PACKAGE_DESCRIPTION,
  files,
  componentName,
  blueprint,
  dependencies = [],
  inventory = [],
  sourceRepo = DEFAULT_EXPORT_SOURCE_REPO,
}) {
  files = normalizePackageFiles(files);
  dependencies = normalizeDependencies(dependencies);
  const designDoc = files.designDoc;
  componentName = normalizeComponentName(componentName);
  const screenIntent = blueprint?.screenIntent?.label ?? "Screenshot starter";
  const regionCount = blueprint?.layoutRegions?.length ?? 0;
  const elementCount = blueprint?.detectedElements?.length ?? 0;
  const primitiveCount = Object.keys(blueprint?.shadcnPrimitiveMap ?? {}).length;
  const primitiveMappingNoun = `shadcn-style primitive mapping${primitiveCount === 1 ? "" : "s"}`;
  const primitiveMappingVerb = primitiveCount === 1 ? "was" : "were";
  const responsiveMode = blueprint?.responsiveIntent?.mode ?? "responsive layout";
  const correctionSummary = summarizeReviewChanges(blueprint);
  const reviewSummary = summarizeUnresolvedReviewNotes(blueprint);

  return `# ${EXPORT_README_TITLE}

${description}

${RICH_PACKAGE_INTRO}

## What this package is

- A React + Tailwind starting point based on the uploaded screenshot.
- A rebuild recipe that records detected regions, primitive mappings, and review edits.
- Design and detection notes for integration and verification.

## What this package still needs

- It does not include the original screenshot, user data, secrets, or product data adapters.
- Visual parity, accessibility, responsive layout, and product data states still need verification.

${buildReviewContractMarkdown({ files })}

## What changed from the screenshot

- Screen intent: ${screenIntent}
- ${regionCount} layout region${regionCount === 1 ? "" : "s"} and ${elementCount} detected element${elementCount === 1 ? "" : "s"} were converted into React sections.
- ${primitiveCount} ${primitiveMappingNoun} ${primitiveMappingVerb} included for verification.
- Responsive mode: ${responsiveMode}
- Review changes: ${correctionSummary}
- Verification notes: ${reviewSummary}

## Files

- \`${designDoc}\` - design notes, layout decisions, and review checklist
- \`${files.component}\` - React + Tailwind component entry point (\`${componentName}\`)
- \`${files.recipe}\` - detection recipe, primitive map, and rebuild settings
- \`${files.manifest}\` - package identity, dependency hints, and quality gates
- \`${files.tokens}\` - CSS variables derived from the screenshot palette
- \`${files.detectionSummary}\` - detection notes, confidence summary, and integration checklist

## Package inventory

${formatPackageInventory(inventory)}

${buildQuickImportMarkdown({ files, componentName })}

${buildImportReadinessMarkdown({ dependencies, files })}

## Expected dependencies

${dependencies.length ? dependencies.map((item) => `- \`${item}\``).join("\n") : "- No shadcn dependencies were inferred."}

## Integration checklist

1. Copy \`src/components/starters/\` into your app.
2. Add the exported component to the route or page where it belongs.
3. Replace starter content with real product data.
4. Keep the recipe JSON during integration so edits can be compared against the screenshot-derived source.
5. Verify keyboard order, visible focus, labels, empty/loading/error states, and color contrast.
6. Run lint/build and verify mobile, tablet, and desktop widths.

Exported from [qwen-ui-lab](https://github.com/${sourceRepo}).
`;
}

export function buildFallbackPackageReadme({
  description = DEFAULT_EXPORT_PACKAGE_DESCRIPTION,
  files,
  componentName,
  dependencies = [],
  inventory = [],
  sourceRepo = DEFAULT_EXPORT_SOURCE_REPO,
}) {
  files = normalizePackageFiles(files);
  dependencies = normalizeDependencies(dependencies);
  const designDoc = files.designDoc;
  componentName = normalizeComponentName(componentName);

  return `# ${EXPORT_README_TITLE}

${description}

${STARTER_PACKAGE_INTRO}

## What this package is

- A starter component file plus supporting integration documents.
- A portable starter for adapting screenshot-inspired UI inside your app.
- A portable export package with recipe, manifest, tokens, and detection notes.

## What this package still needs

- It does not include the original screenshot, user data, secrets, or product data adapters.
- Visual parity, accessibility, responsive layout, and product data states still need verification.

${buildReviewContractMarkdown({ files })}

## What changed from the screenshot

- The starter component was packaged with integration metadata.
- No detection-box edits were included with this component package.
- Compare the component against the screenshot before connecting it to a route.

## Files

- \`README.md\` - package overview and integration checklist
- \`${designDoc}\` - design notes, review items, and responsive assumptions
- \`${files.component}\` - React + Tailwind component entry point (\`${componentName}\`)
- \`${files.recipe}\` - rebuild recipe and package context
- \`${files.manifest}\` - package manifest and quality gates
- \`${files.tokens}\` - theme token file
- \`${files.detectionSummary}\` - detection and review notes

## Package inventory

${formatPackageInventory(inventory)}

${buildQuickImportMarkdown({ files, componentName })}

${buildImportReadinessMarkdown({ dependencies, files })}

## Expected dependencies

${dependencies.length ? dependencies.map((item) => `- \`${item}\``).join("\n") : "- No shadcn dependencies were inferred."}

## Next steps

1. Unzip this export package into your app.
2. Install any missing dependencies referenced by the component.
3. Adjust imports and routes to match your project structure.
4. Review \`DESIGN.md\` and the detection notes before connecting the component to a route.
5. Verify keyboard order, focus states, responsive behavior, and real empty/loading/error states.

Exported from [qwen-ui-lab](https://github.com/${sourceRepo}).
`;
}

export function buildDetectionSummaryMarkdown(blueprint) {
  const regions = blueprint.layoutRegions ?? [];
  const elements = blueprint.detectedElements ?? [];
  const patterns = blueprint.detectedPatterns ?? {};
  const reviewChecklist = Array.isArray(blueprint.reviewChecklist)
    ? blueprint.reviewChecklist
    : [];
  const primitiveLines = Object.entries(blueprint.shadcnPrimitiveMap ?? {})
    .sort(([first], [second]) => first.localeCompare(second))
    .map(([primitive, mapping]) => `- ${primitive}: ${mapping}`)
    .join("\n");
  const patternLines = Object.entries(patterns)
    .filter(([, value]) => Array.isArray(value) || typeof value === "number")
    .map(([key, value]) => {
      const count = Array.isArray(value) ? value.length : value;
      return `- ${key}: ${count}`;
    })
    .join("\n");
  const regionLines = regions
    .slice(0, 12)
    .map(
      (region) =>
        `- ${region.kind ?? region.primitive ?? "region"}: ${region.componentRole ?? region.primitive ?? "section"} (${Math.round((region.confidence ?? region.patternConfidence ?? 0.5) * 100)}%)`,
    )
    .join("\n");
  const elementLines = elements
    .slice(0, 12)
    .map((element) => {
      const role = element.componentRole ?? element.primitive ?? element.kind ?? "element";
      const confidence = Math.round((element.confidence ?? element.patternConfidence ?? 0.5) * 100);
      const reason = element.reason ?? element.explanation ?? element.detectionReason;
      return `- ${role}: ${confidence}%${reason ? ` - ${reason}` : ""}`;
    })
    .join("\n");
  const confidenceSummary = summarizeConfidenceBands([...regions, ...elements]);
  const reviewEditNotes = buildReviewEditNotes(elements);
  const correctionMetadata = blueprint.correctionSummary;
  const lowConfidenceReviewQueue = buildLowConfidenceReviewQueue([...regions, ...elements]);
  const confidenceReasonSummary = buildConfidenceReasonSummary(elements);

  return `# Detection summary

This file explains how the uploaded screenshot was translated into the starter component. Use it to review confidence, decide which sections need product data, and rebuild the starter consistently.

## Screen intent

${blueprint.screenIntent?.label ?? "Unknown screen intent"}${
    typeof blueprint.screenIntent?.confidence === "number"
      ? ` (${Math.round(blueprint.screenIntent.confidence * 100)}% confidence)`
      : ""
  }

## What changed from the screenshot

- Visible regions were grouped into ${regions.length} layout region${regions.length === 1 ? "" : "s"}.
- ${elements.length} detected element${elements.length === 1 ? "" : "s"} were mapped to component roles.
- Primitive mappings were exported so the component can move toward shadcn-style UI without guessing later.
- The recipe and manifest keep integration tied to the screenshot-derived decisions.

## Confidence summary

- High confidence: ${confidenceSummary.high}
- Medium confidence: ${confidenceSummary.medium}
- Low confidence: ${confidenceSummary.low}
- Unknown confidence: ${confidenceSummary.unknown}

## Low-confidence review queue

${lowConfidenceReviewQueue}

## Why elements were detected

${confidenceReasonSummary}

## Review changes

- Active elements: ${correctionMetadata?.activeElements ?? elements.filter((element) => element.included !== false).length}
- Applied edits: ${correctionMetadata?.appliedEdits ?? elements.filter((element) => element.userEdited === true).length}
- Omitted boxes: ${correctionMetadata?.excludedBoxes ?? elements.filter((element) => element.included === false).length}
- Rebuild guide: ${correctionMetadata?.sourceOfTruth ?? DEFAULT_REVIEW_BASIS}

${reviewEditNotes}

## Review notes

- Treat \`${blueprint.files?.recipe ?? "the recipe JSON"}\` as the rebuild recipe until visual verification is complete.
- Keep this detection note with the package when any low-confidence or edited boxes remain.
- Do not delete omitted boxes from the recipe unless the reviewer confirms they are decorative or intentionally out of scope.

## Responsive intent

- Mode: ${blueprint.responsiveIntent?.mode ?? "unknown"}
- Breakpoints: ${(blueprint.responsiveIntent?.breakpoints ?? []).join(", ") || "base"}
- Primary flow: ${blueprint.responsiveIntent?.primaryFlow ?? "Compare the layout against the screenshot at mobile, tablet, and desktop widths."}

## Pattern counts

${patternLines || "- No grouped patterns were exported."}

## Primitive mapping

${primitiveLines || "- No shadcn primitive map was exported."}

## Regions

${regionLines || "- No layout regions were exported."}

## Detected elements

${elementLines || "- No detected elements were exported."}

## Integration notes

${reviewChecklist.length ? reviewChecklist.map((item) => `- ${item}`).join("\n") : "- Validate the starter against the source screenshot before connecting product data."}
`;
}

export function buildPackageDesignMarkdown({
  description = "React export package",
  files,
  componentName,
  blueprint,
  dependencies = [],
}) {
  files = normalizePackageFiles(files);
  dependencies = normalizeDependencies(dependencies);
  componentName = normalizeComponentName(componentName);
  const screenIntent = blueprint?.screenIntent?.label ?? "Screenshot starter";
  const responsiveIntent = blueprint?.responsiveIntent;
  const primitiveMap = Object.entries(blueprint?.shadcnPrimitiveMap ?? {})
    .sort(([first], [second]) => first.localeCompare(second))
    .map(([primitive, reason]) => `- ${primitive}: ${reason}`)
    .join("\n");
  const reviewChecklist = blueprint?.reviewChecklist?.length
    ? blueprint.reviewChecklist.map((item) => `- ${item}`).join("\n")
    : "- Review the starter component against the source screenshot.";
  const correctionSummary = formatReviewChangesSection(blueprint);

  return `# Design notes

${description}

## Component

- Name: \`${componentName}\`
- Entry: \`${files.component}\`
- Intent: ${screenIntent}

## Layout decisions

- The starter component is structured as portable project files, not a pixel-for-pixel screenshot copy.
- Repeated regions should remain as small subcomponents when you adapt the code.
- Token values are isolated in \`${files.tokens}\` so visual tuning can happen without rewriting component structure.

## Responsive assumptions

- Mode: ${responsiveIntent?.mode ?? "responsive starter"}
- Breakpoints: ${(responsiveIntent?.breakpoints ?? ["mobile", "tablet", "desktop"]).join(", ")}
- Primary flow: ${responsiveIntent?.primaryFlow ?? "Compare mobile, tablet, and desktop layouts against the source screenshot."}

## Review changes

${correctionSummary}

${buildReviewContractMarkdown({ files })}

## Primitive mapping

${primitiveMap || "- No shadcn-style primitive map was inferred. Verify imports, controls, and semantic wrappers during review."}

## Package contents

- \`${files.component}\` - component source
- \`${files.recipe}\` - rebuild recipe
- \`${files.manifest}\` - package manifest
- \`${files.tokens}\` - token CSS
- \`${files.detectionSummary}\` - detection notes

${buildQuickImportMarkdown({ files, componentName })}

${buildImportReadinessMarkdown({ dependencies, files })}

## Dependencies

${dependencies.length ? dependencies.map((item) => `- \`${item}\``).join("\n") : "- No shadcn dependencies were inferred."}

## Review checklist

${reviewChecklist}

## Accessibility and state checks

- Confirm interactive controls have visible labels and keyboard focus.
- Add real loading, empty, and error states for data-backed sections.
- Check color contrast after replacing starter content and tokens.
`;
}

export function buildProductionManifest({ blueprint, dependencies, files, stem }) {
  files = normalizePackageFiles(files);
  const designDoc = files.designDoc;
  const sourceHash =
    typeof blueprint.sourceHash === "string" && blueprint.sourceHash.trim()
      ? blueprint.sourceHash.trim()
      : "unknown-source";

  return {
    schema: EXPORT_PACKAGE_SCHEMA,
    packageId: `qwen-${sourceHash.slice(0, 12)}`,
    generator: blueprint.generator,
    sourceHash,
    component: {
      name: normalizeComponentName(blueprint.componentName),
      importPath: `@/components/starters/${stem}`,
    },
    files: {
      ...files,
      designDoc,
    },
    dependencies,
    contents: {
      includesOriginalImage: false,
      includesSecrets: false,
      includesOfflineDetectionMetadata: true,
    },
    corrections: {
      activeElements: blueprint.correctionSummary?.activeElements ?? 0,
      appliedEdits: blueprint.correctionSummary?.appliedEdits ?? 0,
      excludedBoxes: blueprint.correctionSummary?.excludedBoxes ?? 0,
      sourceOfTruth:
        blueprint.correctionSummary?.sourceOfTruth ??
        DEFAULT_REVIEW_BASIS,
    },
    reviewContract: {
      keepFilesUntilReviewComplete: [
        designDoc,
        files.recipe,
        files.manifest,
        files.detectionSummary,
      ],
      requiredChecks: [
        "visual parity",
        "keyboard focus",
        "responsive layout",
        "product data states",
        "lint/build",
      ],
      safeToRemoveSupportFilesAfter:
        "Visual parity, accessibility, responsive layout, and product data states are verified.",
    },
    qualityGates: [
      "Compare the placed starter against the source screenshot.",
      "Review detection summary, low-confidence regions, and edited boxes.",
      "Replace starter data and copy with product-owned content.",
      "Add or verify loading, empty, error, and keyboard focus states.",
      "Run app lint/build after placing the starter.",
      "Verify responsive layout at mobile, tablet, and desktop widths.",
    ],
  };
}

function formatPackageInventory(inventory) {
  const rows = normalizeInventoryRows(inventory);

  if (!rows.length) {
    return "- Inventory unavailable. Verify README.md, DESIGN.md, component TSX, recipe JSON, manifest JSON, tokens CSS, and detection notes during integration.";
  }

  return [
    "| File | Size | Lines |",
    "| --- | ---: | ---: |",
    ...rows.map((item) => `| \`${item.path}\` | ${formatBytes(item.bytes)} | ${item.lines} |`),
  ].join("\n");
}

function normalizeInventoryRows(inventory) {
  if (!Array.isArray(inventory)) return [];

  return inventory
    .map((item) => {
      const path = String(item?.path || "").trim();
      if (!path) return null;
      return {
        path,
        bytes: Number(item?.bytes) > 0 ? Number(item.bytes) : 0,
        lines: Number(item?.lines) > 0 ? Math.floor(Number(item.lines)) : 0,
      };
    })
    .filter(Boolean);
}

function buildQuickImportMarkdown({ files, componentName }) {
  files = normalizePackageFiles(files);
  const importPath = `@/${String(files.component || "")
    .replace(/^src\//, "")
    .replace(/\.tsx$/, "")}`;
  const safeComponentName = normalizeComponentName(componentName);

  return `## Project integration

\`\`\`tsx
import ${safeComponentName} from "${importPath}";

export default function Screen() {
  return <${safeComponentName} />;
}
\`\`\`

Use this wiring example when placing the starter in your app. Keep \`${files.recipe}\`, \`${files.manifest}\`, and \`${files.detectionSummary}\` with the starter until visual verification is complete.`;
}

function buildImportReadinessMarkdown({ dependencies, files }) {
  files = normalizePackageFiles(files);
  dependencies = normalizeDependencies(dependencies);
  const dependencyLine = dependencies.length
    ? dependencies.map((item) => `\`${item}\``).join(", ")
    : "No shadcn component imports were inferred; verify imports and primitive wrappers during review.";

  return `## Package readiness

- Required UI imports: ${dependencyLine}
- Place \`${files.component}\`, \`${files.tokens}\`, and the supporting docs together in your app.
- Keep \`${files.recipe}\` and \`${files.manifest}\` until screenshot parity, accessibility, and responsive checks pass.
- Run lint/build after placing the starter and verify mobile, tablet, and desktop widths.`;
}

function buildReviewContractMarkdown({ files }) {
  files = normalizePackageFiles(files);
  const designDoc = files.designDoc;

  return `## Review contract

- Keep \`${files.recipe}\`, \`${files.manifest}\`, and \`${files.detectionSummary}\` with the starter until verification is complete.
- Compare the placed component against the screenshot.
- Verify keyboard focus, labels, responsive layout, and real loading/empty/error states.
- After verification, keep \`${designDoc}\` if it helps future maintenance; support files can be removed once their decisions are captured in app code or tests.`;
}

function normalizePackageFiles(files) {
  const component = files?.component || "src/components/starters/starter-component.tsx";
  const stem = componentStemFromPath(component);

  return {
    designDoc: files?.designDoc || "DESIGN.md",
    component,
    recipe: files?.recipe || `src/components/starters/${stem}.recipe.json`,
    manifest: files?.manifest || `src/components/starters/${stem}.manifest.json`,
    tokens: files?.tokens || `src/components/starters/${stem}.tokens.css`,
    detectionSummary: files?.detectionSummary || `docs/${stem}.detection.md`,
  };
}

function componentStemFromPath(component) {
  const basename = String(component || "starter-component.tsx")
    .split(/[\\/]/)
    .filter(Boolean)
    .pop() ?? "starter-component.tsx";
  return basename.replace(/\.tsx$/i, "") || "starter-component";
}

function normalizeComponentName(componentName) {
  const value = String(componentName || "").trim();
  return /^[A-Z][A-Za-z0-9_]*$/.test(value) ? value : "StarterComponent";
}

function normalizeDependencies(dependencies) {
  if (!Array.isArray(dependencies)) return [];
  return [
    ...new Set(
      dependencies
        .map((dependency) => String(dependency || "").trim())
        .filter(Boolean),
    ),
  ].sort();
}

function formatBytes(bytes) {
  const value = Number(bytes) || 0;
  if (value < 1024) return `${value} B`;
  const kilobytes = value / 1024;
  if (kilobytes < 1024) return `${kilobytes.toFixed(kilobytes >= 10 ? 0 : 1)} KB`;
  const megabytes = kilobytes / 1024;
  return `${megabytes.toFixed(megabytes >= 10 ? 0 : 1)} MB`;
}

export function buildTokenCss(tokens) {
  const normalized = {
    surface: tokens?.surface ?? "#ffffff",
    foreground: tokens?.foreground ?? "#111111",
    accent: tokens?.accent ?? "#2563eb",
    accentForeground: tokens?.accentForeground ?? "#ffffff",
    muted: tokens?.muted ?? "#f4f4f5",
    border: tokens?.border ?? "#d4d4d8",
    radius: tokens?.radius ?? "0.5rem",
    space: tokens?.space ?? "1rem",
  };

  return `:root {
  --starter-surface: ${normalized.surface};
  --starter-foreground: ${normalized.foreground};
  --starter-accent: ${normalized.accent};
  --starter-accent-foreground: ${normalized.accentForeground};
  --starter-muted: ${normalized.muted};
  --starter-border: ${normalized.border};
  --starter-radius: ${normalized.radius};
  --starter-space: ${normalized.space};
}

.starter-screen {
  color: var(--starter-foreground);
  background: var(--starter-surface);
}
`;
}

function summarizeReviewChanges(blueprint) {
  const summary = blueprint?.correctionSummary;
  if (summary && typeof summary === "object") {
    const edited = Number(summary.appliedEdits) || 0;
    const excluded = Number(summary.excludedBoxes) || 0;
    if (!edited && !excluded) {
      return "none captured in this export.";
    }

    const parts = [];
    if (edited) {
      parts.push(`${edited} edited detection box${edited === 1 ? "" : "es"}`);
    }
    if (excluded) {
      parts.push(`${excluded} excluded element${excluded === 1 ? "" : "s"}`);
    }
    return `${parts.join(", ")} captured in the recipe JSON. ${summary.sourceOfTruth}`;
  }

  const elements = Array.isArray(blueprint?.detectedElements)
    ? blueprint.detectedElements
    : [];
  const edited = elements.filter((element) => element.userEdited === true).length;
  const excluded = elements.filter((element) => element.included === false).length;

  if (!edited && !excluded) {
    return "none captured in this export.";
  }

  const parts = [];
  if (edited) {
    parts.push(`${edited} edited detection box${edited === 1 ? "" : "es"}`);
  }
  if (excluded) {
    parts.push(`${excluded} excluded element${excluded === 1 ? "" : "s"}`);
  }
  return `${parts.join(", ")} captured in the recipe JSON.`;
}

function formatReviewChangesSection(blueprint) {
  const summary = blueprint?.correctionSummary;
  if (!summary || typeof summary !== "object") {
    return [
      "- Active elements: unknown",
      "- Applied edits: 0",
      "- Omitted boxes: 0",
      `- Rebuild guide: ${DEFAULT_REVIEW_BASIS}`,
    ].join("\n");
  }

  return [
    `- Active elements: ${Number(summary.activeElements) || 0}`,
    `- Applied edits: ${Number(summary.appliedEdits) || 0}`,
    `- Omitted boxes: ${Number(summary.excludedBoxes) || 0}`,
    `- Rebuild guide: ${
      summary.sourceOfTruth ||
      DEFAULT_REVIEW_BASIS
    }`,
  ].join("\n");
}

function summarizeUnresolvedReviewNotes(blueprint) {
  const elements = Array.isArray(blueprint?.detectedElements)
    ? blueprint.detectedElements
    : [];
  const lowConfidence = elements.filter(
    (element) =>
      typeof element.confidence === "number" && element.confidence < 0.75,
  ).length;
  const checklistCount = Array.isArray(blueprint?.reviewChecklist)
    ? blueprint.reviewChecklist.length
    : 0;

  if (!lowConfidence) {
    return `${checklistCount || 1} checklist item${checklistCount === 1 ? "" : "s"} during review.`;
  }

  return `${lowConfidence} low-confidence element${lowConfidence === 1 ? "" : "s"} plus ${checklistCount || 1} checklist item${checklistCount === 1 ? "" : "s"} during review.`;
}

function summarizeConfidenceBands(items) {
  return items.reduce(
    (summary, item) => {
      const confidence = item?.confidence ?? item?.patternConfidence;
      if (typeof confidence !== "number") {
        summary.unknown += 1;
      } else if (confidence >= 0.85) {
        summary.high += 1;
      } else if (confidence >= 0.7) {
        summary.medium += 1;
      } else {
        summary.low += 1;
      }
      return summary;
    },
    { high: 0, medium: 0, low: 0, unknown: 0 },
  );
}

function buildReviewEditNotes(elements) {
  const edited = elements.filter((element) => element.userEdited === true);
  const excluded = elements.filter((element) => element.included === false);
  if (!edited.length && !excluded.length) {
    return "- No review edits were captured for detection boxes in this export.";
  }

  return [
    ...edited.map((element) => {
      const role = element.componentRole ?? element.primitive ?? element.kind ?? "element";
      return `- Edited ${element.id ?? role}: kept as ${role}; verify geometry during integration.`;
    }),
    ...excluded.map((element) => {
      const role = element.componentRole ?? element.primitive ?? element.kind ?? "element";
      return `- Excluded ${element.id ?? role}: ${role}; confirm it is decorative or intentionally omitted.`;
    }),
  ].join("\n");
}

function buildLowConfidenceReviewQueue(items) {
  const lowConfidenceItems = items
    .map((item, index) => ({
      item,
      index,
      confidence: item?.confidence ?? item?.patternConfidence,
    }))
    .filter(({ confidence }) => typeof confidence === "number" && confidence < 0.75)
    .sort((first, second) => first.confidence - second.confidence)
    .slice(0, 8);

  if (!lowConfidenceItems.length) {
    return "- No low-confidence regions or elements were exported.";
  }

  return lowConfidenceItems
    .map(({ item, index, confidence }) => {
      const label =
        item.id ??
        item.label ??
        item.componentRole ??
        item.primitive ??
        item.kind ??
        `item-${index + 1}`;
      const role = item.componentRole ?? item.primitive ?? item.kind ?? "element";
      const reason = firstDetectionReason(item);
      return `- ${label}: ${Math.round(confidence * 100)}% as ${role}${reason ? ` - ${reason}` : ""}`;
    })
    .join("\n");
}

function buildConfidenceReasonSummary(elements) {
  const reasonLines = elements
    .slice(0, 12)
    .map((element, index) => {
      const role = element.componentRole ?? element.primitive ?? element.kind ?? `element-${index + 1}`;
      const reasons = detectionReasons(element).slice(0, 3);
      const prefix = element.userEdited
        ? "review edit plus detector evidence"
        : element.included === false
          ? "excluded from starter output"
          : "detector evidence";
      const evidence = reasons.length
        ? reasons
        : fallbackDetectionReasons(element, role).slice(0, 3);
      return `- ${role}: ${prefix}; ${evidence.join("; ")}.`;
    });

  return reasonLines.length
    ? reasonLines.join("\n")
    : "- No element-level confidence reasons were available; compare the component with the source screenshot during review.";
}

function detectionReasons(item) {
  const rawReasons = Array.isArray(item?.reasons)
    ? item.reasons
    : [item?.reason, item?.explanation, item?.detectionReason];
  return rawReasons
    .map((reason) => {
      if (!reason) return "";
      if (typeof reason === "string") return reason.trim();
      if (typeof reason === "object") {
        return String(reason.evidence ?? reason.reason ?? reason.label ?? "").trim();
      }
      return String(reason).trim();
    })
    .filter(Boolean);
}

function firstDetectionReason(item) {
  return detectionReasons(item)[0] ?? "";
}

function fallbackDetectionReasons(item, role) {
  const reasons = [];
  const confidence = item?.confidence ?? item?.patternConfidence;
  const box = item?.box ?? item?.bounds ?? item?.rect;
  const primitive = item?.primitive ?? item?.componentRole ?? item?.kind ?? role;

  if (item?.userEdited) {
    reasons.push("reviewer correction marked this box as intentional");
  }

  if (item?.included === false) {
    reasons.push("reviewer excluded this box from generation");
  }

  if (typeof confidence === "number") {
    const bucket =
      confidence >= 0.9
        ? "high-confidence"
        : confidence >= 0.75
          ? "medium-confidence"
          : "low-confidence";
    reasons.push(`${bucket} score ${Math.round(confidence * 100)}%`);
  }

  if (box && typeof box === "object") {
    const width = Number(box.width ?? box.w);
    const height = Number(box.height ?? box.h);
    if (Number.isFinite(width) && Number.isFinite(height) && width > 0 && height > 0) {
      const orientation =
        width > height * 1.8
          ? "wide horizontal"
          : height > width * 1.4
            ? "tall vertical"
            : "balanced";
      reasons.push(`${orientation} geometry ${Math.round(width)}x${Math.round(height)}px`);
    }
  }

  const primitiveReason = primitiveFallbackReason(primitive);
  if (primitiveReason) {
    reasons.push(primitiveReason);
  }

  return reasons.length
    ? reasons
    : ["queued for review because detector evidence was incomplete"];
}

function primitiveFallbackReason(primitive) {
  const normalized = String(primitive ?? "").toLowerCase();
  if (/button|action/.test(normalized)) {
    return "action-like role should be checked for label, state, and target behavior";
  }
  if (/input|field|form/.test(normalized)) {
    return "field-like role should be checked for visible label and validation state";
  }
  if (/card|panel|section/.test(normalized)) {
    return "container-like role should be checked for grouping and hierarchy";
  }
  if (/table|row|list/.test(normalized)) {
    return "repeated-data role should be checked against real row content";
  }
  if (/chart|metric|stat/.test(normalized)) {
    return "data-visual role should be checked for labels and text summary";
  }
  if (/tab|dialog|modal|nav/.test(normalized)) {
    return "interactive structure should be checked for focus and keyboard behavior";
  }
  return "";
}
