#!/usr/bin/env node
/**
 * Validates local Markdown links in README.md and docs/.
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";

const REPO_ROOT = process.cwd();
const DOC_ROOTS = ["README.md", "docs"];
const MARKDOWN_LINK_PATTERN = /\[[^\]]+\]\(([^)]+)\)/g;

function fail(message) {
  console.error(`Docs link validation failed: ${message}`);
  process.exitCode = 1;
}

function collectMarkdownFiles(path) {
  const absolute = resolve(REPO_ROOT, path);
  if (!existsSync(absolute)) return [];
  const entry = readdirSync(dirname(absolute), { withFileTypes: true }).find(
    (item) => item.name === absolute.split(/[\\/]/).pop(),
  );

  if (entry?.isFile()) {
    return path.endsWith(".md") ? [absolute] : [];
  }

  const files = [];
  const stack = [absolute];
  while (stack.length) {
    const dir = stack.pop();
    for (const item of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, item.name);
      if (item.isDirectory()) {
        stack.push(full);
      } else if (item.isFile() && item.name.endsWith(".md")) {
        files.push(full);
      }
    }
  }
  return files;
}

function stripLinkDecorations(rawTarget) {
  const trimmed = rawTarget.trim();
  if (!trimmed || trimmed.startsWith("#")) return null;
  if (/^[a-z][a-z0-9+.-]*:/i.test(trimmed)) return null;
  const withoutAnchor = trimmed.split("#")[0].trim();
  return withoutAnchor || null;
}

function decodeTarget(target) {
  try {
    return decodeURIComponent(target);
  } catch {
    return target;
  }
}

const markdownFiles = [...new Set(DOC_ROOTS.flatMap(collectMarkdownFiles))].sort();

for (const file of markdownFiles) {
  const source = readFileSync(file, "utf8");
  for (const match of source.matchAll(MARKDOWN_LINK_PATTERN)) {
    const target = stripLinkDecorations(match[1]);
    if (!target) continue;

    const resolved = resolve(dirname(file), decodeTarget(target));
    const displayFile = relative(REPO_ROOT, file);
    const displayTarget = match[1].trim();

    if (!resolved.startsWith(REPO_ROOT)) {
      fail(`${displayFile} links outside repo: ${displayTarget}`);
      continue;
    }

    if (!existsSync(resolved)) {
      fail(`${displayFile} has missing link target: ${displayTarget}`);
    }
  }
}

if (!process.exitCode) {
  console.log(`Docs link validation passed (${markdownFiles.length} Markdown files).`);
}
