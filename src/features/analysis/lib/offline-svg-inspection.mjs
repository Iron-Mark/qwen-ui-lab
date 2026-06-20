const SVG_DATA_URL_PATTERN = /^data:image\/svg\+xml(?:[;,]|$)/i;
const MAX_LABELS = 12;
const MAX_LABEL_LENGTH = 80;

const SVG_TAGS = [
  "a",
  "circle",
  "ellipse",
  "foreignObject",
  "g",
  "image",
  "line",
  "path",
  "polygon",
  "polyline",
  "rect",
  "text",
  "use",
];

const SVG_ARCHETYPE_TERMS = {
  auth: ["sign in", "signin", "login", "email", "password", "continue", "forgot"],
  dashboard: ["dashboard", "revenue", "analytics", "activity", "chart", "kpi", "metric"],
  ecommerce: ["cart", "shop", "product", "checkout", "price", "filter", "catalog"],
  landing: ["hero", "features", "pricing", "testimonial", "start free", "get started"],
  mobile: ["home", "search", "profile", "feed", "tab", "mobile"],
  settings: ["settings", "profile", "notifications", "preferences", "billing", "save"],
};

/**
 * @param {string} dataUrl
 */
export function inspectSvgDataUrl(dataUrl) {
  if (typeof dataUrl !== "string" || !SVG_DATA_URL_PATTERN.test(dataUrl)) {
    return null;
  }

  const commaIndex = dataUrl.indexOf(",");
  if (commaIndex < 0) return null;

  const header = dataUrl.slice(0, commaIndex);
  const payload = dataUrl.slice(commaIndex + 1);
  const markup = /;base64/i.test(header)
    ? decodeBase64Utf8(payload)
    : decodeUriPayload(payload);

  return inspectSvgMarkup(markup);
}

/**
 * @param {string} markup
 */
export function inspectSvgMarkup(markup) {
  if (typeof markup !== "string" || !/<svg[\s>]/i.test(markup)) {
    return null;
  }

  const safeMarkup = stripUnsafeSvgMarkup(markup);
  const rootAttributes = parseSvgRootAttributes(safeMarkup);
  const tagCounts = countSvgTags(safeMarkup);
  const labels = extractSvgLabels(safeMarkup);
  const shapeCount =
    tagCounts.rect +
    tagCounts.circle +
    tagCounts.ellipse +
    tagCounts.path +
    tagCounts.line +
    tagCounts.polygon +
    tagCounts.polyline +
    tagCounts.image;
  const archetypeHints = scoreSvgArchetypeHints(labels);
  const complexity = svgComplexityLabel({
    shapeCount,
    groupCount: tagCounts.g,
    textCount: labels.length,
  });

  return {
    source: {
      width: rootAttributes.width,
      height: rootAttributes.height,
      viewBox: rootAttributes.viewBox,
      hasViewBox: Boolean(rootAttributes.viewBox?.length),
    },
    labels,
    tagCounts,
    shapeCount,
    groupCount: tagCounts.g,
    complexity,
    archetypeHints,
    recommendations: buildSvgRecommendations({
      labels,
      tagCounts,
      shapeCount,
      rootAttributes,
    }),
  };
}

/**
 * @param {ReturnType<typeof inspectSvgMarkup> | null | undefined} inspection
 */
export function buildSvgInspectionPlanSections(inspection) {
  if (!inspection) return [];

  const labelSummary = inspection.labels.length
    ? `Detected labels: ${inspection.labels.slice(0, 8).join(", ")}.`
    : "No visible text labels were detected in the SVG markup.";
  const viewBox = inspection.source.viewBox
    ? `ViewBox ${inspection.source.viewBox.join(" ")}.`
    : "No viewBox was detected.";
  const topHint = inspection.archetypeHints[0];
  const hintText = topHint
    ? `Strongest SVG text hint: ${topHint.id} (${topHint.score}).`
    : "No strong archetype hint from SVG text.";

  return [
    {
      title: "Local SVG Structure",
      body: [
        `${inspection.shapeCount} vector shapes, ${inspection.groupCount} groups, and ${inspection.labels.length} text labels were parsed locally.`,
        `${inspection.complexity} SVG complexity.`,
        viewBox,
        labelSummary,
        hintText,
      ].join(" "),
    },
    {
      title: "SVG Quality Checks",
      body: inspection.recommendations.join(" "),
    },
  ];
}

/**
 * @param {ReturnType<typeof inspectSvgMarkup> | null | undefined} inspection
 */
export function buildSvgInspectionPreviewStats(inspection) {
  if (!inspection) return null;

  return [
    { label: "Text", value: String(inspection.labels.length) },
    { label: "Shapes", value: String(inspection.shapeCount) },
    { label: "Groups", value: String(inspection.groupCount) },
    { label: "ViewBox", value: inspection.source.hasViewBox ? "yes" : "no" },
  ];
}

function stripUnsafeSvgMarkup(markup) {
  return String(markup)
    .replace(/<script\b[\s\S]*?<\/script>/gi, "")
    .replace(/<style\b[\s\S]*?<\/style>/gi, "");
}

function parseSvgRootAttributes(markup) {
  const root = markup.match(/<svg\b([^>]*)>/i)?.[1] ?? "";
  const attrs = parseAttributes(root);
  const viewBox = attrs.viewBox ?? attrs.viewbox ?? "";

  return {
    width: parseSvgNumber(attrs.width),
    height: parseSvgNumber(attrs.height),
    viewBox: parseSvgViewBox(viewBox),
  };
}

function parseSvgViewBox(value) {
  const normalized = String(value || "").trim();
  if (!normalized) return null;

  const numbers = normalized
    .split(/[\s,]+/)
    .map(Number)
    .filter((item) => Number.isFinite(item));

  return numbers.length === 4 ? numbers : null;
}

function parseAttributes(source) {
  const attrs = {};
  const pattern = /([:\w-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g;
  let match = pattern.exec(source);

  while (match) {
    attrs[match[1]] = match[2] ?? match[3] ?? "";
    match = pattern.exec(source);
  }

  return attrs;
}

function parseSvgNumber(value) {
  const number = Number.parseFloat(String(value || "").replace(/px$/i, ""));
  return Number.isFinite(number) ? number : null;
}

function countSvgTags(markup) {
  return SVG_TAGS.reduce((counts, tag) => {
    counts[tag] = (markup.match(new RegExp(`<${tag}\\b`, "gi")) ?? []).length;
    return counts;
  }, {});
}

function extractSvgLabels(markup) {
  const labels = [];
  for (const tag of ["title", "desc", "text", "tspan"]) {
    const pattern = new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)<\\/${tag}>`, "gi");
    let match = pattern.exec(markup);
    while (match) {
      labels.push(normalizeSvgLabel(match[1]));
      match = pattern.exec(markup);
    }
  }

  const attributePattern = /\b(?:aria-label|data-label|alt)\s*=\s*(?:"([^"]*)"|'([^']*)')/gi;
  let attributeMatch = attributePattern.exec(markup);
  while (attributeMatch) {
    labels.push(normalizeSvgLabel(attributeMatch[1] ?? attributeMatch[2] ?? ""));
    attributeMatch = attributePattern.exec(markup);
  }

  return [...new Set(labels.filter(Boolean))].slice(0, MAX_LABELS);
}

function normalizeSvgLabel(value) {
  return decodeEntities(stripTags(value))
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_LABEL_LENGTH);
}

function stripTags(value) {
  return String(value || "").replace(/<[^>]*>/g, " ");
}

function decodeEntities(value) {
  return String(value || "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function scoreSvgArchetypeHints(labels) {
  const haystack = labels.join(" ").toLowerCase();
  return Object.entries(SVG_ARCHETYPE_TERMS)
    .map(([id, terms]) => ({
      id,
      score: terms.reduce((score, term) => score + (haystack.includes(term) ? 1 : 0), 0),
    }))
    .filter((hint) => hint.score > 0)
    .sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));
}

function svgComplexityLabel({ shapeCount, groupCount, textCount }) {
  const score = shapeCount + groupCount * 0.6 + textCount * 0.8;
  if (score >= 42) return "high";
  if (score >= 16) return "medium";
  return "low";
}

function buildSvgRecommendations({ labels, tagCounts, shapeCount, rootAttributes }) {
  const recommendations = [];

  if (!rootAttributes.viewBox?.length) {
    recommendations.push("Add or preserve a viewBox so generated scaffolds can reason about responsive scaling.");
  } else {
    recommendations.push("Preserve the detected viewBox proportions when translating the SVG into responsive layout.");
  }

  if (!labels.length) {
    recommendations.push("Add text, title, desc, or aria-label nodes so offline analysis can infer component intent.");
  } else {
    recommendations.push("Reuse detected SVG labels as accessible names, headings, or form labels in the generated scaffold.");
  }

  if (tagCounts.path > shapeCount * 0.6 && shapeCount >= 12) {
    recommendations.push("Many paths were detected; group decorative vectors separately from semantic UI regions.");
  }

  return recommendations;
}

function decodeBase64Utf8(payload) {
  try {
    if (typeof Buffer !== "undefined") {
      return Buffer.from(payload, "base64").toString("utf8");
    }

    const binary = atob(payload);
    const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  } catch {
    return "";
  }
}

function decodeUriPayload(payload) {
  try {
    return decodeURIComponent(payload);
  } catch {
    return payload;
  }
}
