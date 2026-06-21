import { downloadTextFile } from "@/lib/clipboard.client";
import type { AtomicCatalogEntry } from "../data/catalog-types";
import { buildCatalogBundle } from "./export-bundle";

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
