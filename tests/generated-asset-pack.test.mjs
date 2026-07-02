import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import test from "node:test";

const GENERATED_ASSET_ROOT = "public/generated-assets";

function readPngSize(filePath) {
  const buffer = readFileSync(filePath);
  assert.equal(buffer.readUInt32BE(0), 0x89504e47);
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  };
}

function readWebpSize(filePath) {
  const buffer = readFileSync(filePath);
  assert.equal(buffer.toString("ascii", 0, 4), "RIFF");
  assert.equal(buffer.toString("ascii", 8, 12), "WEBP");

  const chunk = buffer.toString("ascii", 12, 16);
  if (chunk === "VP8X") {
    return {
      width: 1 + buffer.readUIntLE(24, 3),
      height: 1 + buffer.readUIntLE(27, 3),
    };
  }

  if (chunk === "VP8 ") {
    return {
      width: buffer.readUInt16LE(26) & 0x3fff,
      height: buffer.readUInt16LE(28) & 0x3fff,
    };
  }

  if (chunk === "VP8L") {
    const b0 = buffer[21];
    const b1 = buffer[22];
    const b2 = buffer[23];
    const b3 = buffer[24];
    return {
      width: 1 + (((b1 & 0x3f) << 8) | b0),
      height: 1 + (((b3 & 0x0f) << 10) | (b2 << 2) | ((b1 & 0xc0) >> 6)),
    };
  }

  throw new Error(`Unsupported WebP chunk ${chunk} in ${filePath}`);
}

function readImageSize(filePath) {
  if (filePath.endsWith(".png")) return readPngSize(filePath);
  if (filePath.endsWith(".webp")) return readWebpSize(filePath);
  throw new Error(`Unsupported image type: ${filePath}`);
}

function readyAssetRows() {
  const source = readFileSync("GENERATED_ASSET_PACK.md", "utf8");
  const rows = [];
  const pattern =
    /^\|[^|]+\|[^|]+\|\s*`(?<path>public\/generated-assets\/[^`]+)`\s*\|\s*(?<width>\d+)x(?<height>\d+)\s*\|$/gm;

  for (const match of source.matchAll(pattern)) {
    rows.push({
      path: match.groups.path,
      width: Number(match.groups.width),
      height: Number(match.groups.height),
    });
  }

  return rows;
}

function generatedAssetFiles() {
  const files = [];
  const root = join(process.cwd(), GENERATED_ASSET_ROOT);

  function walk(directory) {
    for (const entry of readdirSync(directory)) {
      const fullPath = join(directory, entry);
      if (statSync(fullPath).isDirectory()) {
        walk(fullPath);
      } else {
        files.push(relative(process.cwd(), fullPath).replaceAll("\\", "/"));
      }
    }
  }

  walk(root);
  return files.sort();
}

function isDocumentedRawRender(filePath) {
  return (
    /^public\/generated-assets\/social\/(?!.*-1200x630\.png$)[^/]+\.png$/.test(filePath) ||
    /^public\/generated-assets\/references\/[^/]+-generated\.png$/.test(filePath) ||
    filePath === "public/generated-assets/docs/before-after-comparison-generated.png" ||
    filePath === "public/generated-assets/backgrounds/qwen-ui-lab-abstract-background.png"
  );
}

function textFilesUnder(directory) {
  const files = [];
  const root = join(process.cwd(), directory);

  function walk(current) {
    for (const entry of readdirSync(current)) {
      const fullPath = join(current, entry);
      const repoPath = relative(process.cwd(), fullPath).replaceAll("\\", "/");
      if (repoPath.startsWith(`${GENERATED_ASSET_ROOT}/`)) continue;
      if (statSync(fullPath).isDirectory()) {
        walk(fullPath);
      } else {
        files.push(repoPath);
      }
    }
  }

  walk(root);
  return files;
}

test("generated asset pack ready table matches files and image dimensions", () => {
  const rows = readyAssetRows();
  assert.ok(
    rows.length >= 10,
    "expected documented generated asset candidates",
  );

  for (const row of rows) {
    const filePath = join(process.cwd(), row.path);
    assert.equal(existsSync(filePath), true, `${row.path} should exist`);
    assert.deepEqual(readImageSize(filePath), {
      width: row.width,
      height: row.height,
    });
  }
});

test("generated asset files are either ready candidates or documented raw renders", () => {
  const readyPaths = new Set(readyAssetRows().map((row) => row.path));
  const undocumented = generatedAssetFiles().filter(
    (filePath) => !readyPaths.has(filePath) && !isDocumentedRawRender(filePath),
  );

  assert.deepEqual(undocumented, []);
});

test("candidate-only generated assets are not wired into runtime public or source files", () => {
  const runtimeFiles = [
    ...textFilesUnder("src"),
    ...textFilesUnder("public").filter((filePath) => !filePath.startsWith(`${GENERATED_ASSET_ROOT}/`)),
  ];

  const references = runtimeFiles
    .filter((filePath) => !filePath.endsWith(".png") && !filePath.endsWith(".webp") && !filePath.endsWith(".ico"))
    .filter((filePath) => readFileSync(filePath, "utf8").includes("generated-assets"));

  assert.deepEqual(references, []);
});
