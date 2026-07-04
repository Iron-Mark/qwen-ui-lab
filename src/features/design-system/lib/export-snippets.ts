import type { AtomicCatalogEntry } from "../data/catalog-types";

export function buildCatalogSnippets(entries: AtomicCatalogEntry[]) {
  const header = `// qwen-ui-lab design system snippets
// Exported ${new Date().toISOString()}
// ${entries.length} snippets\n\n`;

  const body = entries
    .map(
      (entry) =>
        `// --- ${entry.name} (${entry.level}) ---\n// ${entry.description}\n\n${entry.code}\n`,
    )
    .join("\n");

  return header + body;
}
