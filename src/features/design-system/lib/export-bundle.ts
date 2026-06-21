import type { AtomicCatalogEntry } from "../data/catalog-types";

export function buildCatalogBundle(entries: AtomicCatalogEntry[]) {
  const header = `// qwen-ui-lab design system bundle
// Generated ${new Date().toISOString()}
// ${entries.length} components\n\n`;

  const body = entries
    .map(
      (entry) =>
        `// --- ${entry.name} (${entry.level}) ---\n// ${entry.description}\n\n${entry.code}\n`,
    )
    .join("\n");

  return header + body;
}
