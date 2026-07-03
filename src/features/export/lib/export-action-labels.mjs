const GENERIC_CODE_ACTIONS = new Set([
  "copy",
  "copy all",
  "copying...",
  "copied",
  "export",
  "exporting...",
  "exported",
]);

export function createExportActionAriaLabel(label, subject = "code") {
  const visibleLabel = String(label ?? "").trim();
  const fallbackSubject = String(subject ?? "").trim() || "code";

  if (!visibleLabel) return fallbackSubject;
  if (GENERIC_CODE_ACTIONS.has(visibleLabel.toLowerCase())) {
    return `${visibleLabel} ${fallbackSubject}`;
  }

  return visibleLabel;
}
