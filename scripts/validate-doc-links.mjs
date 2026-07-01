#!/usr/bin/env node
/**
 * Validates local Markdown links in README.md and docs/.
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { pathToFileURL } from "node:url";

const DOC_ROOTS = ["README.md", "docs"];
const MARKDOWN_LINK_PATTERN = /\[[^\]]+\]\(([^)]+)\)/g;
const MARKDOWN_HEADING_PATTERN = /^(#{1,6})\s+(.+)$/gm;

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
  if (!trimmed) return null;
  if (/^[a-z][a-z0-9+.-]*:/i.test(trimmed)) return null;
  return trimmed
    .replace(/^<(.+)>$/, "$1")
    .replace(/\s+(?:"[^"]*"|'[^']*')$/, "")
    .trim();
}

function decodeTarget(target) {
  try {
    return decodeURIComponent(target);
  } catch {
    return target;
  }
}

function parseLocalTarget(rawTarget) {
  const decorated = stripLinkDecorations(rawTarget);
  if (!decorated) return null;

  const hashIndex = decorated.indexOf("#");
  const pathTarget =
    hashIndex === -1 ? decorated : decorated.slice(0, hashIndex).trim();
  const anchor =
    hashIndex === -1 ? "" : decodeTarget(decorated.slice(hashIndex + 1).trim());

  return {
    pathTarget,
    anchor,
    displayTarget: rawTarget.trim(),
  };
}

function slugHeading(heading) {
  return heading
    .replace(/<[^>]+>/g, "")
    .replace(/[`*_~[\]]/g, "")
    .trim()
    .toLowerCase()
    .replace(/&amp;/g, "and")
    .replace(/[^\p{Letter}\p{Number}\s-]/gu, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function collectMarkdownAnchors(source) {
  const anchors = new Set();
  const counts = new Map();

  for (const match of source.matchAll(MARKDOWN_HEADING_PATTERN)) {
    const baseSlug = slugHeading(match[2]);
    if (!baseSlug) continue;

    const count = counts.get(baseSlug) ?? 0;
    counts.set(baseSlug, count + 1);
    anchors.add(count === 0 ? baseSlug : `${baseSlug}-${count}`);
  }

  return anchors;
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
      const target = parseLocalTarget(match[1]);
      if (!target) continue;

      const resolved = resolve(dirname(file), decodeTarget(target.pathTarget || file));
      const displayFile = relative(repoRoot, file);
      const displayTarget = target.displayTarget;

      if (!isInsidePath(repoRoot, resolved)) {
        issues.push(`${displayFile} links outside repo: ${displayTarget}`);
        continue;
      }

      if (!existsSync(resolved)) {
        issues.push(`${displayFile} has missing link target: ${displayTarget}`);
        continue;
      }

      if (target.anchor && resolved.endsWith(".md")) {
        const targetSource = readFileSync(resolved, "utf8");
        const anchors = collectMarkdownAnchors(targetSource);
        if (!anchors.has(target.anchor.toLowerCase())) {
          issues.push(`${displayFile} has missing anchor: ${displayTarget}`);
        }
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
