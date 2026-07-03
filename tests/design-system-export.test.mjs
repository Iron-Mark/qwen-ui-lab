import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const exportSnippetsSource = readFileSync(
  join("src", "features", "design-system", "lib", "export-snippets.ts"),
  "utf8",
);
const exportSnippetsClientSource = readFileSync(
  join("src", "features", "design-system", "lib", "export-snippets.client.ts"),
  "utf8",
);
const designSystemPreviewSource = readFileSync(
  join("src", "features", "design-system", "components", "DesignSystemPreview.tsx"),
  "utf8",
);
const analyticsSource = readFileSync(
  join("src", "lib", "analytics.client.ts"),
  "utf8",
);

test("design-system export download uses snippets language", () => {
  assert.match(exportSnippetsSource, /function buildCatalogSnippets/);
  assert.match(exportSnippetsClientSource, /function downloadCatalogSnippets/);
  assert.match(exportSnippetsSource, /qwen-ui-lab design system snippets/);
  assert.match(exportSnippetsSource, /\/\/ Exported \$\{new Date\(\)\.toISOString\(\)\}/);
  assert.match(
    exportSnippetsClientSource,
    /qwen-ui-lab-design-system-snippets\.tsx/,
  );

  assert.doesNotMatch(exportSnippetsSource, /function buildCatalogBundle/);
  assert.doesNotMatch(exportSnippetsSource, /\/\/ Generated/);
  assert.doesNotMatch(exportSnippetsClientSource, /function downloadCatalogBundle/);
  assert.doesNotMatch(exportSnippetsSource, /design system bundle/i);
  assert.doesNotMatch(exportSnippetsClientSource, /design-system-bundle/i);
});

test("design-system page wires export-all snippets action", () => {
  assert.match(
    designSystemPreviewSource,
    /import \{ downloadCatalogSnippets \} from "\.\.\/lib\/export-snippets\.client"/,
  );
  assert.match(designSystemPreviewSource, /const exportVisibleSnippets = useCallback/);
  assert.match(designSystemPreviewSource, /downloadCatalogSnippets\(filtered\)/);
  assert.match(designSystemPreviewSource, /disabled=\{!filtered\.length\}/);
  assert.match(designSystemPreviewSource, /onClick=\{exportVisibleSnippets\}/);
  assert.match(designSystemPreviewSource, /toast\(t\.snippetsDownloaded, "success"\)/);
  assert.doesNotMatch(designSystemPreviewSource, /t\.bundleDownloaded/);
  assert.match(
    designSystemPreviewSource,
    /AnalyticsEvent\.DesignSystemSnippetsDownloaded/,
  );
  assert.match(
    analyticsSource,
    /DesignSystemSnippetsDownloaded: "design_system\.snippets_downloaded"/,
  );
});
