import { downloadTextFile } from "@/lib/clipboard.client";
import type { AtomicCatalogEntry } from "../data/catalog-types";
import { buildCatalogSnippets } from "./export-snippets";

export function downloadCatalogSnippets(
  entries: AtomicCatalogEntry[],
  filename = "qwen-ui-lab-design-system-snippets.tsx",
) {
  downloadTextFile(
    buildCatalogSnippets(entries),
    filename,
    "text/plain;charset=utf-8",
  );
}
