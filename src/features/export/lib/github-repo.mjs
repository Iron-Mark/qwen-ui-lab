/**
 * Server-side GitHub repo export helpers (compare URL + package download fallback).
 */

import { createHash } from "node:crypto";
import { sanitizeGistFilename } from "./github-gist.mjs";
import {
  buildDetectionSummaryMarkdown,
  buildFallbackPackageReadme,
  buildPackageDesignMarkdown,
  buildProductionManifest,
  buildProductionScaffoldReadme,
  buildTokenCss,
  DEFAULT_EXPORT_PACKAGE_DESCRIPTION,
  DEFAULT_EXPORT_SOURCE_REPO,
} from "./scaffold-package-docs.mjs";

export const DEFAULT_GITHUB_EXPORT_REPO = DEFAULT_EXPORT_SOURCE_REPO;
export const DEFAULT_GITHUB_EXPORT_BASE = "main";
export { DEFAULT_EXPORT_PACKAGE_DESCRIPTION };
const SCAFFOLD_RECIPE_SCHEMA = "qwen-ui-lab/scaffold-recipe@1";

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
  description = DEFAULT_EXPORT_PACKAGE_DESCRIPTION,
}) {
  const safeFilename = sanitizeGistFilename(filename);
  const head = `qwen-ui-lab-export-${Date.now()}`;
  const title = encodeURIComponent("Add screenshot UI starter package");
  const body = encodeURIComponent(
    [
      "## Screenshot UI starter package",
      "",
      description,
      "",
      `Add \`${safeFilename}\` from the export package.`,
      "",
      "### Steps",
      `1. Create branch \`${head}\` from \`${base}\`.`,
      `2. Add \`${safeFilename}\` with the generated UI package.`,
      "3. Open a pull request.",
      "",
      "---",
      "_Compare link helper - paste package contents manually._",
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
export function buildScaffoldReadme({
  filename,
  description = DEFAULT_EXPORT_PACKAGE_DESCRIPTION,
}) {
  const safeFilename = sanitizeGistFilename(filename);
  return `# Screenshot UI starter package

${description}

This export is a reviewable package. Import it into source control, connect real data, and compare the result against the screenshot before shipping.

## Files

- \`README.md\` - package overview and import checklist
- \`DESIGN.md\` - design notes, review items, and responsive assumptions
- \`${safeFilename}\` - generated React + Tailwind component

## Next steps

1. Unzip this export package into your app.
2. Install any missing dependencies referenced by the component.
3. Adjust imports and routes to match your project structure.
4. Review the design notes and detection notes before treating the component as final.

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

  return buildFallbackScaffoldZipEntries({ content, filename: safeFilename, description });
}

export function buildScaffoldPackageFileMap(filename) {
  const stem = toExportStem(filename);
  const componentPath = `src/components/generated/${stem}.tsx`;

  return {
    stem,
    files: {
      designDoc: "DESIGN.md",
      component: componentPath,
      recipe: `src/components/generated/${stem}.recipe.json`,
      manifest: `src/components/generated/${stem}.manifest.json`,
      tokens: `src/components/generated/${stem}.tokens.css`,
      detectionSummary: `docs/${stem}.detection.md`,
    },
  };
}

function buildFallbackScaffoldZipEntries({ content, filename, description }) {
  const { stem, files } = buildScaffoldPackageFileMap(filename);
  const dependencies = inferShadcnDependencies(content, inferPrimitiveMapFromImports(content));
  const fallbackBlueprint = {
    schema: SCAFFOLD_RECIPE_SCHEMA,
    generator: "manual-scaffold-export",
    sourceHash: hashContent(content),
    componentName: inferGeneratedComponentName(content),
    designTokens: {},
    screenIntent: { label: "Screenshot export", confidence: 0.5 },
    responsiveIntent: {
      mode: "responsive export",
      breakpoints: ["mobile", "tablet", "desktop"],
      primaryFlow: "Review layout against the original screenshot before shipping.",
    },
    detectedPatterns: {},
    detectedElements: [],
    layoutRegions: [],
    shadcnPrimitiveMap: inferPrimitiveMapFromImports(content),
    primitiveSummary: [],
    reviewChecklist: [
      "Review spacing, typography, and responsive behavior against the source screenshot.",
      "Replace sample content with product data.",
      "Run lint/build after importing the component.",
    ],
  };
  const recipe = {
    ...fallbackBlueprint,
    files,
    integration: {
      entryComponent: fallbackBlueprint.componentName,
      importPath: `@/components/generated/${stem}`,
      dependencies,
      nextSteps: fallbackBlueprint.reviewChecklist,
    },
  };
  const manifest = buildProductionManifest({
    blueprint: fallbackBlueprint,
    dependencies,
    files,
    stem,
  });

  return [
    {
      name: "README.md",
      content: buildFallbackPackageReadme({
        description,
        files,
        componentName: fallbackBlueprint.componentName,
        dependencies,
      }),
    },
    {
      name: files.designDoc,
      content: buildPackageDesignMarkdown({
        description,
        files,
        componentName: fallbackBlueprint.componentName,
        blueprint: fallbackBlueprint,
        dependencies,
      }),
    },
    { name: files.component, content },
    { name: files.recipe, content: `${JSON.stringify(recipe, null, 2)}\n` },
    { name: files.manifest, content: `${JSON.stringify(manifest, null, 2)}\n` },
    { name: files.tokens, content: buildTokenCss(fallbackBlueprint.designTokens) },
    { name: files.detectionSummary, content: buildDetectionSummaryMarkdown(fallbackBlueprint) },
  ];
}

function buildProductionScaffoldZipEntries({ content, filename, description, blueprint }) {
  const { stem, files } = buildScaffoldPackageFileMap(filename);
  const dependencies = inferShadcnDependencies(content, blueprint.shadcnPrimitiveMap);
  const recipe = {
    ...blueprint,
    files,
    integration: {
      entryComponent: blueprint.componentName,
      importPath: `@/components/generated/${stem}`,
      dependencies,
      nextSteps: [
        "Replace sample copy with product content.",
        "Wire cards, tables, charts, and forms to real data.",
        "Review the detection summary before deleting unused regions.",
      ],
    },
  };
  const manifest = buildProductionManifest({
    blueprint,
    dependencies,
    files,
    stem,
  });

  return [
    {
      name: "README.md",
      content: buildProductionScaffoldReadme({
        description,
        files,
        componentName: blueprint.componentName,
        blueprint,
        dependencies,
      }),
    },
    {
      name: files.designDoc,
      content: buildPackageDesignMarkdown({
        description,
        files,
        componentName: blueprint.componentName,
        blueprint,
        dependencies,
      }),
    },
    { name: files.component, content },
    { name: files.recipe, content: `${JSON.stringify(recipe, null, 2)}\n` },
    { name: files.manifest, content: `${JSON.stringify(manifest, null, 2)}\n` },
    { name: files.tokens, content: buildTokenCss(blueprint.designTokens) },
    { name: files.detectionSummary, content: buildDetectionSummaryMarkdown(blueprint) },
  ];
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

function inferPrimitiveMapFromImports(content) {
  const imports = [
    ...String(content || "").matchAll(/from\s+["']@\/components\/ui\/([^"']+)["']/g),
  ].map((match) => match[1]);

  return Object.fromEntries(
    [...new Set(imports)].sort().map((name) => [
      name,
      `Imported shadcn-style ${name} primitive in the generated component.`,
    ]),
  );
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
