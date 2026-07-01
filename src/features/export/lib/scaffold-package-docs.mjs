export const DEFAULT_EXPORT_SOURCE_REPO = "Iron-Mark/qwen-ui-lab";
export const DEFAULT_EXPORT_PACKAGE_DESCRIPTION = "Screenshot UI starter package";
const EXPORT_BUNDLE_SCHEMA = "qwen-ui-lab/export-bundle@1";

export function buildScaffoldReadme({
  filename,
  description = DEFAULT_EXPORT_PACKAGE_DESCRIPTION,
  sourceRepo = DEFAULT_EXPORT_SOURCE_REPO,
}) {
  return `# Screenshot UI starter package

${description}

This export is a reviewable package. Import it into source control, connect real data, and compare the result against the screenshot before shipping.

## Files

- \`README.md\` - package overview and import checklist
- \`DESIGN.md\` - design notes, review items, and responsive assumptions
- \`${filename}\` - generated React + Tailwind component

## Next steps

1. Unzip this export package into your app.
2. Install any missing dependencies referenced by the component.
3. Adjust imports and routes to match your project structure.
4. Review the design notes and detection notes before treating the component as final.

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
  const screenIntent = blueprint?.screenIntent?.label ?? "Screenshot export";
  const regionCount = blueprint?.layoutRegions?.length ?? 0;
  const elementCount = blueprint?.detectedElements?.length ?? 0;
  const primitiveCount = Object.keys(blueprint?.shadcnPrimitiveMap ?? {}).length;
  const primitiveMappingNoun = `shadcn-style primitive mapping${primitiveCount === 1 ? "" : "s"}`;
  const primitiveMappingVerb = primitiveCount === 1 ? "was" : "were";
  const responsiveMode = blueprint?.responsiveIntent?.mode ?? "responsive layout";
  const correctionSummary = summarizeManualCorrections(blueprint);
  const reviewSummary = summarizeUnresolvedReviewNotes(blueprint);

  return `# Screenshot UI starter package

${description}

This export package turns the screenshot review into files you can import, compare, and iterate in source control. It is a starter package for review, not a final production component.

## What this package is

- A generated React + Tailwind starting point based on the reviewed screenshot.
- A deterministic recipe that records detected regions, primitive mappings, and manual corrections.
- Design and detection notes intended for code review.

## What this package is not

- It does not include the original screenshot, user data, secrets, or production data wiring.
- It should not be merged until visual parity, accessibility, responsive layout, and real data states have been reviewed.

## What changed from the screenshot

- Screen intent: ${screenIntent}
- ${regionCount} layout region${regionCount === 1 ? "" : "s"} and ${elementCount} detected element${elementCount === 1 ? "" : "s"} were converted into React sections.
- ${primitiveCount} ${primitiveMappingNoun} ${primitiveMappingVerb} included for review.
- Responsive mode: ${responsiveMode}
- Manual corrections: ${correctionSummary}
- Review notes: ${reviewSummary}

## Files

- \`${files.designDoc}\` - design notes, layout decisions, and review checklist
- \`${files.component}\` - React + Tailwind component entry point (\`${componentName}\`)
- \`${files.recipe}\` - deterministic detection recipe, primitive map, and regeneration context
- \`${files.manifest}\` - package identity, dependency hints, and quality gates for review
- \`${files.tokens}\` - CSS variables derived from the screenshot palette
- \`${files.detectionSummary}\` - human-readable detection notes, confidence summary, and integration checklist

## Package inventory

${formatPackageInventory(inventory)}

${buildQuickImportMarkdown({ files, componentName })}

## Expected dependencies

${dependencies.length ? dependencies.map((item) => `- \`${item}\``).join("\n") : "- No shadcn dependencies were inferred."}

## Import checklist

1. Copy \`src/components/generated/\` into your app.
2. Add the exported component to the route or page where it belongs.
3. Replace sample content with real product data.
4. Keep the recipe JSON during review so edits can be compared against the screenshot-derived source.
5. Verify keyboard order, visible focus, labels, empty/loading/error states, and color contrast.
6. Run lint/build and verify mobile, tablet, and desktop widths before merging.

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
  return `# Screenshot UI starter package

${description}

This export is a reviewable starter package. Import it into source control, connect real data, and compare the result against the screenshot before shipping.

## What this package is

- A generated component file plus supporting review documents.
- A portable starter for adapting screenshot-inspired UI inside your app.
- A source-control friendly export package with recipe, manifest, tokens, and detection notes.

## What this package is not

- It is not a final production screen.
- It does not include the original screenshot, user data, secrets, or production data wiring.

## Files

- \`README.md\` - package overview and import checklist
- \`${files.designDoc}\` - design notes, review items, and responsive assumptions
- \`${files.component}\` - React + Tailwind component entry point (\`${componentName}\`)
- \`${files.recipe}\` - regeneration recipe and package context
- \`${files.manifest}\` - package manifest and quality gates
- \`${files.tokens}\` - theme token file
- \`${files.detectionSummary}\` - detection and review notes

## Package inventory

${formatPackageInventory(inventory)}

${buildQuickImportMarkdown({ files, componentName })}

## Expected dependencies

${dependencies.length ? dependencies.map((item) => `- \`${item}\``).join("\n") : "- No shadcn dependencies were inferred."}

## Next steps

1. Unzip this export package into your app.
2. Install any missing dependencies referenced by the component.
3. Adjust imports and routes to match your project structure.
4. Review \`DESIGN.md\` and the detection notes before treating the component as final.
5. Verify keyboard order, focus states, responsive behavior, and real empty/loading/error states.

Exported from [qwen-ui-lab](https://github.com/${sourceRepo}).
`;
}

export function buildDetectionSummaryMarkdown(blueprint) {
  const regions = blueprint.layoutRegions ?? [];
  const elements = blueprint.detectedElements ?? [];
  const patterns = blueprint.detectedPatterns ?? {};
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
  const manualCorrectionNotes = buildManualCorrectionNotes(elements);
  const correctionMetadata = blueprint.correctionSummary;

  return `# Detection summary

This file explains how the uploaded screenshot was translated into the generated component. Use it to review confidence, decide which sections need product data, and keep future regeneration deterministic.

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
- The recipe and manifest keep the generated output reviewable in source control.

## Confidence summary

- High confidence: ${confidenceSummary.high}
- Medium confidence: ${confidenceSummary.medium}
- Low confidence: ${confidenceSummary.low}
- Unknown confidence: ${confidenceSummary.unknown}

## Manual corrections

- Active elements: ${correctionMetadata?.activeElements ?? elements.filter((element) => element.included !== false).length}
- Applied edits: ${correctionMetadata?.appliedEdits ?? elements.filter((element) => element.userEdited === true).length}
- Excluded boxes: ${correctionMetadata?.excludedBoxes ?? elements.filter((element) => element.included === false).length}
- Source of truth: ${correctionMetadata?.sourceOfTruth ?? "Detection boxes are the source of truth for this regenerated scaffold."}

${manualCorrectionNotes}

## Responsive intent

- Mode: ${blueprint.responsiveIntent?.mode ?? "unknown"}
- Breakpoints: ${(blueprint.responsiveIntent?.breakpoints ?? []).join(", ") || "base"}
- Primary flow: ${blueprint.responsiveIntent?.primaryFlow ?? "Review layout manually."}

## Pattern counts

${patternLines || "- No grouped patterns were exported."}

## Primitive mapping

${primitiveLines || "- No shadcn primitive map was exported."}

## Regions

${regionLines || "- No layout regions were exported."}

## Detected elements

${elementLines || "- No detected elements were exported."}

## Integration notes

${blueprint.reviewChecklist.map((item) => `- ${item}`).join("\n")}
`;
}

export function buildPackageDesignMarkdown({
  description = "React export package",
  files,
  componentName,
  blueprint,
  dependencies = [],
}) {
  const screenIntent = blueprint?.screenIntent?.label ?? "Screenshot export";
  const responsiveIntent = blueprint?.responsiveIntent;
  const primitiveMap = Object.entries(blueprint?.shadcnPrimitiveMap ?? {})
    .sort(([first], [second]) => first.localeCompare(second))
    .map(([primitive, reason]) => `- ${primitive}: ${reason}`)
    .join("\n");
  const reviewChecklist = blueprint?.reviewChecklist?.length
    ? blueprint.reviewChecklist.map((item) => `- ${item}`).join("\n")
    : "- Review the generated component against the source screenshot.";

  return `# Design notes

${description}

## Component

- Name: \`${componentName}\`
- Entry: \`${files.component}\`
- Intent: ${screenIntent}

## Layout decisions

- The generated component is structured as source-controlled project files, not a final screenshot clone.
- Repeated regions should remain as small subcomponents when you adapt the code.
- Token values are isolated in \`${files.tokens}\` so visual tuning can happen without rewriting component structure.

## Responsive assumptions

- Mode: ${responsiveIntent?.mode ?? "responsive export"}
- Breakpoints: ${(responsiveIntent?.breakpoints ?? ["mobile", "tablet", "desktop"]).join(", ")}
- Primary flow: ${responsiveIntent?.primaryFlow ?? "Verify the layout manually at mobile, tablet, and desktop widths."}

## Primitive mapping

${primitiveMap || "- No shadcn-style primitive map was inferred. Review the JSX and map controls manually."}

## Package contents

- \`${files.component}\` - component source
- \`${files.recipe}\` - regeneration recipe
- \`${files.manifest}\` - package manifest
- \`${files.tokens}\` - token CSS
- \`${files.detectionSummary}\` - detection notes

${buildQuickImportMarkdown({ files, componentName })}

## Dependencies

${dependencies.length ? dependencies.map((item) => `- \`${item}\``).join("\n") : "- No shadcn dependencies were inferred."}

## Review checklist

${reviewChecklist}

## Accessibility and state checks

- Confirm interactive controls have visible labels and keyboard focus.
- Add real loading, empty, and error states for data-backed sections.
- Check color contrast after replacing sample content and tokens.
`;
}

export function buildProductionManifest({ blueprint, dependencies, files, stem }) {
  return {
    schema: EXPORT_BUNDLE_SCHEMA,
    bundleId: `qwen-${blueprint.sourceHash.slice(0, 12)}`,
    generator: blueprint.generator,
    sourceHash: blueprint.sourceHash,
    component: {
      name: blueprint.componentName,
      importPath: `@/components/generated/${stem}`,
    },
    files,
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
        "Detection boxes are the source of truth for this regenerated scaffold.",
    },
    qualityGates: [
      "Compare the imported component against the source screenshot before merging.",
      "Review detection summary, low-confidence regions, and manual corrections.",
      "Replace sample data and copy with product-owned content.",
      "Add or verify loading, empty, error, and keyboard focus states.",
      "Run app lint/build after importing.",
      "Verify responsive layout at mobile, tablet, and desktop widths.",
    ],
  };
}

function formatPackageInventory(inventory) {
  if (!Array.isArray(inventory) || inventory.length === 0) {
    return "- Inventory unavailable. Inspect the zip entries before import.";
  }

  return [
    "| File | Size | Lines |",
    "| --- | ---: | ---: |",
    ...inventory.map(
      (item) =>
        `| \`${item.path}\` | ${formatBytes(item.bytes)} | ${Number(item.lines) || 0} |`,
    ),
  ].join("\n");
}

function buildQuickImportMarkdown({ files, componentName }) {
  const importPath = `@/${String(files.component || "")
    .replace(/^src\//, "")
    .replace(/\.tsx$/, "")}`;
  const safeComponentName = componentName || "GeneratedComponent";

  return `## Quick import

\`\`\`tsx
import ${safeComponentName} from "${importPath}";

export default function Screen() {
  return <${safeComponentName} />;
}
\`\`\`

Keep \`${files.recipe}\`, \`${files.manifest}\`, and \`${files.detectionSummary}\` with the pull request until visual review is complete.`;
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
  --qwen-generated-surface: ${normalized.surface};
  --qwen-generated-foreground: ${normalized.foreground};
  --qwen-generated-accent: ${normalized.accent};
  --qwen-generated-accent-foreground: ${normalized.accentForeground};
  --qwen-generated-muted: ${normalized.muted};
  --qwen-generated-border: ${normalized.border};
  --qwen-generated-radius: ${normalized.radius};
  --qwen-generated-space: ${normalized.space};
}

.qwen-generated-shell {
  color: var(--qwen-generated-foreground);
  background: var(--qwen-generated-surface);
}
`;
}

function summarizeManualCorrections(blueprint) {
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
    return `${checklistCount || 1} checklist item${checklistCount === 1 ? "" : "s"} before merge.`;
  }

  return `${lowConfidence} low-confidence element${lowConfidence === 1 ? "" : "s"} plus ${checklistCount || 1} checklist item${checklistCount === 1 ? "" : "s"} before merge.`;
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

function buildManualCorrectionNotes(elements) {
  const edited = elements.filter((element) => element.userEdited === true);
  const excluded = elements.filter((element) => element.included === false);
  if (!edited.length && !excluded.length) {
    return "- No manual detection-box edits were captured in this export.";
  }

  return [
    ...edited.map((element) => {
      const role = element.componentRole ?? element.primitive ?? element.kind ?? "element";
      return `- Edited ${element.id ?? role}: kept as ${role}; verify geometry before merging.`;
    }),
    ...excluded.map((element) => {
      const role = element.componentRole ?? element.primitive ?? element.kind ?? "element";
      return `- Excluded ${element.id ?? role}: ${role}; confirm it is decorative or intentionally omitted.`;
    }),
  ].join("\n");
}
