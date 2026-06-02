export const DOMAIN_VALUES = ["all", "product", "uilaws", "laws-of-ux"];
export const LEVEL_VALUES = ["all", "atom", "molecule", "organism"];
export const PREVIEW_VALUES = ["desktop", "tablet", "mobile"];

export function parseDomain(value) {
  return DOMAIN_VALUES.includes(value) ? value : "all";
}

export function parseLevel(value) {
  return LEVEL_VALUES.includes(value) ? value : "all";
}

export function parsePreviewMode(value) {
  return PREVIEW_VALUES.includes(value) ? value : "desktop";
}

export function pickSelectedId(value, availableIds) {
  if (!value) return availableIds[0] ?? null;
  return availableIds.includes(value) ? value : (availableIds[0] ?? null);
}

export function createDesignSystemSearchParams(state) {
  const params = new URLSearchParams();
  if (state.domain && state.domain !== "all") params.set("domain", state.domain);
  if (state.level && state.level !== "all") params.set("level", state.level);
  if (state.query) params.set("q", state.query);
  if (state.selected) params.set("selected", state.selected);
  if (state.previewMode && state.previewMode !== "desktop") {
    params.set("preview", state.previewMode);
  }
  return params;
}

export function nextFromList(values, current, direction) {
  const index = values.indexOf(current);
  if (index === -1) return values[0];
  const nextIndex = (index + direction + values.length) % values.length;
  return values[nextIndex];
}
