const DEFAULT_SAMPLE_DIMENSION = 144;
const DEFAULT_GRID_COLUMNS = 12;
const DEFAULT_GRID_ROWS = 8;
const EDGE_THRESHOLD = 0.18;
const BACKGROUND_DISTANCE_THRESHOLD = 42;
const PALETTE_BUCKET_SIZE = 32;

/**
 * Inspect an already-rendered canvas without network calls or provider APIs.
 * @param {HTMLCanvasElement} canvas
 * @param {{ maxSampleDimension?: number }} [options]
 */
export function inspectCanvas(canvas, { maxSampleDimension = DEFAULT_SAMPLE_DIMENSION } = {}) {
  if (typeof document === "undefined" || !canvas?.width || !canvas?.height) {
    return null;
  }

  const sample = fitDimensions(canvas.width, canvas.height, maxSampleDimension);
  const sampleCanvas = document.createElement("canvas");
  sampleCanvas.width = sample.width;
  sampleCanvas.height = sample.height;

  const sampleCtx = sampleCanvas.getContext("2d", { willReadFrequently: true });
  if (!sampleCtx) return null;

  sampleCtx.drawImage(canvas, 0, 0, sample.width, sample.height);
  const imageData = sampleCtx.getImageData(0, 0, sample.width, sample.height);

  return inspectImageDataPixels({
    data: imageData.data,
    width: sample.width,
    height: sample.height,
    sourceWidth: canvas.width,
    sourceHeight: canvas.height,
  });
}

/**
 * Deterministic, dependency-free screenshot signals for offline UI analysis.
 * @param {{
 *   data: Uint8ClampedArray | number[];
 *   width: number;
 *   height: number;
 *   sourceWidth?: number;
 *   sourceHeight?: number;
 * }} image
 * @param {{ gridColumns?: number; gridRows?: number }} [options]
 */
export function inspectImageDataPixels(
  image,
  { gridColumns = DEFAULT_GRID_COLUMNS, gridRows = DEFAULT_GRID_ROWS } = {},
) {
  const width = Math.max(0, Math.floor(image.width || 0));
  const height = Math.max(0, Math.floor(image.height || 0));
  const totalPixels = width * height;

  if (!image.data || width <= 0 || height <= 0 || image.data.length < totalPixels * 4) {
    return null;
  }

  const luminance = new Float32Array(totalPixels);
  const paletteBuckets = new Map();
  let opaquePixels = 0;

  for (let index = 0; index < totalPixels; index += 1) {
    const offset = index * 4;
    const alpha = image.data[offset + 3] ?? 255;
    if (alpha < 128) continue;

    const color = {
      r: image.data[offset],
      g: image.data[offset + 1],
      b: image.data[offset + 2],
    };
    luminance[index] = relativeLuminance(color);
    opaquePixels += 1;

    const bucket = quantizeColor(color);
    const key = `${bucket.r},${bucket.g},${bucket.b}`;
    const current = paletteBuckets.get(key) ?? { ...bucket, count: 0 };
    current.count += 1;
    paletteBuckets.set(key, current);
  }

  const palette = buildPalette(paletteBuckets, Math.max(1, opaquePixels));
  const dominant = palette[0] ?? { hex: "#ffffff", r: 255, g: 255, b: 255, percentage: 1 };
  const cellCount = gridColumns * gridRows;
  const cellPixels = new Array(cellCount).fill(0);
  const cellInk = new Array(cellCount).fill(0);
  const cellEdges = new Array(cellCount).fill(0);
  let edgePixels = 0;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = y * width + x;
      const offset = index * 4;
      const alpha = image.data[offset + 3] ?? 255;
      if (alpha < 128) continue;

      const cellIndex = getCellIndex(x, y, width, height, gridColumns, gridRows);
      cellPixels[cellIndex] += 1;

      const color = {
        r: image.data[offset],
        g: image.data[offset + 1],
        b: image.data[offset + 2],
      };
      if (colorDistance(color, dominant) > BACKGROUND_DISTANCE_THRESHOLD) {
        cellInk[cellIndex] += 1;
      }

      if (x === 0 || y === 0) continue;
      const current = luminance[index];
      const left = luminance[index - 1];
      const up = luminance[index - width];
      if (Math.abs(current - left) + Math.abs(current - up) >= EDGE_THRESHOLD) {
        edgePixels += 1;
        cellEdges[cellIndex] += 1;
      }
    }
  }

  const activeCells = cellPixels.map((pixels, index) => {
    if (!pixels) return false;
    return cellInk[index] / pixels >= 0.12 || cellEdges[index] / pixels >= 0.035;
  });
  const layout = summarizeLayoutGrid(activeCells, {
    gridColumns,
    gridRows,
    cellPixels,
    cellInk,
    cellEdges,
  });
  const contrast = summarizeContrast(dominant, palette);
  const edgeDensity = totalPixels ? edgePixels / totalPixels : 0;
  const visualDensity = densityLabel(edgeDensity, layout.activeCellRatio);
  const recommendations = buildRecommendations({
    contrast,
    layout,
    visualDensity,
  });

  return {
    sample: {
      width,
      height,
      sourceWidth: image.sourceWidth ?? width,
      sourceHeight: image.sourceHeight ?? height,
    },
    palette,
    contrast,
    layout,
    edgeDensity: round(edgeDensity, 3),
    visualDensity,
    recommendations,
  };
}

/**
 * @param {ReturnType<typeof inspectImageDataPixels> | null | undefined} inspection
 */
export function buildImageInspectionPlanSections(inspection) {
  if (!inspection) return [];

  const layoutHints = [
    inspection.layout.topBand ? "top navigation/header band" : null,
    inspection.layout.bottomBand ? "bottom navigation/action band" : null,
    inspection.layout.leftRail ? "left rail" : null,
    inspection.layout.rightRail ? "right rail" : null,
  ].filter(Boolean);
  const colors = inspection.palette
    .slice(0, 4)
    .map((swatch) => `${swatch.hex} ${Math.round(swatch.percentage * 100)}%`)
    .join(", ");

  return [
    {
      title: "Local Vision Signals",
      body: [
        `Canvas pixel scan found ${inspection.visualDensity} density with ${Math.round(
          inspection.edgeDensity * 100,
        )}% edge coverage.`,
        `${inspection.layout.activeRows}/${inspection.layout.gridRows} active rows and ${inspection.layout.activeColumns}/${inspection.layout.gridColumns} active columns were detected.`,
        layoutHints.length ? `Likely structure: ${layoutHints.join(", ")}.` : null,
        colors ? `Dominant palette: ${colors}.` : null,
        `Best text color on the dominant surface is ${inspection.contrast.preferredText} at ${inspection.contrast.preferredTextContrast}:1 (${inspection.contrast.wcagAAEstimate}).`,
      ]
        .filter(Boolean)
        .join(" "),
    },
    {
      title: "Local Quality Checks",
      body: inspection.recommendations.join(" "),
    },
  ];
}

/**
 * @param {ReturnType<typeof inspectImageDataPixels> | null | undefined} inspection
 */
export function buildImageInspectionPreviewStats(inspection) {
  if (!inspection) return null;

  return [
    { label: "Palette", value: `${inspection.palette.length} colors` },
    { label: "Contrast", value: `${inspection.contrast.preferredTextContrast}:1` },
    { label: "Density", value: inspection.visualDensity },
    {
      label: "Layout",
      value: `${inspection.layout.activeColumns}/${inspection.layout.gridColumns} cols`,
    },
  ];
}

/**
 * WCAG relative luminance for sRGB colors.
 * @param {{ r: number; g: number; b: number }} color
 */
export function relativeLuminance(color) {
  const r = srgbToLinear(color.r);
  const g = srgbToLinear(color.g);
  const b = srgbToLinear(color.b);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * WCAG contrast ratio, rounded to one decimal.
 * @param {{ r: number; g: number; b: number }} first
 * @param {{ r: number; g: number; b: number }} second
 */
export function contrastRatio(first, second) {
  const firstLuminance = relativeLuminance(first);
  const secondLuminance = relativeLuminance(second);
  const lighter = Math.max(firstLuminance, secondLuminance);
  const darker = Math.min(firstLuminance, secondLuminance);
  return round((lighter + 0.05) / (darker + 0.05), 1);
}

function summarizeContrast(dominant, palette) {
  const black = { r: 0, g: 0, b: 0 };
  const white = { r: 255, g: 255, b: 255 };
  const darkTextContrast = contrastRatio(dominant, black);
  const lightTextContrast = contrastRatio(dominant, white);
  const preferredText = darkTextContrast >= lightTextContrast ? "#000000" : "#ffffff";
  const preferredTextContrast = Math.max(darkTextContrast, lightTextContrast);
  let strongestPaletteContrast = 1;

  for (let first = 0; first < palette.length; first += 1) {
    for (let second = first + 1; second < palette.length; second += 1) {
      strongestPaletteContrast = Math.max(
        strongestPaletteContrast,
        contrastRatio(palette[first], palette[second]),
      );
    }
  }

  return {
    dominant: dominant.hex,
    preferredText,
    preferredTextContrast,
    darkTextContrast,
    lightTextContrast,
    strongestPaletteContrast: round(strongestPaletteContrast, 1),
    wcagAAEstimate:
      preferredTextContrast >= 4.5
        ? "AA normal text feasible"
        : preferredTextContrast >= 3
          ? "large text only without color changes"
          : "contrast remediation needed",
  };
}

function summarizeLayoutGrid(activeCells, { gridColumns, gridRows }) {
  const rowCounts = new Array(gridRows).fill(0);
  const columnCounts = new Array(gridColumns).fill(0);
  let activeCellCount = 0;

  activeCells.forEach((active, index) => {
    if (!active) return;
    activeCellCount += 1;
    const row = Math.floor(index / gridColumns);
    const column = index % gridColumns;
    rowCounts[row] += 1;
    columnCounts[column] += 1;
  });

  const activeRows = rowCounts.filter((count) => count > 0).length;
  const activeColumns = columnCounts.filter((count) => count > 0).length;
  const topBand = rowCounts[0] >= Math.max(2, Math.ceil(gridColumns * 0.25));
  const bottomBand = rowCounts[gridRows - 1] >= Math.max(2, Math.ceil(gridColumns * 0.25));
  const leftRail =
    columnCounts[0] + columnCounts[1] >= Math.max(2, Math.ceil(gridRows * 0.35));
  const rightRail =
    columnCounts[gridColumns - 1] + columnCounts[gridColumns - 2] >=
    Math.max(2, Math.ceil(gridRows * 0.35));
  const components = countConnectedComponents(activeCells, gridColumns, gridRows);
  const smallClusters = components.filter((component) => component <= 2).length;
  const smallClusterRatio = components.length ? smallClusters / components.length : 0;

  return {
    gridColumns,
    gridRows,
    activeRows,
    activeColumns,
    activeCellRatio: round(activeCellCount / activeCells.length, 3),
    topBand,
    bottomBand,
    leftRail,
    rightRail,
    estimatedRegions: components.length,
    smallClusterRatio: round(smallClusterRatio, 2),
    targetRisk:
      smallClusterRatio >= 0.45
        ? "high"
        : smallClusterRatio >= 0.25
          ? "medium"
          : "low",
  };
}

function buildRecommendations({ contrast, layout, visualDensity }) {
  const recommendations = [];

  if (contrast.preferredTextContrast < 4.5) {
    recommendations.push(
      "Increase foreground/background contrast before using small body text.",
    );
  } else {
    recommendations.push(
      `Use ${contrast.preferredText} for text on the dominant surface to preserve readable contrast.`,
    );
  }

  if (layout.targetRisk !== "low") {
    recommendations.push(
      "Review dense small clusters as possible tap targets; keep critical controls at least 24 CSS pixels and prefer 44 pixels for touch-heavy UI.",
    );
  }

  if (visualDensity === "high") {
    recommendations.push(
      "Group dense regions into clearer sections and add whitespace before generating production components.",
    );
  } else if (!layout.topBand && !layout.bottomBand && !layout.leftRail) {
    recommendations.push(
      "Confirm navigation landmarks manually; the local scan did not find a strong header, rail, or bottom navigation band.",
    );
  } else {
    recommendations.push(
      "Preserve detected structural bands as semantic landmarks in the generated scaffold.",
    );
  }

  return recommendations;
}

function countConnectedComponents(activeCells, gridColumns, gridRows) {
  const visited = new Set();
  const components = [];

  for (let index = 0; index < activeCells.length; index += 1) {
    if (!activeCells[index] || visited.has(index)) continue;
    const queue = [index];
    visited.add(index);
    let size = 0;

    while (queue.length) {
      const current = queue.shift();
      size += 1;
      for (const neighbor of getNeighbors(current, gridColumns, gridRows)) {
        if (!activeCells[neighbor] || visited.has(neighbor)) continue;
        visited.add(neighbor);
        queue.push(neighbor);
      }
    }

    components.push(size);
  }

  return components;
}

function getNeighbors(index, gridColumns, gridRows) {
  const row = Math.floor(index / gridColumns);
  const column = index % gridColumns;
  const neighbors = [];

  if (row > 0) neighbors.push(index - gridColumns);
  if (row < gridRows - 1) neighbors.push(index + gridColumns);
  if (column > 0) neighbors.push(index - 1);
  if (column < gridColumns - 1) neighbors.push(index + 1);

  return neighbors;
}

function buildPalette(buckets, totalPixels) {
  return [...buckets.values()]
    .sort((a, b) => b.count - a.count)
    .slice(0, 6)
    .map((bucket) => ({
      hex: toHex(bucket),
      r: bucket.r,
      g: bucket.g,
      b: bucket.b,
      percentage: round(bucket.count / totalPixels, 3),
    }));
}

function densityLabel(edgeDensity, activeCellRatio) {
  if (edgeDensity >= 0.12 || activeCellRatio >= 0.62) return "high";
  if (edgeDensity >= 0.045 || activeCellRatio >= 0.32) return "medium";
  return "low";
}

function getCellIndex(x, y, width, height, gridColumns, gridRows) {
  const column = Math.min(gridColumns - 1, Math.floor((x / width) * gridColumns));
  const row = Math.min(gridRows - 1, Math.floor((y / height) * gridRows));
  return row * gridColumns + column;
}

function quantizeColor(color) {
  return {
    r: quantizeChannel(color.r),
    g: quantizeChannel(color.g),
    b: quantizeChannel(color.b),
  };
}

function quantizeChannel(value) {
  return Math.min(
    255,
    Math.max(0, Math.floor(value / PALETTE_BUCKET_SIZE) * PALETTE_BUCKET_SIZE + 16),
  );
}

function colorDistance(first, second) {
  const dr = first.r - second.r;
  const dg = first.g - second.g;
  const db = first.b - second.b;
  return Math.sqrt(dr * dr + dg * dg + db * db);
}

function srgbToLinear(channel) {
  const value = clamp(channel, 0, 255) / 255;
  return value <= 0.04045
    ? value / 12.92
    : Math.pow((value + 0.055) / 1.055, 2.4);
}

function toHex(color) {
  return `#${[color.r, color.g, color.b]
    .map((channel) => clamp(Math.round(channel), 0, 255).toString(16).padStart(2, "0"))
    .join("")}`;
}

function fitDimensions(width, height, maxDimension) {
  if (width <= maxDimension && height <= maxDimension) {
    return { width, height };
  }

  const scale = maxDimension / Math.max(width, height);
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

function round(value, places = 2) {
  const factor = 10 ** places;
  return Math.round(value * factor) / factor;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, Number(value) || 0));
}
