#!/usr/bin/env node
/**
 * Validates local Markdown links in README.md and docs/.
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { pathToFileURL } from "node:url";

const DOC_ROOTS = ["README.md", "docs"];
const MARKDOWN_LINK_PATTERN = /\[[^\]]+\]\(([^)]+)\)/g;

function collectMarkdownFiles(path, repoRoot = process.cwd()) {
  const absolute = resolve(repoRoot, path);
  if (!existsSync(absolute)) return [];
  const name = absolute.split(/[\\/]/).pop();
  const entry = readdirSync(dirname(absolute), { withFileTypes: true }).find(
    (item) => item.name === name,
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

function isInsidePath(parent, child) {
  const parentPath = resolve(parent);
  const childPath = resolve(child);
  const childRelativePath = relative(parentPath, childPath);

  return (
    childRelativePath === "" ||
    (!childRelativePath.startsWith(`..${sep}`) &&
      childRelativePath !== ".." &&
      !isAbsolute(childRelativePath))
  );
}

function stripLinkDecorations(rawTarget) {
  const trimmed = rawTarget.trim();
  if (!trimmed || trimmed.startsWith("#")) return null;
  if (/^[a-z][a-z0-9+.-]*:/i.test(trimmed)) return null;
  const withoutTitle = trimmed
    .replace(/^<(.+)>$/, "$1")
    .replace(/\s+(?:"[^"]*"|'[^']*')$/, "")
    .trim();
  const withoutAnchor = withoutTitle.split("#")[0].trim();
  return withoutAnchor || null;
}

function decodeTarget(target) {
  try {
    return decodeURIComponent(target);
  } catch {
    return target;
  }
}

export function validateDocLinks({
  repoRoot = process.cwd(),
  roots = DOC_ROOTS,
} = {}) {
  const issues = [];
  const markdownFiles = [
    ...new Set(roots.flatMap((root) => collectMarkdownFiles(root, repoRoot))),
  ].sort();

  for (const file of markdownFiles) {
    const source = readFileSync(file, "utf8");
    for (const match of source.matchAll(MARKDOWN_LINK_PATTERN)) {
      const target = stripLinkDecorations(match[1]);
      if (!target) continue;

      const resolved = resolve(dirname(file), decodeTarget(target));
      const displayFile = relative(repoRoot, file);
      const displayTarget = match[1].trim();

      if (!isInsidePath(repoRoot, resolved)) {
        issues.push(`${displayFile} links outside repo: ${displayTarget}`);
        continue;
      }

      if (!existsSync(resolved)) {
        issues.push(`${displayFile} has missing link target: ${displayTarget}`);
      }
    }
  }

  return { checkedFileCount: markdownFiles.length, issues };
}

function runCli() {
  const result = validateDocLinks();

  for (const issue of result.issues) {
    console.error(`Docs link validation failed: ${issue}`);
  }

  if (result.issues.length) {
    process.exitCode = 1;
    return;
  }

  console.log(
    `Docs link validation passed (${result.checkedFileCount} Markdown files).`,
  );
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  runCli();
}
