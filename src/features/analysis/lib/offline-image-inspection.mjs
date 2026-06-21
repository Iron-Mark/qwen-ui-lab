const DEFAULT_GRID_COLUMNS = 12;
const DEFAULT_GRID_ROWS = 8;
const SMART_GRID_COLUMNS = 24;
const SMART_GRID_ROWS = 16;
const EDGE_THRESHOLD = 0.18;
const BACKGROUND_DISTANCE_THRESHOLD = 42;
const PALETTE_BUCKET_SIZE = 32;

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
  const grayscale = new Uint8Array(totalPixels);
  const histogram = new Array(256).fill(0);
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
    const pixelLuminance = relativeLuminance(color);
    const gray = Math.round(pixelLuminance * 255);
    luminance[index] = pixelLuminance;
    grayscale[index] = gray;
    histogram[gray] += 1;
    opaquePixels += 1;

    const bucket = quantizeColor(color);
    const key = `${bucket.r},${bucket.g},${bucket.b}`;
    const current = paletteBuckets.get(key) ?? { ...bucket, count: 0 };
    current.count += 1;
    paletteBuckets.set(key, current);
  }

  const palette = buildPalette(paletteBuckets, Math.max(1, opaquePixels));
  const dominant = palette[0] ?? { hex: "#ffffff", r: 255, g: 255, b: 255, percentage: 1 };
  const threshold = summarizeThreshold(histogram, opaquePixels, dominant);
  const cellCount = gridColumns * gridRows;
  const cellPixels = new Array(cellCount).fill(0);
  const cellInk = new Array(cellCount).fill(0);
  const cellEdges = new Array(cellCount).fill(0);
  const smartCellCount = SMART_GRID_COLUMNS * SMART_GRID_ROWS;
  const smartCellPixels = new Array(smartCellCount).fill(0);
  const smartCellInk = new Array(smartCellCount).fill(0);
  const smartCellEdges = new Array(smartCellCount).fill(0);
  let edgePixels = 0;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = y * width + x;
      const offset = index * 4;
      const alpha = image.data[offset + 3] ?? 255;
      if (alpha < 128) continue;

      const cellIndex = getCellIndex(x, y, width, height, gridColumns, gridRows);
      cellPixels[cellIndex] += 1;
      const smartCellIndex = getCellIndex(x, y, width, height, SMART_GRID_COLUMNS, SMART_GRID_ROWS);
      smartCellPixels[smartCellIndex] += 1;

      const color = {
        r: image.data[offset],
        g: image.data[offset + 1],
        b: image.data[offset + 2],
      };
      if (colorDistance(color, dominant) > BACKGROUND_DISTANCE_THRESHOLD) {
        cellInk[cellIndex] += 1;
        smartCellInk[smartCellIndex] += 1;
      } else if (isThresholdForeground(grayscale[index], threshold)) {
        cellInk[cellIndex] += 1;
        smartCellInk[smartCellIndex] += 1;
      }

      if (x === 0 || y === 0) continue;
      const current = luminance[index];
      const left = luminance[index - 1];
      const up = luminance[index - width];
      if (Math.abs(current - left) + Math.abs(current - up) >= EDGE_THRESHOLD) {
        edgePixels += 1;
        cellEdges[cellIndex] += 1;
        smartCellEdges[smartCellIndex] += 1;
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
  const smartDetection = summarizeSmartDetection({
    cellPixels: smartCellPixels,
    cellInk: smartCellInk,
    cellEdges: smartCellEdges,
    gridColumns: SMART_GRID_COLUMNS,
    gridRows: SMART_GRID_ROWS,
    sourceWidth: image.sourceWidth ?? width,
    sourceHeight: image.sourceHeight ?? height,
  });
  const contrast = summarizeContrast(dominant, palette);
  const edgeDensity = totalPixels ? edgePixels / totalPixels : 0;
  const visualDensity = densityLabel(edgeDensity, layout.activeCellRatio);
  const imageSignature = buildImageSignature(luminance, width, height);
  const designTokens = buildDesignTokens({ palette, contrast, visualDensity, layout });
  const recommendations = buildRecommendations({
    contrast,
    layout,
    visualDensity,
    designTokens,
  });

  return {
    sample: {
      width,
      height,
      sourceWidth: image.sourceWidth ?? width,
      sourceHeight: image.sourceHeight ?? height,
    },
    palette,
    threshold,
    contrast,
    layout,
    elements: smartDetection.elements,
    layoutTree: smartDetection.layoutTree,
    quality: smartDetection.quality,
    imageSignature,
    designTokens,
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
      title: "Detected Structure",
      body: summarizeDetectedStructure(inspection),
    },
    {
      title: "Element Detection",
      body: summarizeDetectedElements(inspection),
    },
    {
      title: "Design Tokens",
      body: [
        `Use ${inspection.designTokens.surface} as the main surface and ${inspection.designTokens.foreground} for readable foreground text.`,
        `Accent candidate: ${inspection.designTokens.accent}; muted surface: ${inspection.designTokens.muted}.`,
        `Suggested spacing is ${inspection.designTokens.spacing} with ${inspection.designTokens.radius} radius.`,
      ].join(" "),
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
    { label: "Regions", value: String(inspection.layout.estimatedRegions) },
    {
      label: "Elements",
      value: String(inspection.elements?.length ?? inspection.layout.componentSummary.controls),
    },
    { label: "Density", value: inspection.visualDensity },
    { label: "Contrast", value: `${inspection.contrast.preferredTextContrast}:1` },
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

function summarizeThreshold(histogram, totalPixels, dominant) {
  const value = otsuThreshold(histogram, totalPixels);
  const dominantGray = Math.round(relativeLuminance(dominant) * 255);
  return {
    method: "otsu",
    value,
    foregroundPolarity: dominantGray >= value ? "dark-on-light" : "light-on-dark",
  };
}

function otsuThreshold(histogram, totalPixels) {
  if (!totalPixels) return 128;

  let total = 0;
  for (let level = 0; level < histogram.length; level += 1) {
    total += level * histogram[level];
  }

  let backgroundWeight = 0;
  let backgroundSum = 0;
  let bestVariance = -1;
  let threshold = 128;

  for (let level = 0; level < histogram.length; level += 1) {
    backgroundWeight += histogram[level];
    if (backgroundWeight === 0) continue;

    const foregroundWeight = totalPixels - backgroundWeight;
    if (foregroundWeight === 0) break;

    backgroundSum += level * histogram[level];
    const backgroundMean = backgroundSum / backgroundWeight;
    const foregroundMean = (total - backgroundSum) / foregroundWeight;
    const betweenClassVariance =
      backgroundWeight *
      foregroundWeight *
      (backgroundMean - foregroundMean) *
      (backgroundMean - foregroundMean);

    if (betweenClassVariance > bestVariance) {
      bestVariance = betweenClassVariance;
      threshold = level;
    }
  }

  return threshold;
}

function isThresholdForeground(gray, threshold) {
  if (threshold.foregroundPolarity === "dark-on-light") {
    return gray <= threshold.value;
  }
  return gray >= threshold.value;
}

function buildImageSignature(luminance, width, height) {
  return {
    method: "luma-a8-d8",
    averageHash: buildAverageHash(luminance, width, height),
    differenceHash: buildDifferenceHash(luminance, width, height),
  };
}

function buildAverageHash(luminance, width, height) {
  const cells = sampleLuminanceGrid(luminance, width, height, 8, 8);
  const average = cells.reduce((sum, value) => sum + value, 0) / cells.length;
  return bitsToHex(cells.map((value) => value >= average));
}

function buildDifferenceHash(luminance, width, height) {
  const cells = sampleLuminanceGrid(luminance, width, height, 9, 8);
  const bits = [];

  for (let row = 0; row < 8; row += 1) {
    for (let column = 0; column < 8; column += 1) {
      bits.push(cells[row * 9 + column] > cells[row * 9 + column + 1]);
    }
  }

  return bitsToHex(bits);
}

function sampleLuminanceGrid(luminance, width, height, columns, rows) {
  const cells = [];

  for (let row = 0; row < rows; row += 1) {
    const yStart = Math.floor((row * height) / rows);
    const yEnd = Math.max(yStart + 1, Math.floor(((row + 1) * height) / rows));

    for (let column = 0; column < columns; column += 1) {
      const xStart = Math.floor((column * width) / columns);
      const xEnd = Math.max(xStart + 1, Math.floor(((column + 1) * width) / columns));
      let sum = 0;
      let count = 0;

      for (let y = yStart; y < Math.min(height, yEnd); y += 1) {
        for (let x = xStart; x < Math.min(width, xEnd); x += 1) {
          sum += luminance[y * width + x];
          count += 1;
        }
      }

      cells.push(count ? sum / count : 0);
    }
  }

  return cells;
}

function bitsToHex(bits) {
  let output = "";

  for (let index = 0; index < bits.length; index += 4) {
    let value = 0;
    for (let bit = 0; bit < 4; bit += 1) {
      value = value * 2 + (bits[index + bit] ? 1 : 0);
    }
    output += value.toString(16);
  }

  return output;
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
  const regions = extractLayoutRegions(activeCells, gridColumns, gridRows);
  const smallClusters = regions.filter((region) => region.cells <= 2).length;
  const smallClusterRatio = regions.length ? smallClusters / regions.length : 0;
  const componentSummary = summarizeComponentRegions(regions);

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
    estimatedRegions: regions.length,
    smallClusterRatio: round(smallClusterRatio, 2),
    regions,
    componentSummary,
    targetRisk:
      smallClusterRatio >= 0.45
        ? "high"
        : smallClusterRatio >= 0.25
          ? "medium"
          : "low",
  };
}

function buildDesignTokens({ palette, contrast, visualDensity, layout }) {
  const surface = contrast.dominant;
  const foreground = contrast.preferredText;
  const accentSwatch =
    palette.find((swatch) => swatch.hex !== surface && contrastRatio(swatch, { r: 255, g: 255, b: 255 }) >= 2) ??
    palette.find((swatch) => swatch.hex !== surface) ??
    { hex: "#2563eb", r: 37, g: 99, b: 235 };
  const mutedSwatch =
    palette.find((swatch) => swatch.hex !== surface && colorDistance(swatch, accentSwatch) > 30) ??
    { hex: mixHex(surface, foreground, 0.12) };

  return {
    surface,
    foreground,
    accent: accentSwatch.hex,
    accentForeground: readableTextFor(accentSwatch),
    muted: mutedSwatch.hex,
    border: mixHex(surface, foreground, 0.22),
    spacing:
      visualDensity === "high"
        ? "compact"
        : visualDensity === "medium"
          ? "cozy"
          : "comfortable",
    radius:
      layout.smallClusterRatio >= 0.45
        ? "sm"
        : layout.estimatedRegions <= 3
          ? "lg"
          : "md",
  };
}

function readableTextFor(color) {
  const black = { r: 0, g: 0, b: 0 };
  const white = { r: 255, g: 255, b: 255 };
  return contrastRatio(color, black) >= contrastRatio(color, white) ? "#000000" : "#ffffff";
}

function summarizeDetectedStructure(inspection) {
  const regions = inspection.layout.regions.slice(0, 6);
  const summary = inspection.layout.componentSummary;
  const regionText = regions.length
    ? regions
        .map((region) => `${region.kind} at rows ${region.minRow + 1}-${region.maxRow + 1}, cols ${region.minColumn + 1}-${region.maxColumn + 1}`)
        .join("; ")
    : "No strong connected layout regions were found.";

  return [
    `${summary.navigation} navigation regions, ${summary.panels} content panels, and ${summary.controls} control clusters were inferred from the sampled grid.`,
    regionText,
    `Thresholding used ${inspection.threshold.method} level ${inspection.threshold.value} with ${inspection.threshold.foregroundPolarity} polarity.`,
  ].join(" ");
}

function summarizeDetectedElements(inspection) {
  const elements = inspection.elements ?? [];
  const tree = inspection.layoutTree;
  if (!elements.length) {
    return "No strong fine-grid UI elements were detected; use the coarser layout regions as the scaffold source.";
  }

  const counts = countBy(elements, "kind");
  const countText = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([kind, count]) => `${count} ${kind}`)
    .join(", ");
  const topElements = elements
    .slice(0, 6)
    .map((element) => `${element.kind} ${element.box.x},${element.box.y} ${element.box.width}×${element.box.height}`)
    .join("; ");

  return [
    `Fine-grid detection found ${elements.length} candidate UI elements (${countText}).`,
    `Hierarchy has ${tree?.groups?.length ?? 0} top-level groups using ${tree?.strategy ?? "projection"} ordering.`,
    `Top candidates: ${topElements}.`,
  ].join(" ");
}

function countBy(items, key) {
  return items.reduce((counts, item) => {
    const value = item[key] ?? "unknown";
    counts[value] = (counts[value] ?? 0) + 1;
    return counts;
  }, {});
}

function buildRecommendations({ contrast, layout, visualDensity, designTokens }) {
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

  if (layout.componentSummary.controls > 8 && visualDensity !== "low") {
    recommendations.push(
      "Consolidate repeated action controls or split them into grouped toolbars before generating the final scaffold.",
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

  recommendations.push(
    `Seed generated components with ${designTokens.spacing} spacing and ${designTokens.accent} as the accent token.`,
  );

  return recommendations;
}

function summarizeSmartDetection({
  cellPixels,
  cellInk,
  cellEdges,
  gridColumns,
  gridRows,
  sourceWidth,
  sourceHeight,
}) {
  const activeCells = cellPixels.map((pixels, index) => {
    if (!pixels) return false;
    return cellInk[index] / pixels >= 0.09 || cellEdges[index] / pixels >= 0.025;
  });
  const components = extractLayoutRegions(activeCells, gridColumns, gridRows);
  const elements = components
    .map((region, index) =>
      buildDetectedElement(region, index, {
        gridColumns,
        gridRows,
        sourceWidth,
        sourceHeight,
        cellPixels,
        cellInk,
        cellEdges,
      }),
    )
    .filter((element) => element.confidence >= 0.42)
    .sort(readingOrderSort)
    .slice(0, 24)
    .map((element, index) => ({ ...element, id: `element-${index + 1}` }));

  const layoutTree = buildLayoutTree(elements, { sourceWidth, sourceHeight });
  const confidence = elements.length
    ? round(elements.reduce((sum, element) => sum + element.confidence, 0) / elements.length, 2)
    : 0;

  return {
    elements,
    layoutTree,
    quality: {
      strategy: "fine-grid-connected-components",
      confidence,
      elementCount: elements.length,
      grid: `${gridColumns}x${gridRows}`,
      ambiguity:
        confidence >= 0.68
          ? "low"
          : confidence >= 0.5
            ? "medium"
            : "high",
    },
  };
}

function buildDetectedElement(region, index, context) {
  const box = regionToSourceBox(region, context);
  const cells = collectRegionCells(region, context.gridColumns);
  const totals = cells.reduce(
    (summary, cellIndex) => {
      summary.pixels += context.cellPixels[cellIndex] ?? 0;
      summary.ink += context.cellInk[cellIndex] ?? 0;
      summary.edges += context.cellEdges[cellIndex] ?? 0;
      return summary;
    },
    { pixels: 0, ink: 0, edges: 0 },
  );
  const inkRatio = totals.pixels ? totals.ink / totals.pixels : 0;
  const edgeRatio = totals.pixels ? totals.edges / totals.pixels : 0;
  const kind = classifyDetectedElement(region, box, {
    inkRatio,
    edgeRatio,
    sourceWidth: context.sourceWidth,
    sourceHeight: context.sourceHeight,
  });

  return {
    id: `element-${index + 1}`,
    kind,
    confidence: scoreDetectedElement(region, kind, { inkRatio, edgeRatio }),
    box,
    grid: {
      minRow: region.minRow,
      maxRow: region.maxRow,
      minColumn: region.minColumn,
      maxColumn: region.maxColumn,
    },
    signals: {
      inkRatio: round(inkRatio, 3),
      edgeRatio: round(edgeRatio, 3),
      cells: region.cells,
    },
  };
}

function regionToSourceBox(region, { gridColumns, gridRows, sourceWidth, sourceHeight }) {
  const x = Math.round((region.minColumn / gridColumns) * sourceWidth);
  const y = Math.round((region.minRow / gridRows) * sourceHeight);
  const width = Math.max(
    1,
    Math.round(((region.maxColumn + 1) / gridColumns) * sourceWidth) - x,
  );
  const height = Math.max(
    1,
    Math.round(((region.maxRow + 1) / gridRows) * sourceHeight) - y,
  );

  return { x, y, width, height };
}

function collectRegionCells(region, gridColumns) {
  const cells = [];
  for (let row = region.minRow; row <= region.maxRow; row += 1) {
    for (let column = region.minColumn; column <= region.maxColumn; column += 1) {
      cells.push(row * gridColumns + column);
    }
  }
  return cells;
}

function classifyDetectedElement(region, box, { inkRatio, edgeRatio, sourceWidth, sourceHeight }) {
  const aspect = box.width / Math.max(1, box.height);
  const yRatio = box.y / Math.max(1, sourceHeight);
  const xRatio = box.x / Math.max(1, sourceWidth);
  const areaRatio = (box.width * box.height) / Math.max(1, sourceWidth * sourceHeight);

  if (yRatio <= 0.08 && box.width >= sourceWidth * 0.35) return "header";
  if (yRatio >= 0.78 && box.width >= sourceWidth * 0.28) return "bottom-nav";
  if (xRatio <= 0.12 && box.height >= sourceHeight * 0.32) return "side-nav";
  if (aspect >= 3.6 && box.height <= sourceHeight * 0.12) return "input-or-button-row";
  if (aspect >= 1.5 && aspect <= 4.5 && box.height <= sourceHeight * 0.16 && edgeRatio >= 0.018) {
    return "button-or-input";
  }
  if (areaRatio >= 0.12 && edgeRatio >= 0.025) return "chart-or-media";
  if (region.cells >= 8 || areaRatio >= 0.08) return "card-or-panel";
  if (aspect >= 2.2 && inkRatio >= 0.08) return "text-row";
  if (region.cells <= 2) return "control";
  return "content-block";
}

function scoreDetectedElement(region, kind, { inkRatio, edgeRatio }) {
  const baseScores = {
    header: 0.82,
    "bottom-nav": 0.78,
    "side-nav": 0.8,
    "input-or-button-row": 0.7,
    "button-or-input": 0.72,
    "chart-or-media": 0.68,
    "card-or-panel": 0.7,
    "text-row": 0.58,
    control: 0.52,
    "content-block": 0.5,
  };
  const signalBoost = Math.min(0.18, inkRatio * 0.7 + edgeRatio * 1.4);
  const sizePenalty = region.cells <= 1 ? 0.1 : 0;

  return round(Math.min(0.95, (baseScores[kind] ?? 0.5) + signalBoost - sizePenalty), 2);
}

function readingOrderSort(first, second) {
  if (first.box.y !== second.box.y) return first.box.y - second.box.y;
  return first.box.x - second.box.x;
}

function buildLayoutTree(elements, { sourceWidth, sourceHeight }) {
  const groups = [];
  const structuralKinds = new Set(["header", "bottom-nav", "side-nav"]);
  const structural = elements.filter((element) => structuralKinds.has(element.kind));
  const content = elements.filter((element) => !structuralKinds.has(element.kind));

  for (const element of structural) {
    groups.push({
      id: `${element.id}-group`,
      kind: element.kind,
      box: element.box,
      children: [element.id],
    });
  }

  const contentGroups = groupElementsByRows(content, { sourceHeight });
  groups.push(...contentGroups);

  return {
    strategy: "projection-groups",
    source: { width: sourceWidth, height: sourceHeight },
    groups,
    readingOrder: elements.map((element) => element.id),
  };
}

function groupElementsByRows(elements, { sourceHeight }) {
  const rowHeight = Math.max(80, Math.round(sourceHeight / 8));
  const buckets = new Map();

  for (const element of elements) {
    const rowKey = Math.floor(element.box.y / rowHeight);
    const current = buckets.get(rowKey) ?? [];
    current.push(element);
    buckets.set(rowKey, current);
  }

  return [...buckets.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([rowKey, rowElements], index) => {
      const boxes = rowElements.map((element) => element.box);
      return {
        id: `group-${index + 1}`,
        kind: rowElements.length >= 3 ? "repeated-row" : "content-group",
        box: mergeBoxes(boxes),
        row: rowKey,
        children: rowElements.map((element) => element.id),
      };
    });
}

function mergeBoxes(boxes) {
  if (!boxes.length) return { x: 0, y: 0, width: 1, height: 1 };
  const minX = Math.min(...boxes.map((box) => box.x));
  const minY = Math.min(...boxes.map((box) => box.y));
  const maxX = Math.max(...boxes.map((box) => box.x + box.width));
  const maxY = Math.max(...boxes.map((box) => box.y + box.height));
  return {
    x: minX,
    y: minY,
    width: Math.max(1, maxX - minX),
    height: Math.max(1, maxY - minY),
  };
}

function summarizeComponentRegions(regions) {
  return regions.reduce(
    (summary, region) => {
      if (["header/nav", "side rail", "bottom nav"].includes(region.kind)) {
        summary.navigation += 1;
      } else if (["content panel", "media/chart"].includes(region.kind)) {
        summary.panels += 1;
      } else if (region.kind === "control cluster") {
        summary.controls += 1;
      } else {
        summary.misc += 1;
      }
      return summary;
    },
    { navigation: 0, panels: 0, controls: 0, misc: 0 },
  );
}

function extractLayoutRegions(activeCells, gridColumns, gridRows) {
  const remainingCells = activeCells.slice();
  const bandRegions = extractStructuralBandRegions(remainingCells, gridColumns, gridRows);
  const visited = new Set();
  const regions = [...bandRegions];

  for (let index = 0; index < remainingCells.length; index += 1) {
    if (!remainingCells[index] || visited.has(index)) continue;
    const queue = [index];
    visited.add(index);
    const cells = [];

    while (queue.length) {
      const current = queue.shift();
      cells.push(current);
      for (const neighbor of getNeighbors(current, gridColumns, gridRows)) {
        if (!remainingCells[neighbor] || visited.has(neighbor)) continue;
        visited.add(neighbor);
        queue.push(neighbor);
      }
    }

    regions.push(buildRegion(cells, gridColumns, gridRows));
  }

  return regions.sort((a, b) => {
    if (a.minRow !== b.minRow) return a.minRow - b.minRow;
    return a.minColumn - b.minColumn;
  });
}

function extractStructuralBandRegions(activeCells, gridColumns, gridRows) {
  const regions = [];
  const topRows = collectEdgeRows(activeCells, gridColumns, gridRows, "top");
  regions.push(...removeBandRegion(activeCells, topRows, [], gridColumns, gridRows, "header/nav"));

  const bottomRows = collectEdgeRows(activeCells, gridColumns, gridRows, "bottom");
  regions.push(...removeBandRegion(activeCells, bottomRows, [], gridColumns, gridRows, "bottom nav"));

  const leftColumns = collectEdgeColumns(activeCells, gridColumns, gridRows, "left");
  regions.push(...removeBandRegion(activeCells, [], leftColumns, gridColumns, gridRows, "side rail"));

  const rightColumns = collectEdgeColumns(activeCells, gridColumns, gridRows, "right");
  regions.push(...removeBandRegion(activeCells, [], rightColumns, gridColumns, gridRows, "side rail"));

  return regions;
}

function collectEdgeRows(activeCells, gridColumns, gridRows, edge) {
  const rows = [];
  const edgeThreshold = Math.max(2, Math.ceil(gridColumns * 0.25));
  const continuationThreshold = Math.max(edgeThreshold, Math.ceil(gridColumns * 0.45));
  const rowOrder =
    edge === "top"
      ? Array.from({ length: gridRows }, (_, row) => row)
      : Array.from({ length: gridRows }, (_, row) => gridRows - 1 - row);

  for (const row of rowOrder) {
    const count = longestActiveRunInRow(activeCells, row, gridColumns);
    const threshold = rows.length ? continuationThreshold : edgeThreshold;
    if (count < threshold) break;
    rows.push(row);
  }

  return rows.sort((a, b) => a - b);
}

function collectEdgeColumns(activeCells, gridColumns, gridRows, edge) {
  const columns = [];
  const threshold = Math.max(2, Math.ceil(gridRows * 0.35));
  const columnOrder =
    edge === "left"
      ? Array.from({ length: gridColumns }, (_, column) => column)
      : Array.from({ length: gridColumns }, (_, column) => gridColumns - 1 - column);

  for (const column of columnOrder) {
    const count = countActiveInColumn(activeCells, column, gridColumns, gridRows);
    if (count < threshold) break;
    columns.push(column);
  }

  return columns.sort((a, b) => a - b);
}

function removeBandRegion(activeCells, rows, columns, gridColumns, gridRows, kind) {
  if (!rows.length && !columns.length) return [];
  const cells = [];
  const rowSet = new Set(rows);
  const columnSet = new Set(columns);

  for (let index = 0; index < activeCells.length; index += 1) {
    if (!activeCells[index]) continue;
    const row = Math.floor(index / gridColumns);
    const column = index % gridColumns;
    if ((rowSet.size && rowSet.has(row)) || (columnSet.size && columnSet.has(column))) {
      cells.push(index);
      activeCells[index] = false;
    }
  }

  return cells.length ? [buildRegion(cells, gridColumns, gridRows, kind)] : [];
}

function longestActiveRunInRow(activeCells, row, gridColumns) {
  let longest = 0;
  let current = 0;
  const start = row * gridColumns;

  for (let column = 0; column < gridColumns; column += 1) {
    if (activeCells[start + column]) {
      current += 1;
      longest = Math.max(longest, current);
    } else {
      current = 0;
    }
  }

  return longest;
}

function countActiveInColumn(activeCells, column, gridColumns, gridRows) {
  let count = 0;
  for (let row = 0; row < gridRows; row += 1) {
    if (activeCells[row * gridColumns + column]) count += 1;
  }
  return count;
}

function buildRegion(cells, gridColumns, gridRows, forcedKind) {
  const rows = cells.map((index) => Math.floor(index / gridColumns));
  const columns = cells.map((index) => index % gridColumns);
  const minRow = Math.min(...rows);
  const maxRow = Math.max(...rows);
  const minColumn = Math.min(...columns);
  const maxColumn = Math.max(...columns);
  const widthCells = maxColumn - minColumn + 1;
  const heightCells = maxRow - minRow + 1;
  const cellCount = cells.length;

  return {
    kind:
      forcedKind ??
      classifyRegion({
        minRow,
        maxRow,
        minColumn,
        maxColumn,
        widthCells,
        heightCells,
        cellCount,
        gridColumns,
        gridRows,
      }),
    cells: cellCount,
    minRow,
    maxRow,
    minColumn,
    maxColumn,
    widthCells,
    heightCells,
  };
}

function classifyRegion(region) {
  if (region.minRow === 0 && region.widthCells >= Math.ceil(region.gridColumns * 0.45)) {
    return "header/nav";
  }
  if (
    region.maxRow === region.gridRows - 1 &&
    region.widthCells >= Math.ceil(region.gridColumns * 0.35)
  ) {
    return "bottom nav";
  }
  if (region.minColumn <= 1 && region.heightCells >= Math.ceil(region.gridRows * 0.35)) {
    return "side rail";
  }
  if (region.cellCount <= 2 || (region.heightCells <= 1 && region.widthCells <= 3)) {
    return "control cluster";
  }
  if (region.widthCells >= 3 && region.heightCells >= 2) {
    return region.cellCount >= 8 ? "content panel" : "media/chart";
  }
  return "text/list";
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

function mixHex(baseHex, overlayHex, overlayWeight) {
  const base = parseHex(baseHex);
  const overlay = parseHex(overlayHex);
  const weight = clamp(overlayWeight, 0, 1);
  return toHex({
    r: base.r * (1 - weight) + overlay.r * weight,
    g: base.g * (1 - weight) + overlay.g * weight,
    b: base.b * (1 - weight) + overlay.b * weight,
  });
}

function parseHex(hex) {
  const normalized = String(hex || "").replace("#", "");
  if (!/^[0-9a-f]{6}$/i.test(normalized)) {
    return { r: 255, g: 255, b: 255 };
  }

  return {
    r: Number.parseInt(normalized.slice(0, 2), 16),
    g: Number.parseInt(normalized.slice(2, 4), 16),
    b: Number.parseInt(normalized.slice(4, 6), 16),
  };
}

function round(value, places = 2) {
  const factor = 10 ** places;
  return Math.round(value * factor) / factor;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, Number(value) || 0));
}
