/**
 * Server-side GitHub repo export helpers (compare URL + package download fallback).
 */
import { sanitizeGistFilename } from "./github-gist.mjs";
import {
  extractProductionScaffoldBlueprint,
  hashContent,
  inferGeneratedComponentName,
  SCAFFOLD_RECIPE_SCHEMA,
} from "./scaffold-blueprint.mjs";
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
export { extractProductionScaffoldBlueprint };

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

function toExportStem(filename) {
  const withoutExtension = String(filename || "generated-component")
    .replace(/\.[^.]+$/, "")
    .replace(/[^\w.-]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return withoutExtension || "generated-component";
}
