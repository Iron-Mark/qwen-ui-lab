const DETECTION_KIND_LABELS: Record<string, string> = {
  header: "Header",
  "side-nav": "Sidebar navigation",
  "bottom-nav": "Bottom navigation",
  "button-or-input": "Button or field",
  "input-or-button-row": "Form/action row",
  "card-or-panel": "Card or panel",
  "chart-or-media": "Chart or media",
  "text-row": "Text row",
  control: "Control",
  "content-block": "Content section",
};

const DETECTION_PRIMITIVE_LABELS: Record<string, string> = {
  "field-or-action": "Field or action",
  media: "Media",
  card: "Card",
  text: "Text",
  section: "Section",
  "list-item": "List row",
  header: "Header",
  "side-nav": "Sidebar navigation",
  "bottom-nav": "Bottom navigation",
};

export function primitiveForDetectionKind(kind: string) {
  if (kind === "button-or-input" || kind === "input-or-button-row") {
    return "field-or-action";
  }
  if (kind === "chart-or-media") return "media";
  if (kind === "card-or-panel") return "card";
  if (kind === "text-row") return "text";
  if (kind === "content-block") return "section";
  return kind;
}

export function detectionKindLabel(kind: string) {
  return DETECTION_KIND_LABELS[kind] ?? titleCaseDetectionLabel(kind);
}

export function detectionPrimitiveLabel(primitive: string) {
  return DETECTION_PRIMITIVE_LABELS[primitive] ?? titleCaseDetectionLabel(primitive);
}

export function detectionElementLabel(element: { kind: string; primitive?: string }) {
  return detectionPrimitiveLabel(
    element.primitive ?? primitiveForDetectionKind(element.kind),
  );
}

export function detectionReviewNeedLabel(value: string) {
  if (value === "low") return "Review need: low";
  if (value === "medium") return "Review need: medium";
  if (value === "high") return "Review need: high";
  return "Review need: local scan";
}

function titleCaseDetectionLabel(value: string) {
  return value
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}
