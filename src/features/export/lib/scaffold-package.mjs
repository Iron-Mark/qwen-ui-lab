import { sanitizeScaffoldFilename } from "./scaffold-filename.mjs";
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
} from "./scaffold-package-docs.mjs";

/**
 * @param {{
 *   content: string;
 *   filename: string;
 *   description?: string;
 * }} args
 * @returns {{ name: string; content: string }[]}
 */
export function buildScaffoldZipEntries({ content, filename, description }) {
  const safeFilename = sanitizeScaffoldFilename(filename);
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
      primaryFlow: "Review layout against the original screenshot before import.",
    },
    detectedPatterns: {},
    detectedElements: [],
    layoutRegions: [],
    shadcnPrimitiveMap: inferPrimitiveMapFromImports(content),
    correctionSummary: {
      activeElements: 0,
      appliedEdits: 0,
      excludedBoxes: 0,
      sourceOfTruth: "Manual scaffold exports do not include detection-box corrections.",
    },
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
  return buildPackageEntries({
    content,
    description,
    files,
    blueprint: fallbackBlueprint,
    dependencies,
    recipe,
    manifest,
    readmeBuilder: buildFallbackPackageReadme,
  });
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
  return buildPackageEntries({
    content,
    description,
    files,
    blueprint,
    dependencies,
    recipe,
    manifest,
    readmeBuilder: buildProductionScaffoldReadme,
  });
}

function buildPackageEntries({
  content,
  description,
  files,
  blueprint,
  dependencies,
  recipe,
  manifest,
  readmeBuilder,
}) {
  const designDoc = buildPackageDesignMarkdown({
    description,
    files,
    componentName: blueprint.componentName,
    blueprint,
    dependencies,
  });
  const recipeJson = `${JSON.stringify(recipe, null, 2)}\n`;
  const manifestJson = `${JSON.stringify(manifest, null, 2)}\n`;
  const tokensCss = buildTokenCss(blueprint.designTokens);
  const detectionSummary = buildDetectionSummaryMarkdown({ ...blueprint, files });

  return [
    {
      name: "README.md",
      content: readmeBuilder({
        description,
        files,
        componentName: blueprint.componentName,
        blueprint,
        dependencies,
        inventory: buildPackageInventory([
          { name: files.designDoc, content: designDoc },
          { name: files.component, content },
          { name: files.recipe, content: recipeJson },
          { name: files.manifest, content: manifestJson },
          { name: files.tokens, content: tokensCss },
          { name: files.detectionSummary, content: detectionSummary },
        ]),
      }),
    },
    { name: files.designDoc, content: designDoc },
    { name: files.component, content },
    { name: files.recipe, content: recipeJson },
    { name: files.manifest, content: manifestJson },
    { name: files.tokens, content: tokensCss },
    { name: files.detectionSummary, content: detectionSummary },
  ];
}

function inferShadcnDependencies(content, primitiveMap) {
  const imports = [
    ...String(content || "").matchAll(/from\s+["'](@\/components\/ui\/[^"']+)["']/g),
  ].map((match) => match[1]);
  const mappedDependencies = Object.entries(primitiveMap ?? {}).flatMap(([key, value]) =>
    componentNamesFromText(`${key} ${value}`).map((name) => `@/components/ui/${name}`),
  );
  const jsxDependencies = componentNamesFromJsx(content).map(
    (name) => `@/components/ui/${name}`,
  );

  return [...new Set([...imports, ...mappedDependencies, ...jsxDependencies])].sort();
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
  return Object.entries(SHADCN_COMPONENT_DEPENDENCIES)
    .filter(([componentName]) =>
      new RegExp(`\\b${componentName}\\b`, "i").test(String(value || "")),
    )
    .map(([, dependencyName]) => dependencyName);
}

function componentNamesFromJsx(content) {
  const tags = [...String(content || "").matchAll(/<([A-Z][A-Za-z0-9.]*)\b/g)].map((match) =>
    match[1].split(".")[0],
  );

  return [...new Set(tags)]
    .map((tag) => SHADCN_COMPONENT_DEPENDENCIES[tag])
    .filter(Boolean);
}

const SHADCN_COMPONENT_DEPENDENCIES = {
  Badge: "badge",
  Button: "button",
  Card: "card",
  CardContent: "card",
  CardDescription: "card",
  CardFooter: "card",
  CardHeader: "card",
  CardTitle: "card",
  Dialog: "dialog",
  DialogContent: "dialog",
  DialogDescription: "dialog",
  DialogFooter: "dialog",
  DialogHeader: "dialog",
  DialogTitle: "dialog",
  Input: "input",
  Label: "label",
  Select: "select",
  SelectContent: "select",
  SelectItem: "select",
  SelectTrigger: "select",
  SelectValue: "select",
  Table: "table",
  TableBody: "table",
  TableCell: "table",
  TableHead: "table",
  TableHeader: "table",
  TableRow: "table",
  Tabs: "tabs",
  TabsContent: "tabs",
  TabsList: "tabs",
  TabsTrigger: "tabs",
};

function buildPackageInventory(entries) {
  return entries.map((entry) => ({
    path: entry.name,
    bytes: new TextEncoder().encode(entry.content).length,
    lines: String(entry.content || "").split(/\r?\n/).filter(Boolean).length,
  }));
}

function toExportStem(filename) {
  const withoutExtension = String(filename || "generated-component")
    .replace(/\.[^.]+$/, "")
    .replace(/[^\w.-]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return withoutExtension || "generated-component";
}
