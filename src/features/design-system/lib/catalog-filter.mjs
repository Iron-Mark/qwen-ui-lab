/**
 * Pure filter helper for the atomic design catalog (testable without TSX).
 * @param {Array<{ name: string; description: string; usage?: string; level: string; domain?: string; props?: Array<{ name: string; description: string }> }>} entries
 * @param {string} query
 * @param {string} level
 * @param {string} domain
 */
export function filterCatalogEntries(entries, query, level = "all", domain = "all") {
  const normalized = query.trim().toLowerCase();
  return entries.filter((entry) => {
    if (level !== "all" && entry.level !== level) return false;
    if (domain !== "all" && entry.domain !== domain) return false;
    if (!normalized) return true;
    const haystack = [
      entry.name,
      entry.description,
      entry.usage,
      entry.level,
      entry.domain,
      ...(entry.props?.map((p) => `${p.name} ${p.description}`) ?? []),
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(normalized);
  });
}

export function filterByDomain(entries, domain) {
  if (domain === "all") return entries;
  return entries.filter((entry) => entry.domain === domain);
}
