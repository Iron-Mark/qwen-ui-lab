import type { AtomicCatalogEntry } from "@/features/design-system/data/catalog-types";
import { downloadTextFile } from "@/lib/clipboard";

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

export function downloadCatalogBundle(
  entries: AtomicCatalogEntry[],
  filename = "qwen-ui-lab-design-system-bundle.tsx",
) {
  downloadTextFile(
    buildCatalogBundle(entries),
    filename,
    "text/plain;charset=utf-8",
  );
}
