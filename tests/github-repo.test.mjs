import assert from "node:assert/strict";
import test from "node:test";
import {
  buildRepoCompareExport,
  buildScaffoldReadme,
  buildScaffoldZipEntries,
  canUseGithubRepoExport,
  getGithubRepoExportConfig,
  parseGithubRepoSlug,
} from "../src/features/export/lib/github-repo.mjs";

test("canUseGithubRepoExport mirrors gist token detection", () => {
  assert.equal(canUseGithubRepoExport({}), false);
  assert.equal(canUseGithubRepoExport({ GITHUB_TOKEN: "ghp_test" }), true);
});

test("parseGithubRepoSlug accepts owner/repo", () => {
  assert.deepEqual(parseGithubRepoSlug("Iron-Mark/qwen-ui-lab"), {
    owner: "Iron-Mark",
    repo: "qwen-ui-lab",
  });
  assert.equal(parseGithubRepoSlug("invalid"), null);
});

test("getGithubRepoExportConfig uses defaults and overrides", () => {
  assert.deepEqual(getGithubRepoExportConfig({}), {
    owner: "Iron-Mark",
    repo: "qwen-ui-lab",
    base: "main",
  });
  assert.deepEqual(
    getGithubRepoExportConfig({
      GITHUB_EXPORT_REPO: "acme/widgets",
      GITHUB_EXPORT_BASE: "develop",
    }),
    { owner: "acme", repo: "widgets", base: "develop" },
  );
});

test("buildRepoCompareExport returns compare URL and instructions", () => {
  const result = buildRepoCompareExport({
    owner: "Iron-Mark",
    repo: "qwen-ui-lab",
    base: "main",
    filename: "generated-auth.tsx",
    description: "demo export",
  });

  assert.match(result.url, /^https:\/\/github\.com\/Iron-Mark\/qwen-ui-lab\/compare\//);
  assert.match(result.url, /generated-auth\.tsx/);
  assert.match(result.branch, /^qwen-ui-lab-export-/);
  assert.ok(result.instructions.length > 10);
});

test("buildScaffoldZipEntries includes readme and sanitized filename", () => {
  const entries = buildScaffoldZipEntries({
    content: "export const x = 1;",
    filename: "../evil/name.tsx",
    description: "test",
  });

  assert.equal(entries.length, 2);
  assert.equal(entries[0].name, "README.md");
  assert.match(entries[0].content, /test/);
  assert.equal(entries[1].name, "name.tsx");
  assert.equal(entries[1].content, "export const x = 1;");
});

test("buildScaffoldReadme documents the scaffold file", () => {
  const readme = buildScaffoldReadme({
    filename: "generated-dashboard.tsx",
    description: "Dashboard export",
  });
  assert.match(readme, /generated-dashboard\.tsx/);
  assert.match(readme, /Dashboard export/);
});
