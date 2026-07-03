const GENERIC_CODE_ACTIONS = new Set([
  "copy",
  "copy all",
  "copying...",
  "copied",
]);

const LEGACY_DOWNLOAD_ACTIONS = new Map([
  ["export", (subject) => `Download ${subject}`],
  ["exporting...", (subject) => `Downloading ${subject}...`],
  ["exported", (subject) => `Downloaded ${subject}`],
]);

export function createExportActionAriaLabel(label, subject = "code") {
  const visibleLabel = String(label ?? "").trim();
  const fallbackSubject = String(subject ?? "").trim() || "code";

  if (!visibleLabel) return fallbackSubject;
  const normalizedLabel = visibleLabel.toLowerCase();
  const legacyDownloadLabel = LEGACY_DOWNLOAD_ACTIONS.get(normalizedLabel);
  if (legacyDownloadLabel) {
    return legacyDownloadLabel(fallbackSubject);
  }

  if (GENERIC_CODE_ACTIONS.has(normalizedLabel)) {
    return `${visibleLabel} ${fallbackSubject}`;
  }

  return visibleLabel;
}
