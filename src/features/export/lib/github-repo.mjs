/**
 * Server-side GitHub repo export helpers (compare URL + package download fallback).
 */

import { createHash } from "node:crypto";
import { sanitizeGistFilename } from "./github-gist.mjs";

export const DEFAULT_GITHUB_EXPORT_REPO = "Iron-Mark/qwen-ui-lab";
export const DEFAULT_GITHUB_EXPORT_BASE = "main";
const SCAFFOLD_RECIPE_SCHEMA = "qwen-ui-lab/scaffold-recipe@1";
const EXPORT_BUNDLE_SCHEMA = "qwen-ui-lab/export-bundle@1";

export const REPO_EXPORT_COMPARE_INSTRUCTIONS =
  "Use the compare view: create the export branch, add the generated component, paste code from the panel, and open a pull request.";

/**
 * @param {Record<string, string | undefined>} [env]
 */
export function canUseGithubRepoExport(env = process.env) {
  return Boolean(env.GITHUB_TOKEN?.trim());
}

/**
 * @param {string} slug
 */
export function parseGithubRepoSlug(slug) {
  const trimmed = String(slug || "").trim();
  const match = /^([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+)$/.exec(trimmed);
  if (!match) return null;
  return { owner: match[1], repo: match[2] };
}

/**
 * @param {Record<string, string | undefined>} [env]
 */
export function getGithubRepoExportConfig(env = process.env) {
  const slug =
    env.GITHUB_EXPORT_REPO?.trim() || DEFAULT_GITHUB_EXPORT_REPO;
  const parsed = parseGithubRepoSlug(slug);
  if (!parsed) return null;

  const base =
    env.GITHUB_EXPORT_BASE?.trim() || DEFAULT_GITHUB_EXPORT_BASE;

  return {
    ...parsed,
    base: base.replace(/^refs\/heads\//, ""),
  };
}

/**
 * @param {{
 *   owner: string;
 *   repo: string;
 *   base: string;
 *   filename: string;
 *   description?: string;
 * }} args
 */
export function buildRepoCompareExport({
  owner,
  repo,
  base,
  filename,
  description = "qwen-ui-lab component export",
}) {
  const safeFilename = sanitizeGistFilename(filename);
  const head = `qwen-ui-lab-export-${Date.now()}`;
  const title = encodeURIComponent("Add qwen-ui-lab generated component");
  const body = encodeURIComponent(
    [
      "## qwen-ui-lab component export",
      "",
      description,
      "",
      `Add \`${safeFilename}\` from the export panel.`,
      "",
      "### Steps",
      `1. Create branch \`${head}\` from \`${base}\`.`,
      `2. Add \`${safeFilename}\` with your generated component.`,
      "3. Open a pull request.",
      "",
      "---",
      "_Compare link helper — paste component content manually._",
    ].join("\n"),
  );

  const url = `https://github.com/${owner}/${repo}/compare/${encodeURIComponent(base)}...${encodeURIComponent(head)}?expand=1&title=${title}&body=${body}`;

  return {
    url,
    branch: head,
    filename: safeFilename,
    instructions: REPO_EXPORT_COMPARE_INSTRUCTIONS,
  };
}

/**
 * @param {{
 *   filename: string;
 *   description?: string;
 * }} args
 */
export function buildScaffoldReadme({ filename, description = "qwen-ui-lab component export" }) {
  const safeFilename = sanitizeGistFilename(filename);
  return `# qwen-ui-lab component export

${description}

## Files

- \`${safeFilename}\` — generated React + Tailwind component

## Next steps

1. Unzip this archive into your app (for example \`src/components/\`).
2. Install any missing dependencies referenced by the component.
3. Adjust imports and routes to match your project structure.

Exported from [qwen-ui-lab](https://github.com/${DEFAULT_GITHUB_EXPORT_REPO}).
`;
}

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
    primitiveSummary,
    reviewChecklist: buildReviewChecklist({
      detectedElements,
      detectedPatterns,
      layoutRegions,
      primitiveSummary,
    }),
  };
}

/**
 * @param {{
 *   content: string;
 *   filename: string;
 *   description?: string;
 * }} args
 * @returns {{ name: string; content: string }[]}
 */
export function buildScaffoldZipEntries({ content, filename, description }) {
  const safeFilename = sanitizeGistFilename(filename);
  const blueprint = extractProductionScaffoldBlueprint(content);
  if (blueprint) {
    return buildProductionScaffoldZipEntries({
      content,
      filename: safeFilename,
      description,
      blueprint,
    });
  }

  return [
    { name: "README.md", content: buildScaffoldReadme({ filename: safeFilename, description }) },
    { name: safeFilename, content },
  ];
}

function buildProductionScaffoldZipEntries({ content, filename, description, blueprint }) {
  const stem = toExportStem(filename);
  const componentPath = `src/components/generated/${stem}.tsx`;
  const recipePath = `src/components/generated/${stem}.recipe.json`;
  const manifestPath = `src/components/generated/${stem}.manifest.json`;
  const tokensPath = `src/components/generated/${stem}.tokens.css`;
  const detectionPath = `docs/${stem}.detection.md`;
  const dependencies = inferShadcnDependencies(content, blueprint.shadcnPrimitiveMap);
  const fileMap = {
    component: componentPath,
    recipe: recipePath,
    manifest: manifestPath,
    tokens: tokensPath,
    detectionSummary: detectionPath,
  };
  const recipe = {
    ...blueprint,
    files: fileMap,
    integration: {
      entryComponent: blueprint.componentName,
      importPath: `@/components/generated/${stem}`,
      dependencies,
      nextSteps: [
        "Replace placeholder copy with product content.",
        "Wire cards, tables, charts, and forms to real data.",
        "Review the detection summary before deleting unused regions.",
      ],
    },
  };
  const manifest = buildProductionManifest({
    blueprint,
    dependencies,
    files: fileMap,
    stem,
  });

  return [
    {
      name: "README.md",
      content: buildProductionScaffoldReadme({
        description,
        files: fileMap,
        componentName: blueprint.componentName,
        blueprint,
        dependencies,
      }),
    },
    { name: componentPath, content },
    { name: recipePath, content: `${JSON.stringify(recipe, null, 2)}\n` },
    { name: manifestPath, content: `${JSON.stringify(manifest, null, 2)}\n` },
    { name: tokensPath, content: buildTokenCss(blueprint.designTokens) },
    { name: detectionPath, content: buildDetectionSummaryMarkdown(blueprint) },
  ];
}

function buildProductionScaffoldReadme({
  description = "qwen-ui-lab component export",
  files,
  componentName,
  blueprint,
  dependencies = [],
}) {
  const screenIntent = blueprint?.screenIntent?.label ?? "Generated UI";
  const regionCount = blueprint?.layoutRegions?.length ?? 0;
  const elementCount = blueprint?.detectedElements?.length ?? 0;
  const primitiveCount = Object.keys(blueprint?.shadcnPrimitiveMap ?? {}).length;
  const responsiveMode = blueprint?.responsiveIntent?.mode ?? "responsive layout";

  return `# qwen-ui-lab starter package

${description}

This starter package was generated from a screenshot analysis. It is meant to be reviewed, imported, and iterated in source control rather than pasted as a one-off snippet.

## What changed from the screenshot

- Screen intent: ${screenIntent}
- ${regionCount} layout region${regionCount === 1 ? "" : "s"} and ${elementCount} detected element${elementCount === 1 ? "" : "s"} were converted into React sections.
- ${primitiveCount} shadcn-style primitive mapping${primitiveCount === 1 ? "" : "s"} were included for review.
- Responsive mode: ${responsiveMode}

## Files

- \`${files.component}\` - React + Tailwind component entry point (\`${componentName}\`)
- \`${files.recipe}\` - deterministic detection recipe, primitive map, and regeneration context
- \`${files.manifest}\` - package identity, dependency hints, and quality gates for review
- \`${files.tokens}\` - CSS variables derived from the screenshot palette
- \`${files.detectionSummary}\` - human-readable detection notes, confidence summary, and integration checklist

## Expected dependencies

${dependencies.length ? dependencies.map((item) => `- \`${item}\``).join("\n") : "- No shadcn dependencies were inferred."}

## Import checklist

1. Copy \`src/components/generated/\` into your app.
2. Add the exported component to the route or page where it belongs.
3. Replace placeholder content with real product data.
4. Keep the recipe JSON during review so edits can be compared against the screenshot-derived source.
5. Run lint/build and verify mobile, tablet, and desktop widths before merging.

Exported from [qwen-ui-lab](https://github.com/${DEFAULT_GITHUB_EXPORT_REPO}).
`;
}

function buildDetectionSummaryMarkdown(blueprint) {
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

function buildProductionManifest({ blueprint, dependencies, files, stem }) {
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
    qualityGates: [
      "Review detection summary before merging.",
      "Replace placeholder data and copy.",
      "Run app lint/build after importing.",
      "Verify responsive layout at mobile, tablet, and desktop widths.",
    ],
  };
}

function buildTokenCss(tokens) {
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

function inferGeneratedComponentName(source) {
  const defaultMatch = /export\s+default\s+function\s+([A-Za-z_$][\w$]*)/.exec(source);
  if (defaultMatch) return defaultMatch[1];
  const namedMatch = /export\s+function\s+([A-Za-z_$][\w$]*)/.exec(source);
  return namedMatch?.[1] ?? "GeneratedComponent";
}

function inferShadcnDependencies(content, primitiveMap) {
  const imports = [
    ...String(content || "").matchAll(/from\s+["'](@\/components\/ui\/[^"']+)["']/g),
  ].map((match) => match[1]);
  const mappedDependencies = Object.values(primitiveMap ?? {}).flatMap((value) =>
    componentNamesFromText(value).map((name) => `@/components/ui/${name}`),
  );

  return [...new Set([...imports, ...mappedDependencies])].sort();
}

function componentNamesFromText(value) {
  const known = {
    Badge: "badge",
    Button: "button",
    Card: "card",
    Dialog: "dialog",
    Input: "input",
    Select: "select",
    Table: "table",
    Tabs: "tabs",
  };
  return Object.entries(known)
    .filter(([componentName]) =>
      new RegExp(`\\b${componentName}\\b`, "i").test(String(value || "")),
    )
    .map(([, dependencyName]) => dependencyName);
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
    checklist.push("No primitive summary was available; inspect the generated component manually.");
  }

  return checklist;
}

function hashContent(content) {
  return createHash("sha256").update(String(content || "")).digest("hex");
}

function toExportStem(filename) {
  const withoutExtension = String(filename || "generated-component")
    .replace(/\.[^.]+$/, "")
    .replace(/[^\w.-]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return withoutExtension || "generated-component";
}
