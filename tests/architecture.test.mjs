import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import ts from "typescript";

const appRouteConventionFiles = new Set([
  "default.tsx",
  "error.tsx",
  "forbidden.tsx",
  "global-error.tsx",
  "layout.tsx",
  "loading.tsx",
  "manifest.ts",
  "not-found.tsx",
  "opengraph-image.tsx",
  "page.tsx",
  "robots.ts",
  "route.ts",
  "sitemap.ts",
  "template.tsx",
  "twitter-image.tsx",
  "unauthorized.tsx",
]);

const sourceModuleExtensions = [".ts", ".tsx", ".mjs"];
const frameworkEntryFiles = [
  "instrumentation.ts",
  "next.config.ts",
  "src/proxy.ts",
];
const allowedFeatureFolders = new Set(["components", "data", "lib"]);
const scriptSourceRoots = ["scripts"];
const e2eSourceRoots = ["e2e"];

async function collectFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectFiles(fullPath)));
      continue;
    }
    files.push(fullPath);
  }

  return files;
}

function toRepoPath(filePath) {
  return path.relative(process.cwd(), filePath).replaceAll(path.sep, "/");
}

function routeFeatureFromAppPath(repoPath) {
  if (repoPath === "src/app/page.tsx") return "home";
  if (repoPath === "src/app/opengraph-image.tsx") return "home";
  if (repoPath === "src/app/not-found.tsx") return "shell";

  const [, routePath] = repoPath.match(/^src\/app\/(.+)$/) ?? [];
  if (!routePath || routePath.startsWith("api/")) return null;

  const [firstSegment, secondSegment] = routePath.split("/");
  if (!firstSegment || firstSegment.includes(".")) return null;
  if (firstSegment === "admin") return secondSegment ?? null;
  return firstSegment;
}

async function collectSourceFiles(roots) {
  return (
    await Promise.all(roots.map((root) => collectFiles(path.join(process.cwd(), root))))
  )
    .flat()
    .filter((file) => [".ts", ".tsx", ".mjs", ".md"].includes(path.extname(file)));
}

function collectFrameworkEntryFiles() {
  return frameworkEntryFiles.map((file) => path.join(process.cwd(), file));
}

async function collectScriptFiles() {
  return (await collectSourceFiles(scriptSourceRoots)).filter((file) =>
    sourceModuleExtensions.includes(path.extname(file)),
  );
}

async function collectE2eSourceFiles() {
  return (await collectSourceFiles(e2eSourceRoots)).filter((file) =>
    sourceModuleExtensions.includes(path.extname(file)),
  );
}

async function collectApiRouteFiles() {
  return (await collectSourceFiles(["src/app/api"])).filter((file) =>
    sourceModuleExtensions.includes(path.extname(file)),
  );
}

function collectModuleSpecifiers(file, source) {
  const scriptKind = path.extname(file) === ".tsx" ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
  const sourceFile = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, scriptKind);
  const specifiers = [];

  function visit(node) {
    if (
      (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
      node.moduleSpecifier &&
      ts.isStringLiteral(node.moduleSpecifier)
    ) {
      specifiers.push(node.moduleSpecifier.text);
    }

    if (
      ts.isCallExpression(node) &&
      node.expression.kind === ts.SyntaxKind.ImportKeyword &&
      node.arguments.length > 0 &&
      ts.isStringLiteral(node.arguments[0])
    ) {
      specifiers.push(node.arguments[0].text);
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return specifiers;
}

function resolveSourceModule(specifier, fromFile, sourceFileSet) {
  let basePath;
  if (specifier.startsWith("@/")) {
    basePath = path.join(process.cwd(), "src", specifier.slice(2));
  } else if (specifier.startsWith(".")) {
    basePath = path.resolve(path.dirname(fromFile), specifier);
  } else {
    return null;
  }

  const candidatePaths = [
    basePath,
    ...sourceModuleExtensions.map((extension) => `${basePath}${extension}`),
    ...sourceModuleExtensions.map((extension) => path.join(basePath, `index${extension}`)),
  ];

  return candidatePaths.map((candidate) => path.normalize(candidate)).find((candidate) =>
    sourceFileSet.has(candidate),
  ) ?? null;
}

function findImportCycles(graph) {
  const visitState = new Map();
  const stack = [];
  const cycles = [];

  function visit(file) {
    visitState.set(file, "visiting");
    stack.push(file);

    for (const importedFile of graph.get(file) ?? []) {
      if (visitState.get(importedFile) === "visiting") {
        cycles.push([...stack.slice(stack.indexOf(importedFile)), importedFile].map(toRepoPath));
        continue;
      }

      if (!visitState.has(importedFile)) {
        visit(importedFile);
      }
    }

    stack.pop();
    visitState.set(file, "visited");
  }

  for (const file of graph.keys()) {
    if (!visitState.has(file)) {
      visit(file);
    }
  }

  return cycles;
}

test("app routes only contain Next.js route convention modules", async () => {
  const appFiles = await collectFiles(path.join(process.cwd(), "src", "app"));
  const violations = appFiles
    .filter((file) => [".ts", ".tsx"].includes(path.extname(file)))
    .filter((file) => !appRouteConventionFiles.has(path.basename(file)))
    .map(toRepoPath);

  assert.deepEqual(violations, []);
});

test("feature and shared modules do not import from app routes", async () => {
  const sourceFiles = await collectSourceFiles(["src/components", "src/features", "src/lib"]);

  const violations = [];
  for (const file of sourceFiles) {
    const source = await readFile(file, "utf8");
    if (source.includes("\"@/app/") || source.includes("'@/app/")) {
      violations.push(toRepoPath(file));
    }
  }

  assert.deepEqual(violations, []);
});

test("app route modules do not import feature data modules", async () => {
  const appFiles = (await collectSourceFiles(["src/app"])).filter((file) =>
    sourceModuleExtensions.includes(path.extname(file)),
  );

  const violations = [];
  for (const file of appFiles) {
    const source = await readFile(file, "utf8");
    for (const specifier of collectModuleSpecifiers(file, source)) {
      if (/^@\/features\/[^/]+\/data\//.test(specifier)) {
        violations.push(`${toRepoPath(file)} imports ${specifier}`);
      }
    }
  }

  assert.deepEqual(violations, []);
});

test("feature modules do not import data modules from another feature", async () => {
  const featureFiles = (await collectSourceFiles(["src/features"])).filter((file) =>
    sourceModuleExtensions.includes(path.extname(file)),
  );
  const featureFileSet = new Set(featureFiles.map((file) => path.normalize(file)));

  const violations = [];
  for (const file of featureFiles) {
    const repoPath = toRepoPath(file);
    const [, featureName] = repoPath.match(/^src\/features\/([^/]+)\//) ?? [];
    if (!featureName) continue;

    const source = await readFile(file, "utf8");
    for (const specifier of collectModuleSpecifiers(file, source)) {
      const [, aliasImportedFeature] =
        specifier.match(/^@\/features\/([^/]+)\/data\//) ?? [];
      if (aliasImportedFeature && aliasImportedFeature !== featureName) {
        violations.push(`${repoPath} imports ${specifier}`);
        continue;
      }

      if (!specifier.startsWith(".")) continue;

      const resolvedFile = resolveSourceModule(specifier, file, featureFileSet);
      if (!resolvedFile) continue;

      const importedRepoPath = toRepoPath(resolvedFile);
      const [, relativeImportedFeature] =
        importedRepoPath.match(/^src\/features\/([^/]+)\/data\//) ?? [];
      if (relativeImportedFeature && relativeImportedFeature !== featureName) {
        violations.push(`${repoPath} imports ${specifier} -> ${importedRepoPath}`);
      }
    }
  }

  assert.deepEqual(violations, []);
});

test("app route modules do not import feature store implementations", async () => {
  const appFiles = (await collectSourceFiles(["src/app"])).filter((file) =>
    sourceModuleExtensions.includes(path.extname(file)),
  );

  const violations = [];
  for (const file of appFiles) {
    const source = await readFile(file, "utf8");
    for (const specifier of collectModuleSpecifiers(file, source)) {
      if (/^@\/features\/[^/]+\/lib\/.*store/.test(specifier)) {
        violations.push(`${toRepoPath(file)} imports ${specifier}`);
      }
    }
  }

  assert.deepEqual(violations, []);
});

test("app route modules import feature lib helpers only from their owning feature", async () => {
  const appFiles = (await collectSourceFiles(["src/app"])).filter((file) =>
    sourceModuleExtensions.includes(path.extname(file)),
  );

  const violations = [];
  for (const file of appFiles) {
    const repoPath = toRepoPath(file);
    if (repoPath.startsWith("src/app/api/")) continue;

    const routeFeature = routeFeatureFromAppPath(repoPath);
    const source = await readFile(file, "utf8");
    for (const specifier of collectModuleSpecifiers(file, source)) {
      const [, importedFeature] = specifier.match(/^@\/features\/([^/]+)\/lib\//) ?? [];
      if (importedFeature && importedFeature !== routeFeature) {
        violations.push(`${repoPath} imports ${specifier}`);
      }
    }
  }

  assert.deepEqual(violations, []);
});

test("app route modules compose feature components only from their owning feature", async () => {
  const appFiles = (await collectSourceFiles(["src/app"])).filter((file) =>
    sourceModuleExtensions.includes(path.extname(file)),
  );

  const violations = [];
  for (const file of appFiles) {
    const repoPath = toRepoPath(file);
    if (repoPath === "src/app/layout.tsx" || repoPath.startsWith("src/app/api/")) {
      continue;
    }

    const routeFeature = routeFeatureFromAppPath(repoPath);
    const source = await readFile(file, "utf8");
    for (const specifier of collectModuleSpecifiers(file, source)) {
      const [, importedFeature] =
        specifier.match(/^@\/features\/([^/]+)\/components\//) ?? [];
      if (importedFeature && importedFeature !== routeFeature) {
        violations.push(`${repoPath} imports ${specifier}`);
      }
    }
  }

  assert.deepEqual(violations, []);
});

test("root layout delegates runtime shell composition to shell feature", async () => {
  const file = path.join(process.cwd(), "src", "app", "layout.tsx");
  const source = await readFile(file, "utf8");
  const specifiers = collectModuleSpecifiers(file, source);
  const bannedDirectRuntimeImports = [
    "@/components/providers/",
    "@/components/ui/tooltip",
    "@/features/account/",
    "@/features/pwa/",
    "@/features/shell/components/Header",
    "@/features/shell/components/Footer",
  ];

  const violations = specifiers
    .filter((specifier) =>
      bannedDirectRuntimeImports.some((bannedImport) => specifier.startsWith(bannedImport)),
    )
    .map((specifier) => `${toRepoPath(file)} imports ${specifier}`);

  assert.ok(
    specifiers.includes("@/features/shell/components/ShellLayout"),
    "src/app/layout.tsx should compose runtime chrome through ShellLayout",
  );
  assert.deepEqual(violations, []);
});

test("root layout delegates site structured data to shared seo helpers", async () => {
  const file = path.join(process.cwd(), "src", "app", "layout.tsx");
  const source = await readFile(file, "utf8");
  const specifiers = collectModuleSpecifiers(file, source);
  const bannedInlineSchemaMarkers = [
    "\"@graph\"",
    "\"@type\": \"WebSite\"",
    "\"@type\": \"WebApplication\"",
    "\"@type\": \"Organization\"",
  ];

  const violations = bannedInlineSchemaMarkers
    .filter((marker) => source.includes(marker))
    .map((marker) => `${toRepoPath(file)} contains ${marker}`);

  assert.ok(
    specifiers.includes("@/lib/seo"),
    "src/app/layout.tsx should consume shared SEO helpers",
  );
  assert.ok(
    source.includes("createSiteStructuredData("),
    "src/app/layout.tsx should delegate site JSON-LD to createSiteStructuredData",
  );
  assert.deepEqual(violations, []);
});

test("root layout delegates site metadata to shared seo helpers", async () => {
  const file = path.join(process.cwd(), "src", "app", "layout.tsx");
  const source = await readFile(file, "utf8");
  const specifiers = collectModuleSpecifiers(file, source);
  const bannedInlineMetadataMarkers = [
    "metadataBase:",
    "openGraph:",
    "twitter:",
    "robots:",
    "manifest:",
    "appleWebApp:",
  ];

  const violations = bannedInlineMetadataMarkers
    .filter((marker) => source.includes(marker))
    .map((marker) => `${toRepoPath(file)} contains ${marker}`);

  assert.ok(
    specifiers.includes("@/lib/seo"),
    "src/app/layout.tsx should consume shared SEO helpers",
  );
  assert.ok(
    source.includes("createSiteMetadata("),
    "src/app/layout.tsx should delegate site metadata to createSiteMetadata",
  );
  assert.deepEqual(violations, []);
});

test("root layout delegates viewport config to shared seo helpers", async () => {
  const file = path.join(process.cwd(), "src", "app", "layout.tsx");
  const source = await readFile(file, "utf8");
  const specifiers = collectModuleSpecifiers(file, source);
  const bannedInlineViewportMarkers = [
    "themeColor:",
    "viewportFit:",
    "(prefers-color-scheme: light)",
    "(prefers-color-scheme: dark)",
  ];

  const violations = bannedInlineViewportMarkers
    .filter((marker) => source.includes(marker))
    .map((marker) => `${toRepoPath(file)} contains ${marker}`);

  assert.ok(
    specifiers.includes("@/lib/seo"),
    "src/app/layout.tsx should consume shared SEO helpers",
  );
  assert.ok(
    source.includes("createSiteViewport("),
    "src/app/layout.tsx should delegate viewport config to createSiteViewport",
  );
  assert.deepEqual(violations, []);
});

test("seo route convention files delegate crawl metadata to shared seo helpers", async () => {
  const routeFiles = [
    {
      file: path.join(process.cwd(), "src", "app", "manifest.ts"),
      helper: "createManifestConfig(",
      bannedMarkers: [
        "start_url:",
        "theme_color:",
        "background_color:",
        "icons:",
        "shortcuts:",
      ],
    },
    {
      file: path.join(process.cwd(), "src", "app", "sitemap.ts"),
      helper: "createSitemapEntries(",
      bannedMarkers: [
        "STATIC_ROUTES",
        "getSiteUrl(",
        "lastModified:",
        "changeFrequency:",
        "priority:",
      ],
    },
    {
      file: path.join(process.cwd(), "src", "app", "robots.ts"),
      helper: "createRobotsConfig(",
      bannedMarkers: ["getSiteUrl(", "userAgent:", "disallow:", "sitemap:", "host:"],
    },
  ];

  const violations = [];
  for (const { file, helper, bannedMarkers } of routeFiles) {
    const source = await readFile(file, "utf8");
    const specifiers = collectModuleSpecifiers(file, source);

    if (!specifiers.includes("@/lib/seo")) {
      violations.push(`${toRepoPath(file)} does not import shared SEO helpers`);
    }
    if (!source.includes(helper)) {
      violations.push(`${toRepoPath(file)} does not call ${helper}`);
    }
    for (const marker of bannedMarkers) {
      if (source.includes(marker)) {
        violations.push(`${toRepoPath(file)} contains ${marker}`);
      }
    }
  }

  assert.deepEqual(violations, []);
});

test("root layout delegates theme bootstrap logic to shared helpers", async () => {
  const file = path.join(process.cwd(), "src", "app", "layout.tsx");
  const source = await readFile(file, "utf8");
  const specifiers = collectModuleSpecifiers(file, source);
  const bannedInlineThemeMarkers = [
    "localStorage.getItem('theme')",
    "localStorage.getItem('brand-theme')",
    "window.matchMedia('(prefers-color-scheme: dark)')",
    "document.documentElement.dataset.brand",
  ];

  const violations = bannedInlineThemeMarkers
    .filter((marker) => source.includes(marker))
    .map((marker) => `${toRepoPath(file)} contains ${marker}`);

  assert.ok(
    specifiers.includes("@/lib/theme-bootstrap.client"),
    "src/app/layout.tsx should consume shared theme bootstrap helpers",
  );
  assert.ok(
    source.includes("createThemeBootstrapScript()"),
    "src/app/layout.tsx should delegate inline theme script text to createThemeBootstrapScript",
  );
  assert.deepEqual(violations, []);
});

test("shell components keep account provider wiring at the layout boundary", async () => {
  const shellComponentFiles = (await collectSourceFiles(["src/features/shell/components"])).filter(
    (file) => sourceModuleExtensions.includes(path.extname(file)),
  );

  const violations = [];
  for (const file of shellComponentFiles) {
    const repoPath = toRepoPath(file);
    if (repoPath === "src/features/shell/components/ShellLayout.tsx") continue;

    const source = await readFile(file, "utf8");
    for (const specifier of collectModuleSpecifiers(file, source)) {
      if (specifier === "@/features/account/components/AuthProvider") {
        violations.push(`${repoPath} imports ${specifier}`);
      }
    }
  }

  assert.deepEqual(violations, []);
});

test("non-account features consume account helpers instead of the auth provider module", async () => {
  const featureFiles = (await collectSourceFiles(["src/features"])).filter((file) =>
    sourceModuleExtensions.includes(path.extname(file)),
  );

  const violations = [];
  for (const file of featureFiles) {
    const repoPath = toRepoPath(file);
    if (repoPath.startsWith("src/features/account/")) continue;
    if (repoPath === "src/features/shell/components/ShellLayout.tsx") continue;

    const source = await readFile(file, "utf8");
    for (const specifier of collectModuleSpecifiers(file, source)) {
      if (specifier === "@/features/account/components/AuthProvider") {
        violations.push(`${repoPath} imports ${specifier}`);
      }
    }
  }

  assert.deepEqual(violations, []);
});

test("app routes delegate structured-data graph payloads to feature helpers", async () => {
  const appFiles = (await collectSourceFiles(["src/app"])).filter((file) =>
    sourceModuleExtensions.includes(path.extname(file)),
  );

  const violations = [];
  for (const file of appFiles) {
    const repoPath = toRepoPath(file);
    if (repoPath === "src/app/layout.tsx") continue;

    const source = await readFile(file, "utf8");
    if (source.includes("additionalGraph:") || source.includes("createRouteStructuredData")) {
      violations.push(repoPath);
    }
  }

  assert.deepEqual(violations, []);
});

test("app routes render structured data through the shared script component", async () => {
  const appFiles = (await collectSourceFiles(["src/app"])).filter((file) =>
    sourceModuleExtensions.includes(path.extname(file)),
  );
  const inlineScriptMarkers = [
    "application/ld+json",
    "dangerouslySetInnerHTML={structuredData}",
    "dangerouslySetInnerHTML={createSiteStructuredData",
  ];

  const violations = [];
  for (const file of appFiles) {
    const source = await readFile(file, "utf8");
    for (const marker of inlineScriptMarkers) {
      if (source.includes(marker)) {
        violations.push(`${toRepoPath(file)} contains ${marker}`);
      }
    }
  }

  assert.deepEqual(violations, []);
});

test("design-system domain social images delegate shared canvas markup", async () => {
  const imageFiles = [
    path.join(
      process.cwd(),
      "src",
      "app",
      "design-system",
      "laws-of-ux",
      "opengraph-image.tsx",
    ),
    path.join(
      process.cwd(),
      "src",
      "app",
      "design-system",
      "uilaws",
      "opengraph-image.tsx",
    ),
  ];
  const bannedInlineCanvasMarkers = [
    "height: \"100%\"",
    "width: \"100%\"",
    "justifyContent: \"space-between\"",
    "fontFamily: \"Inter, sans-serif\"",
  ];

  const violations = [];
  for (const file of imageFiles) {
    const source = await readFile(file, "utf8");
    const specifiers = collectModuleSpecifiers(file, source);

    if (
      !specifiers.includes(
        "@/features/design-system/components/DesignSystemRoutePreviewImage",
      )
    ) {
      violations.push(`${toRepoPath(file)} does not import shared preview image component`);
    }
    if (!source.includes("<DesignSystemRoutePreviewImage")) {
      violations.push(`${toRepoPath(file)} does not render DesignSystemRoutePreviewImage`);
    }
    for (const marker of bannedInlineCanvasMarkers) {
      if (source.includes(marker)) {
        violations.push(`${toRepoPath(file)} contains ${marker}`);
      }
    }
  }

  assert.deepEqual(violations, []);
});

test("top-level social images delegate shared preview canvas markup", async () => {
  const imageFiles = [
    path.join(process.cwd(), "src", "app", "opengraph-image.tsx"),
    path.join(process.cwd(), "src", "app", "design-system", "opengraph-image.tsx"),
  ];
  const bannedInlineCanvasMarkers = [
    "height: \"100%\"",
    "width: \"100%\"",
    "justifyContent: \"space-between\"",
    "fontFamily: \"Inter, sans-serif\"",
    "borderRadius: \"9999px\"",
  ];

  const violations = [];
  for (const file of imageFiles) {
    const source = await readFile(file, "utf8");
    const specifiers = collectModuleSpecifiers(file, source);

    if (!specifiers.includes("@/components/layout/SocialPreviewImage")) {
      violations.push(`${toRepoPath(file)} does not import shared social preview image`);
    }
    if (!source.includes("<SocialPreviewImage")) {
      violations.push(`${toRepoPath(file)} does not render SocialPreviewImage`);
    }
    for (const marker of bannedInlineCanvasMarkers) {
      if (source.includes(marker)) {
        violations.push(`${toRepoPath(file)} contains ${marker}`);
      }
    }
  }

  assert.deepEqual(violations, []);
});

test("design-system route preview image reuses shared social canvas", async () => {
  const file = path.join(
    process.cwd(),
    "src",
    "features",
    "design-system",
    "components",
    "DesignSystemRoutePreviewImage.tsx",
  );
  const source = await readFile(file, "utf8");
  const specifiers = collectModuleSpecifiers(file, source);
  const bannedInlineCanvasMarkers = [
    "height: \"100%\"",
    "width: \"100%\"",
    "justifyContent: \"space-between\"",
    "fontFamily: \"Inter, sans-serif\"",
    "fontSize: 62",
  ];

  const violations = bannedInlineCanvasMarkers
    .filter((marker) => source.includes(marker))
    .map((marker) => `${toRepoPath(file)} contains ${marker}`);

  assert.ok(
    specifiers.includes("@/components/layout/SocialPreviewImage"),
    "DesignSystemRoutePreviewImage should reuse the shared social preview image layout",
  );
  assert.ok(
    source.includes("<SocialPreviewImage"),
    "DesignSystemRoutePreviewImage should render SocialPreviewImage",
  );
  assert.deepEqual(violations, []);
});

test("social image route payloads are owned by feature route helpers", async () => {
  const imageFiles = [
    {
      file: path.join(process.cwd(), "src", "app", "opengraph-image.tsx"),
      helper: "getHomeRouteSocialPreviewImage(",
    },
    {
      file: path.join(process.cwd(), "src", "app", "design-system", "opengraph-image.tsx"),
      helper: "getDesignSystemRouteSocialPreviewImage(",
    },
    {
      file: path.join(
        process.cwd(),
        "src",
        "app",
        "design-system",
        "laws-of-ux",
        "opengraph-image.tsx",
      ),
      helper: "getDesignSystemDomainRouteSocialPreviewImage(",
    },
    {
      file: path.join(
        process.cwd(),
        "src",
        "app",
        "design-system",
        "uilaws",
        "opengraph-image.tsx",
      ),
      helper: "getDesignSystemDomainRouteSocialPreviewImage(",
    },
  ];
  const bannedPayloadMarkers = [
    "linear-gradient(",
    "title=\"",
    "description=\"",
    "workflow=\"",
    "background=\"",
  ];

  const violations = [];
  for (const { file, helper } of imageFiles) {
    const source = await readFile(file, "utf8");
    if (!source.includes(helper)) {
      violations.push(`${toRepoPath(file)} does not call ${helper}`);
    }
    for (const marker of bannedPayloadMarkers) {
      if (source.includes(marker)) {
        violations.push(`${toRepoPath(file)} contains ${marker}`);
      }
    }
  }

  assert.deepEqual(violations, []);
});

test("social image metadata constants are shared or feature-owned", async () => {
  const imageFiles = [
    path.join(process.cwd(), "src", "app", "opengraph-image.tsx"),
    path.join(process.cwd(), "src", "app", "design-system", "opengraph-image.tsx"),
    path.join(
      process.cwd(),
      "src",
      "app",
      "design-system",
      "laws-of-ux",
      "opengraph-image.tsx",
    ),
    path.join(
      process.cwd(),
      "src",
      "app",
      "design-system",
      "uilaws",
      "opengraph-image.tsx",
    ),
  ];
  const bannedMetadataMarkers = [
    "contentType = \"image/png\"",
    "alt = \"qwen-ui-lab",
  ];

  const violations = [];
  for (const file of imageFiles) {
    const source = await readFile(file, "utf8");
    if (!source.includes("socialPreviewImageContentType")) {
      violations.push(`${toRepoPath(file)} does not use shared social image content type`);
    }
    for (const marker of bannedMetadataMarkers) {
      if (source.includes(marker)) {
        violations.push(`${toRepoPath(file)} contains ${marker}`);
      }
    }
  }

  assert.deepEqual(violations, []);
});

test("design-system domain redirect pages delegate search-param parsing", async () => {
  const pageFiles = [
    path.join(process.cwd(), "src", "app", "design-system", "laws-of-ux", "page.tsx"),
    path.join(process.cwd(), "src", "app", "design-system", "uilaws", "page.tsx"),
  ];
  const bannedMarkers = [
    "const { lang } = await searchParams",
    "resolveDesignSystemDomainRedirect(",
    "Promise<{ lang?: string }>",
  ];

  const violations = [];
  for (const file of pageFiles) {
    const source = await readFile(file, "utf8");
    const specifiers = collectModuleSpecifiers(file, source);

    if (!specifiers.includes("@/features/design-system/lib/design-system-route")) {
      violations.push(`${toRepoPath(file)} does not import design-system route helpers`);
    }
    if (!source.includes("resolveDesignSystemDomainRedirectFromSearchParams(")) {
      violations.push(
        `${toRepoPath(file)} does not call resolveDesignSystemDomainRedirectFromSearchParams`,
      );
    }
    for (const marker of bannedMarkers) {
      if (source.includes(marker)) {
        violations.push(`${toRepoPath(file)} contains ${marker}`);
      }
    }
  }

  assert.deepEqual(violations, []);
});

test("account route delegates metadata search-param parsing to feature helpers", async () => {
  const file = path.join(process.cwd(), "src", "app", "account", "page.tsx");
  const source = await readFile(file, "utf8");
  const specifiers = collectModuleSpecifiers(file, source);
  const bannedMarkers = [
    "const { lang } = await searchParams",
    "createAccountRouteMetadata(",
    "Promise<{ lang?: string }>",
  ];

  const violations = [];
  if (!specifiers.includes("@/features/account/lib/account-route")) {
    violations.push(`${toRepoPath(file)} does not import account route helpers`);
  }
  if (!source.includes("createAccountRouteMetadataFromParams(")) {
    violations.push(`${toRepoPath(file)} does not call createAccountRouteMetadataFromParams`);
  }
  for (const marker of bannedMarkers) {
    if (source.includes(marker)) {
      violations.push(`${toRepoPath(file)} contains ${marker}`);
    }
  }

  assert.deepEqual(violations, []);
});

test("demo route delegates search-param parsing to feature helpers", async () => {
  const file = path.join(process.cwd(), "src", "app", "demo", "page.tsx");
  const source = await readFile(file, "utf8");
  const specifiers = collectModuleSpecifiers(file, source);
  const bannedMarkers = [
    "const params = await searchParams",
    "resolveSampleReferenceRouteId(",
    "Promise<{ archetype?: string }>",
  ];

  const violations = [];
  if (!specifiers.includes("@/features/demo/lib/demo-route")) {
    violations.push(`${toRepoPath(file)} does not import demo route helpers`);
  }
  if (!source.includes("resolveDemoPageModel(")) {
    violations.push(`${toRepoPath(file)} does not call resolveDemoPageModel`);
  }
  for (const marker of bannedMarkers) {
    if (source.includes(marker)) {
      violations.push(`${toRepoPath(file)} contains ${marker}`);
    }
  }

  assert.deepEqual(violations, []);
});

test("share route delegates page model and metadata parsing to feature helpers", async () => {
  const file = path.join(process.cwd(), "src", "app", "share", "[id]", "page.tsx");
  const source = await readFile(file, "utf8");
  const specifiers = collectModuleSpecifiers(file, source);
  const bannedMarkers = [
    "const { id } = await params",
    "const { lang } = await searchParams",
    "resolveShareRouteSummary(",
    "Promise<{ id: string }>",
    "Promise<{ lang?: string }>",
  ];

  const violations = [];
  if (!specifiers.includes("@/features/share/lib/share-page")) {
    violations.push(`${toRepoPath(file)} does not import share route helpers`);
  }
  if (!source.includes("createShareRouteMetadataFromParams(")) {
    violations.push(`${toRepoPath(file)} does not call createShareRouteMetadataFromParams`);
  }
  if (!source.includes("resolveSharePageModel(")) {
    violations.push(`${toRepoPath(file)} does not call resolveSharePageModel`);
  }
  for (const marker of bannedMarkers) {
    if (source.includes(marker)) {
      violations.push(`${toRepoPath(file)} contains ${marker}`);
    }
  }

  assert.deepEqual(violations, []);
});

test("app route metadata is created by owning feature helpers", async () => {
  const appFiles = (await collectSourceFiles(["src/app"])).filter((file) =>
    sourceModuleExtensions.includes(path.extname(file)),
  );

  const violations = [];
  for (const file of appFiles) {
    const repoPath = toRepoPath(file);
    if (repoPath === "src/app/layout.tsx") continue;

    const source = await readFile(file, "utf8");
    if (source.includes("createRouteMetadata")) {
      violations.push(repoPath);
    }
  }

  assert.deepEqual(violations, []);
});

test("framework entry modules only depend on shared source modules", async () => {
  const violations = [];
  for (const file of collectFrameworkEntryFiles()) {
    const source = await readFile(file, "utf8");
    for (const specifier of collectModuleSpecifiers(file, source)) {
      if (
        specifier.startsWith("@/app/") ||
        specifier.startsWith("@/components/") ||
        specifier.startsWith("@/features/") ||
        specifier.startsWith("./src/app/") ||
        specifier.startsWith("./src/components/") ||
        specifier.startsWith("./src/features/")
      ) {
        violations.push(`${toRepoPath(file)} imports ${specifier}`);
      }
    }
  }

  assert.deepEqual(violations, []);
});

test("automation scripts do not import app routes or UI modules", async () => {
  const violations = [];
  for (const file of await collectScriptFiles()) {
    const source = await readFile(file, "utf8");
    for (const specifier of collectModuleSpecifiers(file, source)) {
      if (
        specifier.startsWith("@/app/") ||
        specifier.startsWith("@/components/") ||
        /^@\/features\/[^/]+\/components\//.test(specifier) ||
        specifier.startsWith("../src/app/") ||
        specifier.startsWith("../src/components/") ||
        /^..\/src\/features\/[^/]+\/components\//.test(specifier)
      ) {
        violations.push(`${toRepoPath(file)} imports ${specifier}`);
      }
    }
  }

  assert.deepEqual(violations, []);
});

test("api route handlers do not import presentation modules", async () => {
  const violations = [];
  for (const file of await collectApiRouteFiles()) {
    const source = await readFile(file, "utf8");
    for (const specifier of collectModuleSpecifiers(file, source)) {
      if (
        specifier.startsWith("@/components/") ||
        /^@\/features\/[^/]+\/components\//.test(specifier) ||
        /^@\/features\/[^/]+\/data\//.test(specifier)
      ) {
        violations.push(`${toRepoPath(file)} imports ${specifier}`);
      }
    }
  }

  assert.deepEqual(violations, []);
});

test("analyze api route delegates orchestration to analysis feature handler", async () => {
  const file = path.join(
    process.cwd(),
    "src",
    "app",
    "api",
    "analyze-ui",
    "route.ts",
  );
  const source = await readFile(file, "utf8");
  const specifiers = collectModuleSpecifiers(file, source);
  const bannedSpecifiers = [
    "@/features/analysis/lib/analyze-ui-rate-limit.mjs",
    "@/features/analysis/lib/analyze-request-validation.mjs",
    "@/features/analysis/lib/qwen-analyze.mjs",
    "@/lib/api-request.mjs",
  ];
  const bannedMarkers = [
    "validateAnalyzeContentLength",
    "checkAnalyzeUiRateLimit",
    "readJsonRequestBody",
    "normalizeAnalyzeRequestBody",
    "analyzeUiImageWithQwen",
    "Response.json(",
  ];

  const violations = [];
  if (!specifiers.includes("@/features/analysis/lib/analyze-ui-api.mjs")) {
    violations.push(`${toRepoPath(file)} does not import analysis API handler`);
  }
  if (!source.includes("handleAnalyzeUiPost(")) {
    violations.push(`${toRepoPath(file)} does not call handleAnalyzeUiPost`);
  }
  for (const specifier of bannedSpecifiers) {
    if (specifiers.includes(specifier)) {
      violations.push(`${toRepoPath(file)} imports ${specifier}`);
    }
  }
  for (const marker of bannedMarkers) {
    if (source.includes(marker)) {
      violations.push(`${toRepoPath(file)} contains ${marker}`);
    }
  }

  assert.deepEqual(violations, []);
});

test("health api route delegates provider health response to analysis feature handler", async () => {
  const file = path.join(process.cwd(), "src", "app", "api", "health", "route.ts");
  const source = await readFile(file, "utf8");
  const specifiers = collectModuleSpecifiers(file, source);
  const bannedSpecifiers = ["@/features/analysis/lib/qwen-analyze.mjs"];
  const bannedMarkers = ["buildAnalyzeHealthResponse", "Response.json("];

  const violations = [];
  if (!specifiers.includes("@/features/analysis/lib/analyze-health-api.mjs")) {
    violations.push(`${toRepoPath(file)} does not import analysis health API handler`);
  }
  if (!source.includes("handleAnalyzeHealthGet(")) {
    violations.push(`${toRepoPath(file)} does not call handleAnalyzeHealthGet`);
  }
  for (const specifier of bannedSpecifiers) {
    if (specifiers.includes(specifier)) {
      violations.push(`${toRepoPath(file)} imports ${specifier}`);
    }
  }
  for (const marker of bannedMarkers) {
    if (source.includes(marker)) {
      violations.push(`${toRepoPath(file)} contains ${marker}`);
    }
  }

  assert.deepEqual(violations, []);
});

test("export api routes delegate orchestration to export feature handlers", async () => {
  const routeFiles = [
    {
      file: path.join(process.cwd(), "src", "app", "api", "export-gist", "route.ts"),
      expectedSpecifier: "@/features/export/lib/export-gist-api.mjs",
      expectedHandlers: ["handleGistExportGet", "handleGistExportPost"],
    },
    {
      file: path.join(process.cwd(), "src", "app", "api", "export-repo", "route.ts"),
      expectedSpecifier: "@/features/export/lib/export-repo-api.mjs",
      expectedHandlers: ["handleRepoExportGet", "handleRepoExportPost"],
    },
  ];
  const bannedSpecifiers = [
    "@/features/export/lib/github-gist.mjs",
    "@/features/export/lib/github-repo.mjs",
    "@/features/export/lib/scaffold-export-request.mjs",
    "@/features/export/lib/scaffold-zip.mjs",
    "@/lib/api-request.mjs",
  ];

  const violations = [];
  for (const { file, expectedSpecifier, expectedHandlers } of routeFiles) {
    const source = await readFile(file, "utf8");
    const specifiers = collectModuleSpecifiers(file, source);
    if (!specifiers.includes(expectedSpecifier)) {
      violations.push(`${toRepoPath(file)} does not import ${expectedSpecifier}`);
    }
    for (const handler of expectedHandlers) {
      if (!source.includes(`${handler}(`)) {
        violations.push(`${toRepoPath(file)} does not call ${handler}`);
      }
    }
    for (const specifier of bannedSpecifiers) {
      if (specifiers.includes(specifier)) {
        violations.push(`${toRepoPath(file)} imports ${specifier}`);
      }
    }
  }

  assert.deepEqual(violations, []);
});

test("github repo export helper does not own scaffold package assembly", async () => {
  const file = path.join(
    process.cwd(),
    "src",
    "features",
    "export",
    "lib",
    "github-repo.mjs",
  );
  const source = await readFile(file, "utf8");
  const bannedImportSpecifiers = [
    "./scaffold-blueprint.mjs",
    "./scaffold-package.mjs",
  ];
  const bannedMarkers = [
    "function buildScaffoldZipEntries",
    "function buildScaffoldPackageFileMap",
    "function buildFallbackScaffoldZipEntries",
    "function buildProductionScaffoldZipEntries",
    "function inferShadcnDependencies",
    "function inferPrimitiveMapFromImports",
    "function extractProductionScaffoldBlueprint",
    "This export is a reviewable package. Import it into source control",
  ];

  const violations = [];
  const importLines = source
    .split(/\r?\n/)
    .filter((line) => line.trimStart().startsWith("import "));
  for (const specifier of bannedImportSpecifiers) {
    if (importLines.some((line) => line.includes(`from "${specifier}"`) || line.includes(`from '${specifier}'`))) {
      violations.push(`${toRepoPath(file)} imports ${specifier}`);
    }
  }
  for (const marker of bannedMarkers) {
    if (source.includes(marker)) {
      violations.push(`${toRepoPath(file)} contains ${marker}`);
    }
  }

  assert.deepEqual(violations, []);
});

test("github gist export helper reuses shared package copy", async () => {
  const file = path.join(
    process.cwd(),
    "src",
    "features",
    "export",
    "lib",
    "github-gist.mjs",
  );
  const source = await readFile(file, "utf8");
  const specifiers = collectModuleSpecifiers(file, source);
  const violations = [];

  if (!specifiers.includes("./scaffold-package-docs.mjs")) {
    violations.push(`${toRepoPath(file)} does not import shared package docs`);
  }
  if (source.includes('const DEFAULT_EXPORT_PACKAGE_DESCRIPTION = "Screenshot UI starter package"')) {
    violations.push(`${toRepoPath(file)} duplicates package description copy`);
  }

  assert.deepEqual(violations, []);
});

test("export package helpers use neutral filename sanitizing", async () => {
  const files = [
    path.join(process.cwd(), "src", "features", "export", "lib", "github-repo.mjs"),
    path.join(process.cwd(), "src", "features", "export", "lib", "scaffold-package.mjs"),
    path.join(process.cwd(), "src", "features", "export", "lib", "scaffold-export-request.mjs"),
  ];
  const violations = [];

  for (const file of files) {
    const source = await readFile(file, "utf8");
    const specifiers = collectModuleSpecifiers(file, source);
    if (specifiers.includes("./github-gist.mjs")) {
      violations.push(`${toRepoPath(file)} imports ./github-gist.mjs for filename sanitizing`);
    }
    if (!specifiers.includes("./scaffold-filename.mjs")) {
      violations.push(`${toRepoPath(file)} does not import neutral filename helper`);
    }
  }

  assert.deepEqual(violations, []);
});

test("export tests import package builders from focused modules", async () => {
  const testFiles = [
    path.join(process.cwd(), "tests", "github-repo.test.mjs"),
    path.join(process.cwd(), "tests", "offline-analyze.test.mjs"),
    path.join(process.cwd(), "tests", "scaffold-zip.test.mjs"),
  ];
  const bannedNames = [
    "buildScaffoldZipEntries",
    "buildScaffoldPackageFileMap",
    "extractProductionScaffoldBlueprint",
  ];
  const violations = [];

  for (const file of testFiles) {
    const source = await readFile(file, "utf8");
    const githubRepoImportMatch = /import\s*\{([\s\S]*?)\}\s*from\s*["']\.\.\/src\/features\/export\/lib\/github-repo\.mjs["']/.exec(source);
    if (!githubRepoImportMatch) continue;
    const importedNames = githubRepoImportMatch[1]
      .split(",")
      .map((name) => name.trim())
      .filter(Boolean);
    for (const name of bannedNames) {
      if (importedNames.includes(name)) {
        violations.push(`${toRepoPath(file)} imports ${name} from github-repo.mjs`);
      }
    }
  }

  assert.deepEqual(violations, []);
});

test("csp report api route delegates parsing and logging to shared csp helper", async () => {
  const file = path.join(
    process.cwd(),
    "src",
    "app",
    "api",
    "security",
    "csp-report",
    "route.ts",
  );
  const source = await readFile(file, "utf8");
  const specifiers = collectModuleSpecifiers(file, source);
  const bannedMarkers = [
    "request.json(",
    "normalizeCspReportPayload",
    "console.warn",
    "documentUri:",
    "violatedDirective:",
    "blockedUri:",
  ];

  const violations = bannedMarkers
    .filter((marker) => source.includes(marker))
    .map((marker) => `${toRepoPath(file)} contains ${marker}`);

  assert.ok(
    specifiers.includes("@/lib/csp-report.mjs"),
    "src/app/api/security/csp-report/route.ts should consume the shared CSP report helper",
  );
  assert.ok(
    source.includes("handleCspReportPost("),
    "src/app/api/security/csp-report/route.ts should delegate to handleCspReportPost",
  );
  assert.deepEqual(violations, []);
});

test("e2e tests do not import application internals", async () => {
  const violations = [];
  for (const file of await collectE2eSourceFiles()) {
    const source = await readFile(file, "utf8");
    for (const specifier of collectModuleSpecifiers(file, source)) {
      if (
        specifier.startsWith("@/") ||
        specifier.startsWith("../src/") ||
        specifier.startsWith("./src/")
      ) {
        violations.push(`${toRepoPath(file)} imports ${specifier}`);
      }
    }
  }

  assert.deepEqual(violations, []);
});

test("feature source files live in recognized ownership folders", async () => {
  const featureFiles = (await collectSourceFiles(["src/features"])).filter((file) =>
    sourceModuleExtensions.includes(path.extname(file)),
  );

  const violations = [];
  for (const file of featureFiles) {
    const repoPath = toRepoPath(file);
    const [, featureName, folderName] =
      repoPath.match(/^src\/features\/([^/]+)\/([^/]+)\//) ?? [];

    if (!featureName || !allowedFeatureFolders.has(folderName)) {
      violations.push(repoPath);
    }
  }

  assert.deepEqual(violations, []);
});

test("shared modules do not import feature modules", async () => {
  const sharedFiles = (await collectSourceFiles(["src/components", "src/lib"])).filter((file) =>
    sourceModuleExtensions.includes(path.extname(file)),
  );

  const violations = [];
  for (const file of sharedFiles) {
    const source = await readFile(file, "utf8");
    for (const specifier of collectModuleSpecifiers(file, source)) {
      if (specifier.startsWith("@/features/")) {
        violations.push(`${toRepoPath(file)} imports ${specifier}`);
      }
    }
  }

  assert.deepEqual(violations, []);
});

test("shared lib modules do not import UI, provider, app, or feature modules", async () => {
  const libFiles = (await collectSourceFiles(["src/lib"])).filter((file) =>
    sourceModuleExtensions.includes(path.extname(file)),
  );
  const blockedImportPrefixes = [
    "@/app/",
    "@/components/",
    "@/features/",
  ];
  const blockedRelativeSegments = [
    "/app/",
    "/components/",
    "/features/",
  ];

  const violations = [];
  for (const file of libFiles) {
    const source = await readFile(file, "utf8");
    for (const specifier of collectModuleSpecifiers(file, source)) {
      if (blockedImportPrefixes.some((prefix) => specifier.startsWith(prefix))) {
        violations.push(`${toRepoPath(file)} imports ${specifier}`);
        continue;
      }

      if (!specifier.startsWith(".")) continue;
      const resolvedPath = toRepoPath(path.resolve(path.dirname(file), specifier));
      if (blockedRelativeSegments.some((segment) => resolvedPath.includes(segment))) {
        violations.push(`${toRepoPath(file)} imports ${specifier}`);
      }
    }
  }

  assert.deepEqual(violations, []);
});

test("ui primitives do not import provider or feature modules", async () => {
  const uiFiles = (await collectSourceFiles(["src/components/ui"])).filter((file) =>
    sourceModuleExtensions.includes(path.extname(file)),
  );

  const violations = [];
  for (const file of uiFiles) {
    const source = await readFile(file, "utf8");
    for (const specifier of collectModuleSpecifiers(file, source)) {
      if (
        specifier.startsWith("@/components/providers/") ||
        specifier.startsWith("@/features/")
      ) {
        violations.push(`${toRepoPath(file)} imports ${specifier}`);
      }
    }
  }

  assert.deepEqual(violations, []);
});

test("shared lib modules do not contain JSX component files", async () => {
  const libFiles = await collectFiles(path.join(process.cwd(), "src", "lib"));
  const violations = libFiles
    .filter((file) => path.extname(file) === ".tsx")
    .map(toRepoPath);

  assert.deepEqual(violations, []);
});

test("shared lib client modules use explicit client entry names", async () => {
  const libFiles = (await collectSourceFiles(["src/lib"])).filter((file) =>
    [".ts", ".tsx"].includes(path.extname(file)),
  );

  const violations = [];
  for (const file of libFiles) {
    const source = await readFile(file, "utf8");
    if (!/^\s*["']use client["'];?/.test(source)) continue;

    const repoPath = toRepoPath(file);
    const isNamedClientEntry = path.basename(file).includes(".client.");
    const isClientHook = repoPath.startsWith("src/lib/hooks/");
    if (!isNamedClientEntry && !isClientHook) {
      violations.push(repoPath);
    }
  }

  assert.deepEqual(violations, []);
});

test("shared lib browser helpers use explicit client entry names", async () => {
  const libFiles = (await collectSourceFiles(["src/lib"])).filter((file) =>
    sourceModuleExtensions.includes(path.extname(file)),
  );
  const browserGlobalPatterns = [
    "window.",
    "document.",
    "navigator.",
    "localStorage.",
    "sessionStorage.",
    "typeof localStorage",
    "typeof sessionStorage",
    "return localStorage",
    "return sessionStorage",
  ];

  const violations = [];
  for (const file of libFiles) {
    const source = await readFile(file, "utf8");
    if (!browserGlobalPatterns.some((pattern) => source.includes(pattern))) continue;

    const repoPath = toRepoPath(file);
    const isNamedClientEntry = path.basename(file).includes(".client.");
    const isClientHook = repoPath.startsWith("src/lib/hooks/");
    if (!isNamedClientEntry && !isClientHook) {
      violations.push(repoPath);
    }
  }

  assert.deepEqual(violations, []);
});

test("feature lib browser helpers use explicit client entry names", async () => {
  const featureLibFiles = (await collectSourceFiles(["src/features"])).filter((file) => {
    const repoPath = toRepoPath(file);
    return repoPath.includes("/lib/") && sourceModuleExtensions.includes(path.extname(file));
  });
  const browserGlobalPatterns = [
    "window.",
    "document.",
    "navigator.",
    "localStorage.",
    "sessionStorage.",
    "typeof localStorage",
    "typeof sessionStorage",
    "return localStorage",
    "return sessionStorage",
  ];

  const violations = [];
  for (const file of featureLibFiles) {
    const source = await readFile(file, "utf8");
    if (!browserGlobalPatterns.some((pattern) => source.includes(pattern))) continue;

    if (!path.basename(file).includes(".client.")) {
      violations.push(toRepoPath(file));
    }
  }

  assert.deepEqual(violations, []);
});

test("share result core remains server-safe", async () => {
  const file = path.join(
    process.cwd(),
    "src",
    "features",
    "share",
    "lib",
    "share-result.mjs",
  );
  const source = await readFile(file, "utf8");
  const browserGlobalPatterns = [
    "window.",
    "document.",
    "navigator.",
    "localStorage.",
    "sessionStorage.",
  ];

  const violations = browserGlobalPatterns
    .filter((pattern) => source.includes(pattern))
    .map((pattern) => `${toRepoPath(file)} uses ${pattern}`);

  assert.deepEqual(violations, []);
});

test("sample reference components delegate sample helpers through demo lib", async () => {
  const demoComponentFiles = (await collectSourceFiles(["src/features/demo/components"])).filter(
    (file) => sourceModuleExtensions.includes(path.extname(file)),
  );

  const violations = [];
  for (const file of demoComponentFiles) {
    const source = await readFile(file, "utf8");
    for (const specifier of collectModuleSpecifiers(file, source)) {
      if (specifier === "@/features/analysis/lib/demo-archetypes.mjs") {
        violations.push(`${toRepoPath(file)} imports ${specifier}`);
      }
    }
  }

  assert.deepEqual(violations, []);
});

test("demo client components do not import route metadata helpers", async () => {
  const demoComponentFiles = (await collectSourceFiles(["src/features/demo/components"])).filter(
    (file) => sourceModuleExtensions.includes(path.extname(file)),
  );

  const violations = [];
  for (const file of demoComponentFiles) {
    const source = await readFile(file, "utf8");
    for (const specifier of collectModuleSpecifiers(file, source)) {
      if (
        specifier === "../lib/demo-route" ||
        specifier === "@/features/demo/lib/demo-route"
      ) {
        violations.push(`${toRepoPath(file)} imports ${specifier}`);
      }
    }
  }

  assert.deepEqual(violations, []);
});

test("i18n root entry remains server-safe", async () => {
  const file = path.join(process.cwd(), "src", "lib", "i18n", "index.ts");
  const source = await readFile(file, "utf8");
  const violations = collectModuleSpecifiers(file, source)
    .filter((specifier) => specifier.includes(".client") || specifier.includes("use-locale"))
    .map((specifier) => `${toRepoPath(file)} exports ${specifier}`);

  assert.deepEqual(violations, []);
});

test("feature data folders do not contain JSX component modules", async () => {
  const featureFiles = await collectFiles(path.join(process.cwd(), "src", "features"));
  const violations = featureFiles
    .filter((file) => toRepoPath(file).includes("/data/"))
    .filter((file) => path.extname(file) === ".tsx")
    .map(toRepoPath);

  assert.deepEqual(violations, []);
});

test("feature lib and data modules do not import component modules", async () => {
  const featureFiles = (await collectSourceFiles(["src/features"])).filter((file) =>
    sourceModuleExtensions.includes(path.extname(file)),
  );

  const violations = [];
  for (const file of featureFiles) {
    const repoPath = toRepoPath(file);
    if (!repoPath.includes("/lib/") && !repoPath.includes("/data/")) continue;

    const source = await readFile(file, "utf8");
    for (const specifier of collectModuleSpecifiers(file, source)) {
      if (
        specifier.startsWith("@/components/") ||
        /^@\/features\/[^/]+\/components\//.test(specifier) ||
        specifier.includes("/components/")
      ) {
        violations.push(`${repoPath} imports ${specifier}`);
      }
    }
  }

  assert.deepEqual(violations, []);
});

test("feature modules use relative imports within their own feature", async () => {
  const featureFiles = (await collectSourceFiles(["src/features"])).filter((file) =>
    [".ts", ".tsx", ".mjs"].includes(path.extname(file)),
  );

  const violations = [];
  for (const file of featureFiles) {
    const repoPath = toRepoPath(file);
    const [, featureName] = repoPath.match(/^src\/features\/([^/]+)\//) ?? [];
    if (!featureName) continue;

    const source = await readFile(file, "utf8");
    const ownFeaturePrefix = `@/features/${featureName}/`;
    for (const specifier of collectModuleSpecifiers(file, source)) {
      if (specifier.startsWith(ownFeaturePrefix)) {
        violations.push(`${repoPath} imports ${specifier}`);
      }
    }
  }

  assert.deepEqual(violations, []);
});

test("shared component modules use relative imports for shared components", async () => {
  const componentFiles = (await collectSourceFiles(["src/components"])).filter((file) =>
    [".ts", ".tsx", ".mjs"].includes(path.extname(file)),
  );

  const violations = [];
  for (const file of componentFiles) {
    const source = await readFile(file, "utf8");
    for (const specifier of collectModuleSpecifiers(file, source)) {
      if (specifier.startsWith("@/components/")) {
        violations.push(`${toRepoPath(file)} imports ${specifier}`);
      }
    }
  }

  assert.deepEqual(violations, []);
});

test("shared lib modules use relative imports within shared lib", async () => {
  const libFiles = (await collectSourceFiles(["src/lib"])).filter((file) =>
    [".ts", ".tsx", ".mjs"].includes(path.extname(file)),
  );

  const violations = [];
  for (const file of libFiles) {
    const source = await readFile(file, "utf8");
    for (const specifier of collectModuleSpecifiers(file, source)) {
      if (specifier.startsWith("@/lib/")) {
        violations.push(`${toRepoPath(file)} imports ${specifier}`);
      }
    }
  }

  assert.deepEqual(violations, []);
});

test("source modules do not contain circular imports", async () => {
  const sourceFiles = (await collectSourceFiles([
    "src/app",
    "src/components",
    "src/features",
    "src/lib",
  ]))
    .filter((file) => sourceModuleExtensions.includes(path.extname(file)) && !file.endsWith(".d.ts"))
    .concat(collectFrameworkEntryFiles());
  const sourceFileSet = new Set(sourceFiles.map((file) => path.normalize(file)));
  const graph = new Map(sourceFiles.map((file) => [path.normalize(file), []]));

  for (const file of sourceFiles) {
    const source = await readFile(file, "utf8");
    for (const specifier of collectModuleSpecifiers(file, source)) {
      const resolvedFile = resolveSourceModule(specifier, file, sourceFileSet);
      if (resolvedFile) {
        graph.get(path.normalize(file)).push(resolvedFile);
      }
    }
  }

  assert.deepEqual(findImportCycles(graph), []);
});

test("source and docs avoid removed compatibility import paths", async () => {
  const sourceFiles = [
    ...(await collectSourceFiles(["src", "docs"])),
    ...collectFrameworkEntryFiles(),
  ];
  const bannedImports = [
    "@/lib/cn",
    "@/lib/analytics",
    "@/lib/analytics-event-buffer",
    "@/lib/clipboard",
    "@/lib/i18n/use-locale",
    "@/components/providers",
    "@/components/ui/sonner",
    "@/components/ui/textarea",
    "@/features/account/lib/auth",
    "@/features/analytics/lib/analytics-event-buffer",
    "@/features/analysis/lib/demo-archetypes.mjs",
    "@/features/analysis/lib/session-history",
    "@/features/design-system/components/AtomicSection",
    "@/features/design-system/data/atomicCatalog",
    "@/features/design-system/data/lawsOfUx",
    "@/features/design-system/lib/laws-of-ux-reference",
    "@/features/shell/components/ProviderModeBadge",
  ];

  const violations = [];
  for (const file of sourceFiles) {
    const source = await readFile(file, "utf8");
    for (const bannedImport of bannedImports) {
      if (source.includes(`"${bannedImport}"`) || source.includes(`'${bannedImport}'`)) {
        violations.push(`${toRepoPath(file)} imports ${bannedImport}`);
      }
    }
  }

  assert.deepEqual(violations, []);
});
