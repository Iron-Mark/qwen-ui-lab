const DEFAULT_GRID_COLUMNS = 12;
const DEFAULT_GRID_ROWS = 8;
const SMART_GRID_COLUMNS = 24;
const SMART_GRID_ROWS = 32;
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
      title: "Screen Intent",
      body: summarizeScreenIntent(inspection),
    },
    {
      title: "Element Detection",
      body: summarizeDetectedElements(inspection),
    },
    {
      title: "Responsive Intent",
      body: summarizeResponsiveIntent(inspection),
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
    {
      label: "Responsive",
      value: inspection.layoutTree?.responsive?.mode ?? inspection.visualDensity,
    },
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
  const roleCounts = countBy(elements, "componentRole");
  const countText = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([kind, count]) => `${count} ${kind}`)
    .join(", ");
  const roleText = Object.entries(roleCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([role, count]) => `${count} ${role}`)
    .join(", ");
  const topElements = elements
    .slice(0, 6)
    .map((element) => `${element.kind} ${element.box.x},${element.box.y} ${element.box.width}×${element.box.height}`)
    .join("; ");

  const repeatedListCount = tree?.patterns?.repeatedLists?.length ?? 0;
  const repeatedGridCount = tree?.patterns?.repeatedGrids?.length ?? 0;
  const statRowCount = tree?.patterns?.statRows?.length ?? 0;
  const formGroupCount = tree?.patterns?.formGroups?.length ?? 0;
  const dataTableCount = tree?.patterns?.dataTables?.length ?? 0;
  const chartCount = tree?.patterns?.charts?.length ?? 0;
  const actionClusterCount = tree?.patterns?.actionClusters?.length ?? 0;
  const tabSetCount = tree?.patterns?.tabSets?.length ?? 0;
  const dialogPanelCount = tree?.patterns?.dialogPanels?.length ?? 0;
  const emptyStateCount = tree?.patterns?.emptyStates?.length ?? 0;
  const appShellCount = tree?.patterns?.appShells?.length ?? 0;
  const patternText = tree?.patterns
    ? `${tree.patterns.textLines ?? 0} OCR-free text-line signals, ${repeatedListCount} repeated-list pattern${
        repeatedListCount === 1 ? "" : "s"
      }, ${repeatedGridCount} repeated-grid pattern${repeatedGridCount === 1 ? "" : "s"}, ${statRowCount} stat row${
        statRowCount === 1 ? "" : "s"
      }, ${formGroupCount} form group${
        formGroupCount === 1 ? "" : "s"
      }, ${dataTableCount} data table${dataTableCount === 1 ? "" : "s"}, ${chartCount} chart series, ${actionClusterCount} action cluster${
        actionClusterCount === 1 ? "" : "s"
      }, ${tabSetCount} tab set${tabSetCount === 1 ? "" : "s"}, ${dialogPanelCount} dialog panel${
        dialogPanelCount === 1 ? "" : "s"
      }, ${emptyStateCount} empty state${emptyStateCount === 1 ? "" : "s"}, and ${appShellCount} app shell${
        appShellCount === 1 ? "" : "s"
      } were grouped.`
    : null;

  return [
    `Fine-grid detection found ${elements.length} candidate UI elements (${countText}).`,
    roleText ? `Component snapping inferred ${roleText}.` : null,
    `Hierarchy has ${tree?.groups?.length ?? 0} top-level groups using ${tree?.strategy ?? "projection"} ordering.`,
    patternText,
    `Top candidates: ${topElements}.`,
  ]
    .filter(Boolean)
    .join(" ");
}

function summarizeResponsiveIntent(inspection) {
  const responsive = inspection.layoutTree?.responsive;
  if (!responsive) {
    return "No responsive intent was inferred; validate breakpoints manually.";
  }

  return [
    `Responsive mode: ${responsive.mode} from a ${responsive.source} source.`,
    `Breakpoints: ${responsive.breakpoints.join(", ")}.`,
    `Primary flow: ${responsive.primaryFlow}.`,
    responsive.regions?.collapsibleSidebar
      ? "Collapse the side navigation into a drawer or top filter on smaller screens."
      : null,
    responsive.regions?.fixedBottomNav
      ? "Preserve bottom navigation as a mobile landmark."
      : null,
    responsive.tailwindHint ? `Tailwind scaffold hint: ${responsive.tailwindHint}.` : null,
  ]
    .filter(Boolean)
    .join(" ");
}

function summarizeScreenIntent(inspection) {
  const intent = inspection.layoutTree?.screenIntent ?? inspection.quality?.screenIntent;
  if (!intent) {
    return "No screen-level intent was inferred; classify the page type manually before scaffold generation.";
  }

  const confidence =
    typeof intent.confidence === "number"
      ? `${Math.round(intent.confidence * 100)}% confidence`
      : "local confidence";
  const evidence = (intent.evidence ?? []).slice(0, 3).join(" ");

  return [
    `Likely screen: ${intent.label ?? intent.id} (${confidence}).`,
    evidence ? `Evidence: ${evidence}` : null,
  ]
    .filter(Boolean)
    .join(" ");
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
  const detectedElements = components
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
    .filter((element) => element.confidence >= 0.42);
  const snappedElements = snapComponentRoles(
    enhanceDetectedPatterns(detectedElements, {
      sourceWidth,
      sourceHeight,
    }),
    { sourceWidth, sourceHeight },
  )
    .sort(readingOrderSort)
    .slice(0, 24)
    .map((element, index) => ({ ...element, id: `element-${index + 1}` }));

  const firstPassPatterns = summarizeDetectedPatterns(snappedElements, { sourceWidth, sourceHeight });
  const elements = refineElementsWithPatternSemantics(snappedElements, firstPassPatterns, {
    sourceWidth,
    sourceHeight,
  });
  const patterns = summarizeDetectedPatterns(elements, { sourceWidth, sourceHeight });
  const responsiveIntent = inferResponsiveIntent(elements, {
    sourceWidth,
    sourceHeight,
    patterns,
  });
  const screenIntent = inferScreenIntent(elements, {
    sourceWidth,
    sourceHeight,
    patterns,
    responsiveIntent,
  });
  const layoutTree = buildLayoutTree(elements, {
    sourceWidth,
    sourceHeight,
    patterns,
    responsiveIntent,
    screenIntent,
  });
  const roles = countBy(elements, "componentRole");
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
      patterns: {
        textLines: patterns.textLines,
        repeatedLists: patterns.repeatedLists.length,
        repeatedGrids: patterns.repeatedGrids.length,
        statRows: patterns.statRows.length,
        formGroups: patterns.formGroups.length,
        dataTables: patterns.dataTables.length,
        charts: patterns.charts.length,
        actionClusters: patterns.actionClusters.length,
        tabSets: patterns.tabSets.length,
        dialogPanels: patterns.dialogPanels.length,
        emptyStates: patterns.emptyStates.length,
        appShells: patterns.appShells.length,
      },
      roles,
      responsive: {
        mode: responsiveIntent.mode,
        source: responsiveIntent.source,
        breakpoints: responsiveIntent.breakpoints,
        primaryFlow: responsiveIntent.primaryFlow,
        columns: responsiveIntent.columns,
        tailwindHint: responsiveIntent.tailwindHint,
        regions: responsiveIntent.regions,
      },
      screenIntent,
      ambiguity:
        confidence >= 0.68
          ? "low"
          : confidence >= 0.5
            ? "medium"
            : "high",
    },
  };
}

function inferScreenIntent(elements, { sourceWidth, sourceHeight, patterns, responsiveIntent }) {
  const roles = countBy(elements, "componentRole");
  const scores = {
    dashboard: 0,
    auth: 0,
    mobile: 0,
    settings: 0,
    landing: 0,
    ecommerce: 0,
    modal: 0,
    empty: 0,
  };
  const evidenceByIntent = Object.fromEntries(
    Object.keys(scores).map((key) => [key, []]),
  );
  const add = (id, score, evidence) => {
    scores[id] = (scores[id] ?? 0) + score;
    if (evidence) evidenceByIntent[id].push(evidence);
  };

  const hasTopNavigation = (roles["top-navigation"] ?? 0) > 0;
  const hasSideNavigation = (roles["side-navigation"] ?? 0) > 0;
  const hasBottomNavigation = (roles["bottom-navigation"] ?? 0) > 0;
  const listRows = roles["list-row"] ?? 0;
  const metricCards = roles["metric-card"] ?? 0;
  const chartPanels = roles["chart-panel"] ?? 0;
  const contentCards = roles["content-card"] ?? 0;
  const mediaPanels = roles["media-panel"] ?? 0;
  const formFields = roles["form-field"] ?? 0;
  const searchFields = roles["search-field"] ?? 0;
  const primaryActions = roles["primary-action"] ?? 0;
  const iconActions = roles["icon-action"] ?? 0;
  const textLines = roles["text-line"] ?? 0;
  const repeatedLists = patterns?.repeatedLists?.length ?? 0;
  const repeatedGrids = patterns?.repeatedGrids?.length ?? 0;
  const statRows = patterns?.statRows?.length ?? 0;
  const formGroups = patterns?.formGroups?.length ?? 0;
  const dataTables = patterns?.dataTables?.length ?? 0;
  const charts = patterns?.charts?.length ?? 0;
  const actionClusters = patterns?.actionClusters?.length ?? 0;
  const tabSets = patterns?.tabSets?.length ?? 0;
  const dialogPanels = patterns?.dialogPanels?.length ?? 0;
  const emptyStates = patterns?.emptyStates?.length ?? 0;
  const appShells = patterns?.appShells?.length ?? 0;
  const primaryShell = patterns?.appShells?.[0] ?? null;
  const sourceRatio = sourceWidth / Math.max(1, sourceHeight);

  if (responsiveIntent?.source === "mobile") {
    add("mobile", 1.5, "Source frame is mobile-sized.");
  }
  if (hasBottomNavigation) {
    add("mobile", 2.5, "Bottom navigation was detected.");
  }
  if (hasTopNavigation && hasSideNavigation) {
    add("dashboard", 2.5, "Top navigation and side navigation form an application shell.");
    add("settings", 1.2, "Side navigation can also indicate a settings workspace.");
    add("ecommerce", 1, "Side navigation can represent catalog filters.");
  }
  if (appShells >= 1) {
    add("dashboard", 1.8, `A ${primaryShell?.shellType ?? "navigation"} app shell was grouped from structural landmarks.`);
    if (primaryShell?.shellType === "mobile-tab-shell") {
      add("mobile", 1.8, "Bottom navigation and top landmarks were grouped as a mobile shell.");
    }
    if (primaryShell?.shellType === "desktop-sidebar-shell") {
      add("settings", 0.8, "A persistent sidebar shell can support workspace settings.");
    }
  }
  if (metricCards >= 2) {
    add("dashboard", 2.2, `${metricCards} metric-card regions were detected.`);
  }
  if (statRows >= 1) {
    add("dashboard", 2.4, "A KPI stat row was grouped from aligned metric cards.");
  }
  if (repeatedGrids >= 1) {
    add("dashboard", 2, "A repeated card grid was grouped from aligned rows and columns.");
    add("ecommerce", 1.6, "Repeated grid cards can also represent a product catalog.");
  }
  if (chartPanels >= 1) {
    add("dashboard", 2, "A chart or analytics panel was detected.");
  }
  if (charts >= 1) {
    add("dashboard", 2.3, "A chart series was grouped from aligned visual marks.");
    add("landing", 0.4, "Charts can also support a product or marketing proof point.");
  }
  if (dataTables >= 1) {
    add("dashboard", 2.4, "A tabular data pattern was grouped from aligned rows and columns.");
    add("settings", 0.8, "Tables can also represent admin settings or records.");
  }
  if (listRows >= 3 || repeatedLists >= 1) {
    add("mobile", responsiveIntent?.source === "mobile" ? 1.8 : 0.8, "Repeated full-width rows suggest a feed or list flow.");
    add("dashboard", responsiveIntent?.source === "mobile" ? 0.2 : 1, "Repeated rows can also be an activity table.");
  }
  if (formFields >= 2 && primaryActions >= 1 && !hasSideNavigation && !hasTopNavigation) {
    add("auth", 3, "Stacked form fields with a primary action suggest an auth form.");
  }
  if (formGroups >= 1 && !hasSideNavigation && !hasTopNavigation) {
    add("auth", 2.8, "A grouped form flow was detected without surrounding app navigation.");
  }
  if (formGroups >= 1 && hasSideNavigation) {
    add("settings", 2, "A grouped form flow with navigation suggests settings or profile editing.");
  }
  if ((formFields >= 2 || searchFields >= 1) && hasSideNavigation) {
    add("settings", 2.2, "Navigation plus form controls suggests settings or profile editing.");
  }
  if (searchFields >= 1 && (contentCards + mediaPanels) >= 3) {
    add("ecommerce", 2.5, "Search/filter controls with repeated cards suggest a catalog.");
  }
  if (hasTopNavigation && !hasSideNavigation && primaryActions >= 1 && (contentCards + textLines) >= 2) {
    add("landing", 2, "Top navigation, content blocks, and CTA-like actions suggest a landing page.");
  }
  if (sourceRatio >= 1.45 && (contentCards + mediaPanels) >= 3 && !hasSideNavigation) {
    add("landing", 1, "Wide content-heavy frame can map to a marketing layout.");
  }
  if (iconActions >= 3 && hasTopNavigation) {
    add("dashboard", 0.8, "Header action clusters often appear in dashboards.");
  }
  if (actionClusters >= 1) {
    add("dashboard", 1.1, "A toolbar or action row was grouped from same-row controls.");
    add("landing", 0.9, "Grouped CTAs can indicate a marketing or onboarding flow.");
    add("settings", 0.7, "Grouped controls can also represent settings actions.");
  }
  if (tabSets >= 1) {
    add("dashboard", 1.2, "A tab set was grouped from adjacent segmented controls.");
    add("settings", 1, "Tabbed controls often switch settings or detail panels.");
    add("mobile", responsiveIntent?.source === "mobile" ? 0.8 : 0.3, "Tabs can support compact mobile section switching.");
  }
  if (dialogPanels >= 1) {
    add("modal", 3, "A centered dialog panel was grouped from a floating surface with page margins.");
    add("auth", formGroups >= 1 ? 1.4 : 0.6, "Dialog panels often contain sign-in or confirmation flows.");
    add("settings", 1, "Dialog panels can also represent local profile or preference editing.");
  }
  if (emptyStates >= 1) {
    add("empty", 2.8, "A centered empty-state block was grouped from sparse copy and action affordances.");
    add("mobile", responsiveIntent?.source === "mobile" ? 0.8 : 0.2, "Empty states often appear in compact mobile flows.");
    add("settings", 0.5, "Empty states can appear in setup, profile, or preference surfaces.");
  }

  const ranked = Object.entries(scores).sort((first, second) => second[1] - first[1]);
  const [topId, topScore] = ranked[0] ?? ["dashboard", 0];
  const [, secondScore] = ranked[1] ?? ["", 0];
  const fallbackId = responsiveIntent?.source === "mobile" ? "mobile" : "dashboard";
  const id = topScore > 0 ? topId : fallbackId;
  const margin = Math.max(0, topScore - secondScore);
  const confidence = clamp(0.52 + topScore * 0.075 + margin * 0.035, 0.52, 0.96);

  return {
    id,
    label: SCREEN_INTENT_LABELS[id] ?? titleCase(id),
    confidence: round(confidence, 2),
    evidence: (evidenceByIntent[id] ?? []).slice(0, 4),
    scores: Object.fromEntries(
      Object.entries(scores).map(([key, value]) => [key, round(value, 2)]),
    ),
  };
}

const SCREEN_INTENT_LABELS = {
  dashboard: "Dashboard or analytics workspace",
  auth: "Authentication form",
  mobile: "Mobile app or feed shell",
  settings: "Settings or profile workspace",
  landing: "Marketing or landing page",
  ecommerce: "Product catalog or commerce flow",
  modal: "Modal dialog or focused overlay",
  empty: "Empty or onboarding state",
};

function titleCase(value) {
  return String(value || "")
    .replace(/[-_]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function inferResponsiveIntent(elements, { sourceWidth, sourceHeight, patterns }) {
  const roleCounts = countBy(elements, "componentRole");
  const ratio = sourceWidth / Math.max(1, sourceHeight);
  const source =
    sourceWidth <= 480
      ? "mobile"
      : sourceWidth <= 900 || ratio < 0.85
        ? "tablet"
        : ratio >= 1.55
          ? "wide-desktop"
          : "desktop";
  const hasTopNavigation = (roleCounts["top-navigation"] ?? 0) > 0;
  const hasSideNavigation = (roleCounts["side-navigation"] ?? 0) > 0;
  const hasBottomNavigation = (roleCounts["bottom-navigation"] ?? 0) > 0;
  const listRows = roleCounts["list-row"] ?? 0;
  const cardLike =
    (roleCounts["metric-card"] ?? 0) +
    (roleCounts["content-card"] ?? 0) +
    (roleCounts["chart-panel"] ?? 0) +
    (roleCounts["media-panel"] ?? 0);
  const actionLike =
    (roleCounts["primary-action"] ?? 0) +
    (roleCounts["form-field"] ?? 0) +
    (roleCounts["search-field"] ?? 0);
  const dataTables = patterns?.dataTables?.length ?? 0;
  const chartSeries = patterns?.charts?.length ?? 0;
  const actionClusters = patterns?.actionClusters?.length ?? 0;
  const tabSets = patterns?.tabSets?.length ?? 0;
  const dialogPanels = patterns?.dialogPanels?.length ?? 0;
  const emptyStates = patterns?.emptyStates?.length ?? 0;
  const statRows = patterns?.statRows?.length ?? 0;
  const appShells = patterns?.appShells?.length ?? 0;
  const primaryShell = patterns?.appShells?.[0] ?? null;

  const mode =
    dialogPanels >= 1
      ? "modal-dialog"
      : emptyStates >= 1
        ? "empty-state"
      : hasSideNavigation && source !== "mobile"
      ? "sidebar-grid"
      : primaryShell?.shellType === "mobile-tab-shell"
        ? "mobile-shell"
        : dataTables >= 1
          ? "data-table"
          : chartSeries >= 1
            ? "analytics-chart"
            : statRows >= 1
              ? "stat-strip"
              : tabSets >= 1
                ? "tabbed-content"
              : actionClusters >= 1
                ? "action-toolbar"
                : listRows >= 3
                  ? "stacked-list"
                  : cardLike >= 2
                    ? "responsive-card-grid"
                    : actionLike >= 2
                      ? "form-flow"
                      : "single-column";
  const breakpoints =
    source === "mobile"
      ? ["base", "sm"]
      : source === "tablet"
        ? ["base", "md"]
        : ["base", "md", "lg"];
  const primaryFlow =
    mode === "sidebar-grid"
      ? "collapse sidebar into top filter drawer below lg"
      : mode === "modal-dialog"
        ? "center dialog on desktop and use a near-fullscreen sheet on mobile"
      : mode === "empty-state"
        ? "center the empty-state copy and keep one clear recovery action"
      : mode === "mobile-shell"
        ? "keep top landmarks and bottom navigation fixed while content scrolls"
      : mode === "responsive-card-grid"
        ? "stack cards on mobile, two columns on tablet, preserve grid on desktop"
        : mode === "stacked-list"
          ? "keep list rows full-width with stable vertical rhythm"
          : mode === "data-table"
            ? "wrap tables in horizontal scroll on mobile, keep columns aligned on desktop"
            : mode === "analytics-chart"
              ? "keep chart marks grouped with a readable legend and stable axis spacing"
              : mode === "stat-strip"
                ? "stack KPI cards on mobile and keep a compact metric row on wider screens"
                : mode === "tabbed-content"
                  ? "keep tab triggers as one segmented control and stack tab panels below"
                : mode === "action-toolbar"
                  ? "wrap related actions as a toolbar on mobile while preserving row order"
                  : mode === "form-flow"
                    ? "stack labels and controls on mobile, inline related actions on larger screens"
                    : "single readable column with constrained line length";

  return {
    mode,
    source,
    breakpoints,
    primaryFlow,
    regions: {
      stickyHeader: hasTopNavigation,
      collapsibleSidebar: hasSideNavigation,
      fixedBottomNav: hasBottomNavigation,
      appShellCount: appShells,
      appShellType: primaryShell?.shellType ?? null,
      repeatedListCount: patterns?.repeatedLists?.length ?? 0,
      repeatedGridCount: patterns?.repeatedGrids?.length ?? 0,
      statRowCount: statRows,
      formGroupCount: patterns?.formGroups?.length ?? 0,
      dataTableCount: dataTables,
      chartSeriesCount: chartSeries,
      actionClusterCount: actionClusters,
      tabSetCount: tabSets,
      dialogPanelCount: dialogPanels,
      emptyStateCount: emptyStates,
    },
    columns: {
      base: 1,
      md: mode === "responsive-card-grid" ? 2 : 1,
      lg: mode === "sidebar-grid" ? "sidebar + content" : cardLike >= 3 ? 3 : 2,
    },
    tailwindHint:
      mode === "sidebar-grid"
        ? "grid gap-4 lg:grid-cols-[16rem_minmax(0,1fr)]"
        : mode === "modal-dialog"
        ? "fixed inset-0 grid place-items-center p-4 sm:p-6"
        : mode === "empty-state"
          ? "grid min-h-[24rem] place-items-center text-center"
        : mode === "mobile-shell"
          ? "grid min-h-dvh grid-rows-[auto_1fr_auto]"
        : mode === "responsive-card-grid"
          ? "grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          : mode === "data-table"
            ? "overflow-x-auto"
            : mode === "analytics-chart"
              ? "grid gap-3"
              : mode === "stat-strip"
                ? "grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
                : mode === "tabbed-content"
                  ? "grid gap-3 [&_[role=tablist]]:flex"
                : mode === "action-toolbar"
                  ? "flex flex-wrap items-center gap-2"
                  : mode === "form-flow"
                    ? "grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]"
                    : "grid gap-4",
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
  const primitive = primitiveForKind(kind);
  const reasons = buildDetectionReasons(region, box, {
    kind,
    primitive,
    inkRatio,
    edgeRatio,
    sourceWidth: context.sourceWidth,
    sourceHeight: context.sourceHeight,
  });

  return {
    id: `element-${index + 1}`,
    kind,
    primitive,
    confidence: scoreDetectedElement(region, kind, { inkRatio, edgeRatio, reasons }),
    included: true,
    reasons,
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
  const mobileLike = isMobileLikeSource({ sourceWidth, sourceHeight });
  const shallowBottomBand = box.height <= sourceHeight * 0.14;

  if (yRatio <= 0.08 && box.width >= sourceWidth * 0.35) return "header";
  if (mobileLike && shallowBottomBand && yRatio >= 0.78 && box.width >= sourceWidth * 0.28) {
    return "bottom-nav";
  }
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

function primitiveForKind(kind) {
  if (kind === "button-or-input" || kind === "input-or-button-row") return "field-or-action";
  if (kind === "chart-or-media") return "media";
  if (kind === "card-or-panel") return "card";
  if (kind === "text-row") return "text";
  if (kind === "content-block") return "section";
  return kind;
}

function buildDetectionReasons(
  region,
  box,
  { kind, primitive, inkRatio, edgeRatio, sourceWidth, sourceHeight },
) {
  const aspect = round(box.width / Math.max(1, box.height), 2);
  const areaRatio = round((box.width * box.height) / Math.max(1, sourceWidth * sourceHeight), 3);
  const yRatio = box.y / Math.max(1, sourceHeight);
  const xRatio = box.x / Math.max(1, sourceWidth);
  const reasons = [
    {
      code: "primitive-snap",
      label: `Snapped to ${primitive}`,
      evidence: `${kind} rule matched from geometry and local pixel signals.`,
      weight: 0.22,
    },
    {
      code: "ink-density",
      label: "Foreground density",
      evidence: `${Math.round(inkRatio * 100)}% of sampled pixels differ from the dominant background.`,
      weight: Math.min(0.18, round(inkRatio * 0.7, 2)),
    },
    {
      code: "edge-density",
      label: "Boundary detail",
      evidence: `${Math.round(edgeRatio * 100)}% local edge coverage indicates UI boundaries or glyph strokes.`,
      weight: Math.min(0.2, round(edgeRatio * 1.4, 2)),
    },
    {
      code: "grid-component",
      label: "Connected grid region",
      evidence: `${region.cells} active fine-grid cells form one connected component.`,
      weight: region.cells >= 4 ? 0.14 : 0.08,
    },
  ];

  if (yRatio <= 0.08 && box.width >= sourceWidth * 0.35) {
    reasons.push({
      code: "top-band",
      label: "Top band position",
      evidence: "Wide component sits near the top edge, a common header/navigation location.",
      weight: 0.22,
    });
  }
  if (xRatio <= 0.12 && box.height >= sourceHeight * 0.32) {
    reasons.push({
      code: "left-rail",
      label: "Left rail position",
      evidence: "Tall component is anchored to the left edge, matching side navigation patterns.",
      weight: 0.2,
    });
  }
  if (aspect >= 2.2 && box.height <= sourceHeight * 0.16) {
    reasons.push({
      code: "text-line-shape",
      label: "OCR-free text line",
      evidence: `Wide shallow shape with ${aspect}:1 aspect ratio resembles text, input, or button rows.`,
      weight: 0.16,
    });
  }
  if (areaRatio >= 0.08) {
    reasons.push({
      code: "large-container",
      label: "Container scale",
      evidence: `${Math.round(areaRatio * 100)}% of the screenshot is covered by this component.`,
      weight: 0.16,
    });
  }

  return reasons.sort((first, second) => second.weight - first.weight).slice(0, 5);
}

function scoreDetectedElement(region, kind, { inkRatio, edgeRatio, reasons }) {
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
  const reasonBoost = Math.min(
    0.12,
    (reasons ?? []).reduce((sum, reason) => sum + Math.max(0, reason.weight), 0) / 10,
  );
  const sizePenalty = region.cells <= 1 ? 0.1 : 0;

  return round(
    Math.min(0.97, (baseScores[kind] ?? 0.5) + signalBoost + reasonBoost - sizePenalty),
    2,
  );
}

function enhanceDetectedPatterns(elements, { sourceWidth, sourceHeight }) {
  const byRow = new Map();
  const rowBucketHeight = Math.max(48, Math.round(sourceHeight / 14));

  for (const element of elements) {
    const rowKey = Math.floor(element.box.y / rowBucketHeight);
    const current = byRow.get(rowKey) ?? [];
    current.push(element);
    byRow.set(rowKey, current);
  }

  const repeatedIds = new Set();
  for (const rowElements of byRow.values()) {
    const candidates = rowElements.filter((element) => {
      const aspect = element.box.width / Math.max(1, element.box.height);
      return aspect >= 1.6 && element.box.height <= rowBucketHeight * 1.5;
    });
    if (candidates.length < 3) continue;
    for (const element of candidates) {
      repeatedIds.add(element.id);
    }
  }
  const repeatedListRuns = detectRepeatedListRuns(elements, { sourceWidth, sourceHeight });
  for (const run of repeatedListRuns) {
    for (const id of run.children) repeatedIds.add(id);
  }

  return elements.map((element) => {
    const textLineScore = scoreTextLineSignal(element, { sourceHeight });
    const textLike = textLineScore >= 0.62;
    const reasons = [...(element.reasons ?? [])];
    let kind = element.kind;
    let primitive = element.primitive;
    let confidence = element.confidence;

    if (textLike && !/header|nav|button|input/i.test(kind)) {
      kind = "text-row";
      primitive = "text";
      confidence = Math.min(0.97, confidence + 0.03 + textLineScore * 0.03);
      reasons.push({
        code: "text-line-grouping",
        label: "Aligned text signal",
        evidence: "OCR-free grouping found a shallow aligned component with foreground strokes.",
        weight: 0.14,
      });
    }

    if (repeatedIds.has(element.id)) {
      primitive = "list-item";
      confidence = Math.min(0.97, confidence + 0.06);
      reasons.push({
        code: "repeated-list",
        label: "Repeated list pattern",
        evidence: "Similar components repeat with aligned x-position, width, and vertical rhythm.",
        weight: 0.18,
      });
    }

    return {
      ...element,
      kind,
      primitive,
      confidence: round(confidence, 2),
      signals: {
        ...element.signals,
        textLineScore: round(textLineScore, 2),
        repeatedPattern: repeatedIds.has(element.id),
      },
      reasons: reasons.sort((first, second) => second.weight - first.weight).slice(0, 5),
    };
  });
}

function snapComponentRoles(elements, { sourceWidth, sourceHeight }) {
  return elements.map((element) => {
    const componentRole = inferComponentRole(element, { sourceWidth, sourceHeight });
    const roleReason = buildComponentRoleReason(componentRole, element, {
      sourceWidth,
      sourceHeight,
    });
    const confidenceBoost = componentRoleConfidenceBoost(componentRole);

    return {
      ...element,
      componentRole,
      confidence: round(Math.min(0.98, element.confidence + confidenceBoost), 2),
      signals: {
        ...element.signals,
        componentRole,
      },
      reasons: [...(element.reasons ?? []), roleReason]
        .sort((first, second) => second.weight - first.weight)
        .slice(0, 5),
    };
  });
}

function isMobileLikeSource({ sourceWidth, sourceHeight }) {
  return sourceWidth <= 640 || sourceHeight >= sourceWidth * 1.2;
}

function refineElementsWithPatternSemantics(elements, patterns) {
  const updates = new Map(elements.map((element) => [element.id, element]));
  const addReason = (elementId, reason, pattern, roleHint = null) => {
    const current = updates.get(elementId);
    if (!current) return;
    const patternRoles = current.signals?.patternRoles ?? [];
    const nextPatternRoles = patternRoles.includes(pattern.kind)
      ? patternRoles
      : [...patternRoles, pattern.kind];
    const nextReasons = [...(current.reasons ?? []), reason]
      .sort((first, second) => second.weight - first.weight)
      .slice(0, 6);

    updates.set(elementId, {
      ...current,
      confidence: round(Math.min(0.99, current.confidence + Math.min(0.05, reason.weight * 0.08)), 2),
      ...(roleHint ? { componentRole: roleHint } : {}),
      signals: {
        ...current.signals,
        patternRoles: nextPatternRoles,
        patternConfidence: Math.max(current.signals?.patternConfidence ?? 0, pattern.confidence ?? 0),
        ...(roleHint ? { componentRole: roleHint } : {}),
      },
      reasons: nextReasons,
    });
  };

  for (const pattern of patterns?.appShells ?? []) {
    for (const childId of pattern.children ?? []) {
      addReason(
        childId,
        buildPatternReason("app-shell", pattern),
        pattern,
      );
    }
  }
  for (const pattern of patterns?.repeatedLists ?? []) {
    for (const childId of pattern.children ?? []) {
      addReason(childId, buildPatternReason("repeated-list", pattern), pattern, "list-row");
    }
  }
  for (const pattern of patterns?.repeatedGrids ?? []) {
    for (const childId of pattern.children ?? []) {
      addReason(childId, buildPatternReason("repeated-grid", pattern), pattern);
    }
  }
  for (const pattern of patterns?.statRows ?? []) {
    for (const childId of pattern.children ?? []) {
      addReason(childId, buildPatternReason("stat-row", pattern), pattern, "metric-card");
    }
  }
  for (const pattern of patterns?.formGroups ?? []) {
    for (const childId of pattern.children ?? []) {
      addReason(childId, buildPatternReason("form-group", pattern), pattern);
    }
  }
  for (const pattern of patterns?.dataTables ?? []) {
    for (const childId of pattern.children ?? []) {
      addReason(childId, buildPatternReason("data-table", pattern), pattern);
    }
  }
  for (const pattern of patterns?.charts ?? []) {
    for (const childId of pattern.children ?? []) {
      addReason(childId, buildPatternReason("chart-series", pattern), pattern);
    }
  }
  for (const pattern of patterns?.actionClusters ?? []) {
    for (const childId of pattern.children ?? []) {
      addReason(childId, buildPatternReason("action-cluster", pattern), pattern);
    }
  }
  for (const pattern of patterns?.tabSets ?? []) {
    for (const childId of pattern.children ?? []) {
      addReason(childId, buildPatternReason("tab-set", pattern), pattern);
    }
  }
  for (const pattern of patterns?.dialogPanels ?? []) {
    for (const childId of pattern.children ?? []) {
      addReason(childId, buildPatternReason("dialog-panel", pattern), pattern);
    }
  }
  for (const pattern of patterns?.emptyStates ?? []) {
    for (const childId of pattern.children ?? []) {
      addReason(childId, buildPatternReason("empty-state", pattern), pattern, "empty-state");
    }
  }

  return elements.map((element) => updates.get(element.id) ?? element);
}

function buildPatternReason(kind, pattern) {
  const definitions = {
    "app-shell": {
      label: "Grouped app shell",
      evidence: `${titleCase(pattern.shellType ?? "navigation shell")} with ${pattern.navCount ?? pattern.children?.length ?? 0} navigation landmarks.`,
      weight: 0.34,
    },
    "repeated-list": {
      label: "Repeated list rhythm",
      evidence: `${pattern.children?.length ?? 0} rows share x-alignment, width, and vertical rhythm.`,
      weight: 0.3,
    },
    "repeated-grid": {
      label: "Repeated card grid",
      evidence: `${pattern.rows ?? 0} by ${pattern.columns ?? 0} aligned card matrix with matching item sizes.`,
      weight: 0.31,
    },
    "stat-row": {
      label: "Metric row grouping",
      evidence: `${pattern.cardCount ?? pattern.children?.length ?? 0} KPI-like cards align on one horizontal baseline.`,
      weight: 0.29,
    },
    "form-group": {
      label: "Form flow grouping",
      evidence: `${pattern.fieldCount ?? 0} fields and ${pattern.actionCount ?? 0} actions share a form rhythm.`,
      weight: 0.32,
    },
    "data-table": {
      label: "Table grid alignment",
      evidence: `${pattern.rows ?? 0} rows and ${pattern.columns ?? 0} columns align into a tabular grid.`,
      weight: 0.35,
    },
    "chart-series": {
      label: "Chart series baseline",
      evidence: `${pattern.seriesCount ?? pattern.children?.length ?? 0} marks share an axis baseline and spacing.`,
      weight: 0.34,
    },
    "action-cluster": {
      label: "Grouped controls",
      evidence: `${pattern.controlCount ?? pattern.children?.length ?? 0} controls align as a ${pattern.clusterType ?? "toolbar"}.`,
      weight: 0.29,
    },
    "tab-set": {
      label: "Tab set alignment",
      evidence: `${pattern.tabCount ?? pattern.children?.length ?? 0} adjacent triggers form a ${pattern.tabKind ?? "tab"} control.`,
      weight: 0.33,
    },
    "dialog-panel": {
      label: "Dialog surface grouping",
      evidence: `Floating panel is ${Math.round((pattern.centeredness ?? 0) * 100)}% centered with grouped inner content.`,
      weight: 0.36,
    },
    "empty-state": {
      label: "Empty-state composition",
      evidence: `${pattern.textCount ?? 0} copy rows and ${pattern.actionCount ?? 0} recovery actions are centered in sparse space.`,
      weight: 0.35,
    },
  };
  const definition = definitions[kind] ?? {
    label: "Pattern grouping",
    evidence: "Higher-level layout pattern grouped this element.",
    weight: 0.24,
  };

  return {
    code: kind,
    label: definition.label,
    evidence: definition.evidence,
    weight: definition.weight,
  };
}

function inferComponentRole(element, { sourceWidth, sourceHeight }) {
  const primitive = element.primitive ?? element.kind;
  const aspect = element.box.width / Math.max(1, element.box.height);
  const widthRatio = element.box.width / Math.max(1, sourceWidth);
  const heightRatio = element.box.height / Math.max(1, sourceHeight);
  const areaRatio = (element.box.width * element.box.height) / Math.max(1, sourceWidth * sourceHeight);
  const yRatio = element.box.y / Math.max(1, sourceHeight);
  const xRatio = element.box.x / Math.max(1, sourceWidth);

  if (primitive === "list-item") return "list-row";
  if (element.kind === "header" || element.kind === "header/nav") {
    return yRatio <= 0.1 ? "top-navigation" : "section-header";
  }
  if (element.kind === "side-nav" || element.kind === "side rail") return "side-navigation";
  if (element.kind === "bottom-nav" || element.kind === "bottom nav") return "bottom-navigation";
  if (primitive === "media" || /chart|media/.test(element.kind)) {
    return aspect >= 1.15 ? "chart-panel" : "media-panel";
  }
  if (primitive === "field-or-action") {
    if (widthRatio >= 0.42 && aspect >= 4) return "search-field";
    if (aspect >= 2.3 && widthRatio >= 0.18) return "form-field";
    return "primary-action";
  }
  if (primitive === "card") {
    if (heightRatio <= 0.18 && areaRatio <= 0.12) return "metric-card";
    return "content-card";
  }
  if (primitive === "text") return "text-line";
  if (element.kind === "control") {
    if (xRatio >= 0.78 || yRatio <= 0.16) return "icon-action";
    return "control";
  }

  return "content-section";
}

function buildComponentRoleReason(componentRole, element, { sourceWidth, sourceHeight }) {
  const aspect = round(element.box.width / Math.max(1, element.box.height), 2);
  const widthPercent = Math.round((element.box.width / Math.max(1, sourceWidth)) * 100);
  const heightPercent = Math.round((element.box.height / Math.max(1, sourceHeight)) * 100);
  return {
    code: "component-snap",
    label: `Snapped to ${componentRole}`,
    evidence: `Geometry matched ${componentRole}: ${widthPercent}% width, ${heightPercent}% height, ${aspect}:1 aspect.`,
    weight: componentRoleConfidenceBoost(componentRole) + 0.2,
  };
}

function componentRoleConfidenceBoost(componentRole) {
  if (/navigation|chart-panel|list-row/.test(componentRole)) return 0.04;
  if (/search-field|form-field|metric-card|content-card/.test(componentRole)) return 0.03;
  if (/primary-action|icon-action|text-line/.test(componentRole)) return 0.02;
  return 0.01;
}

function scoreTextLineSignal(element, { sourceHeight }) {
  const aspect = element.box.width / Math.max(1, element.box.height);
  const heightRatio = element.box.height / Math.max(1, sourceHeight);
  const inkRatio = element.signals?.inkRatio ?? 0;
  const edgeRatio = element.signals?.edgeRatio ?? 0;
  const aspectScore = clamp((aspect - 1.2) / 3.8, 0, 1);
  const heightScore = clamp((0.16 - heightRatio) / 0.14, 0, 1);
  const signalScore = clamp(inkRatio * 3.2 + edgeRatio * 8, 0, 1);

  return round(aspectScore * 0.38 + heightScore * 0.28 + signalScore * 0.34, 3);
}

function detectRepeatedListRuns(elements, { sourceWidth, sourceHeight }) {
  const candidates = elements
    .filter((element) => isRepeatedListCandidate(element, { sourceWidth, sourceHeight }))
    .sort((first, second) => first.box.y - second.box.y || first.box.x - second.box.x);
  const clusters = [];

  for (const candidate of candidates) {
    const cluster = clusters.find((current) =>
      current.some((element) =>
        areAlignedListItems(candidate, element, { sourceWidth }),
      ),
    );
    if (cluster) {
      cluster.push(candidate);
    } else {
      clusters.push([candidate]);
    }
  }

  return clusters
    .map((cluster, index) => buildRepeatedListRun(cluster, index))
    .filter(Boolean);
}

function detectRepeatedGridPatterns(elements, { sourceWidth, sourceHeight }) {
  const candidates = elements
    .filter((element) => isRepeatedGridCandidate(element, { sourceWidth, sourceHeight }))
    .sort((first, second) => first.box.y - second.box.y || first.box.x - second.box.x);
  const clusters = [];

  for (const candidate of candidates) {
    const cluster = clusters.find((current) =>
      current.some((element) => areSimilarGridItems(candidate, element)),
    );
    if (cluster) {
      cluster.push(candidate);
    } else {
      clusters.push([candidate]);
    }
  }

  return clusters
    .map((cluster, index) =>
      buildRepeatedGridPattern(cluster, index, { sourceWidth, sourceHeight }),
    )
    .filter(Boolean);
}

function isRepeatedGridCandidate(element, { sourceWidth, sourceHeight }) {
  if (/header|nav/i.test(element.kind)) return false;
  if (element.primitive === "list-item") return false;
  const role = element.componentRole ?? "";
  const widthRatio = element.box.width / Math.max(1, sourceWidth);
  const heightRatio = element.box.height / Math.max(1, sourceHeight);
  const signal = (element.signals?.inkRatio ?? 0) + (element.signals?.edgeRatio ?? 0) * 2;

  return (
    /card|panel/.test(element.primitive ?? "") ||
    /metric-card|content-card|media-panel|chart-panel/.test(role) ||
    (widthRatio >= 0.12 &&
      widthRatio <= 0.48 &&
      heightRatio >= 0.06 &&
      heightRatio <= 0.34 &&
      signal >= 0.045)
  );
}

function areSimilarGridItems(first, second) {
  const widthDelta =
    Math.abs(first.box.width - second.box.width) /
    Math.max(1, Math.max(first.box.width, second.box.width));
  const heightDelta =
    Math.abs(first.box.height - second.box.height) /
    Math.max(1, Math.max(first.box.height, second.box.height));
  const aspectDelta =
    Math.abs(
      first.box.width / Math.max(1, first.box.height) -
        second.box.width / Math.max(1, second.box.height),
    ) / Math.max(1, first.box.width / Math.max(1, first.box.height));

  return widthDelta <= 0.32 && heightDelta <= 0.42 && aspectDelta <= 0.36;
}

function buildRepeatedGridPattern(cluster, index, { sourceWidth, sourceHeight }) {
  const sorted = cluster.slice().sort((first, second) => first.box.y - second.box.y || first.box.x - second.box.x);
  if (sorted.length < 4) return null;

  const rowBuckets = groupByAxisCenter(sorted, "y", Math.max(18, sourceHeight * 0.055));
  const columnBuckets = groupByAxisCenter(sorted, "x", Math.max(18, sourceWidth * 0.055));
  const rows = rowBuckets.filter((bucket) => bucket.items.length >= 2);
  const columns = columnBuckets.filter((bucket) => bucket.items.length >= 2);
  if (rows.length < 2 || columns.length < 2) return null;

  const coveredIds = new Set([...rows.flatMap((bucket) => bucket.items.map((item) => item.id))]);
  const children = sorted.filter((element) => coveredIds.has(element.id));
  if (children.length < 4) return null;

  const rowRhythm = axisRhythm(rows.map((bucket) => bucket.center));
  const columnRhythm = axisRhythm(columns.map((bucket) => bucket.center));
  const sizeConsistency = gridItemSizeConsistency(children);
  const confidence = round(
    0.56 +
      sizeConsistency * 0.18 +
      ((rowRhythm + columnRhythm) / 2) * 0.18 +
      Math.min(0.08, children.length * 0.012),
    2,
  );
  if (confidence < 0.62) return null;

  return {
    id: `repeated-grid-${index + 1}`,
    kind: "repeated-grid",
    axis: "grid",
    rows: rows.length,
    columns: columns.length,
    rhythm: round((rowRhythm + columnRhythm) / 2, 2),
    confidence,
    box: mergeBoxes(children.map((element) => element.box)),
    children: children.map((element) => element.id),
  };
}

function detectStatRowPatterns(elements, { sourceWidth, sourceHeight }, repeatedGrids = []) {
  const gridIds = new Set(repeatedGrids.flatMap((pattern) => pattern.children ?? []));
  const candidates = elements
    .filter(
      (element) =>
        !gridIds.has(element.id) &&
        isStatRowCandidate(element, { sourceWidth, sourceHeight }),
    )
    .sort((first, second) => first.box.y - second.box.y || first.box.x - second.box.x);
  if (candidates.length < 2) return [];

  const rowBuckets = groupByAxisCenter(candidates, "y", Math.max(16, sourceHeight * 0.05))
    .map((bucket) => ({
      ...bucket,
      items: bucket.items.slice().sort((first, second) => first.box.x - second.box.x),
    }))
    .filter((bucket) => bucket.items.length >= 2);

  return rowBuckets
    .map((bucket, index) =>
      buildStatRowPattern(bucket.items, index, { sourceWidth, sourceHeight }),
    )
    .filter(Boolean);
}

function isStatRowCandidate(element, { sourceWidth, sourceHeight }) {
  if (/header|nav/i.test(element.kind)) return false;
  if (element.primitive === "list-item") return false;
  const role = element.componentRole ?? "";
  const primitive = element.primitive ?? "";
  const widthRatio = element.box.width / Math.max(1, sourceWidth);
  const heightRatio = element.box.height / Math.max(1, sourceHeight);
  const areaRatio = (element.box.width * element.box.height) / Math.max(1, sourceWidth * sourceHeight);
  const aspect = element.box.width / Math.max(1, element.box.height);
  const signal = (element.signals?.inkRatio ?? 0) + (element.signals?.edgeRatio ?? 0) * 2;
  const cardLike =
    role === "metric-card" ||
    (primitive === "card" && /metric-card|content-card/.test(role)) ||
    (element.kind === "card-or-panel" && primitive === "card");

  return (
    cardLike &&
    widthRatio >= 0.1 &&
    widthRatio <= 0.42 &&
    heightRatio >= 0.05 &&
    heightRatio <= 0.22 &&
    areaRatio <= 0.14 &&
    aspect >= 1.1 &&
    signal >= 0.035
  );
}

function buildStatRowPattern(elements, index, { sourceWidth, sourceHeight }) {
  const sorted = elements.slice().sort((first, second) => first.box.x - second.box.x);
  if (sorted.length < 2) return null;

  const box = mergeBoxes(sorted.map((element) => element.box));
  const boxHeightRatio = box.height / Math.max(1, sourceHeight);
  const boxWidthRatio = box.width / Math.max(1, sourceWidth);
  if (boxHeightRatio > 0.26 || boxWidthRatio > 0.98) return null;

  const yCenters = sorted.map((element) => element.box.y + element.box.height / 2);
  const averageCenter = yCenters.reduce((sum, value) => sum + value, 0) / Math.max(1, yCenters.length);
  const rowVariance =
    yCenters.reduce((sum, value) => sum + Math.abs(value - averageCenter), 0) /
    Math.max(1, yCenters.length);
  const rowAlignment = clamp(1 - rowVariance / Math.max(1, sourceHeight * 0.045), 0, 1);
  const sizeConsistency = gridItemSizeConsistency(sorted);
  const xRhythm = axisRhythm(sorted.map((element) => element.box.x + element.box.width / 2));
  const metricRatio =
    sorted.filter((element) => element.componentRole === "metric-card").length /
    Math.max(1, sorted.length);
  const confidence = round(
    clamp(
      0.56 +
        rowAlignment * 0.16 +
        sizeConsistency * 0.14 +
        xRhythm * 0.1 +
        metricRatio * 0.08 +
        Math.min(0.06, sorted.length * 0.014),
      0.56,
      0.95,
    ),
    2,
  );
  if (confidence < 0.64) return null;

  return {
    id: `stat-row-${index + 1}`,
    kind: "stat-row",
    axis: "horizontal",
    cardCount: sorted.length,
    rhythm: round(xRhythm, 2),
    confidence,
    box,
    children: sorted.map((element) => element.id),
  };
}

function groupByAxisCenter(elements, axis, tolerance) {
  const centerKey = axis === "x" ? "width" : "height";
  const sorted = elements
    .map((element) => ({
      element,
      center: element.box[axis] + element.box[centerKey] / 2,
    }))
    .sort((first, second) => first.center - second.center);
  const buckets = [];

  for (const item of sorted) {
    const bucket = buckets.find((current) => Math.abs(current.center - item.center) <= tolerance);
    if (bucket) {
      bucket.items.push(item.element);
      bucket.center =
        bucket.items.reduce(
          (sum, element) => sum + element.box[axis] + element.box[centerKey] / 2,
          0,
        ) / bucket.items.length;
    } else {
      buckets.push({ center: item.center, items: [item.element] });
    }
  }

  return buckets.sort((first, second) => first.center - second.center);
}

function axisRhythm(centers) {
  const sorted = centers.slice().sort((first, second) => first - second);
  if (sorted.length <= 2) return 1;
  const gaps = [];
  for (let index = 1; index < sorted.length; index += 1) {
    gaps.push(sorted[index] - sorted[index - 1]);
  }
  const averageGap = gaps.reduce((sum, gap) => sum + gap, 0) / Math.max(1, gaps.length);
  const variance =
    gaps.reduce((sum, gap) => sum + Math.abs(gap - averageGap), 0) / Math.max(1, gaps.length);
  return averageGap ? clamp(1 - variance / averageGap, 0, 1) : 0;
}

function gridItemSizeConsistency(elements) {
  const averageWidth =
    elements.reduce((sum, element) => sum + element.box.width, 0) / Math.max(1, elements.length);
  const averageHeight =
    elements.reduce((sum, element) => sum + element.box.height, 0) / Math.max(1, elements.length);
  const widthVariance =
    elements.reduce((sum, element) => sum + Math.abs(element.box.width - averageWidth), 0) /
    Math.max(1, elements.length);
  const heightVariance =
    elements.reduce((sum, element) => sum + Math.abs(element.box.height - averageHeight), 0) /
    Math.max(1, elements.length);
  const widthScore = averageWidth ? clamp(1 - widthVariance / averageWidth, 0, 1) : 0;
  const heightScore = averageHeight ? clamp(1 - heightVariance / averageHeight, 0, 1) : 0;
  return (widthScore + heightScore) / 2;
}

function detectFormGroups(elements, { sourceWidth, sourceHeight }) {
  const candidates = elements
    .filter((element) => isFormGroupCandidate(element, { sourceWidth, sourceHeight }))
    .sort((first, second) => first.box.y - second.box.y || first.box.x - second.box.x);
  const clusters = [];

  for (const candidate of candidates) {
    const cluster = clusters.find((current) =>
      current.some((element) => areRelatedFormControls(candidate, element, { sourceWidth })),
    );
    if (cluster) {
      cluster.push(candidate);
    } else {
      clusters.push([candidate]);
    }
  }

  return clusters
    .map((cluster, index) =>
      buildFormGroupPattern(cluster, index, { sourceWidth, sourceHeight }),
    )
    .filter(Boolean);
}

function isFormGroupCandidate(element, { sourceWidth, sourceHeight }) {
  if (/header|nav/i.test(element.kind)) return false;
  if (element.primitive === "list-item") return false;
  const role = element.componentRole ?? "";
  const widthRatio = element.box.width / Math.max(1, sourceWidth);
  const heightRatio = element.box.height / Math.max(1, sourceHeight);
  const aspect = element.box.width / Math.max(1, element.box.height);

  return (
    /form-field|search-field|primary-action/.test(role) ||
    (element.primitive === "field-or-action" &&
      widthRatio >= 0.14 &&
      heightRatio <= 0.16 &&
      aspect >= 1.2)
  );
}

function areRelatedFormControls(first, second, { sourceWidth }) {
  const xTolerance = Math.max(26, sourceWidth * 0.08);
  const centerDelta = Math.abs(
    first.box.x + first.box.width / 2 - (second.box.x + second.box.width / 2),
  );
  const overlap = horizontalOverlapRatio(first.box, second.box);
  const nestedLeftAlignment = Math.abs(first.box.x - second.box.x) <= xTolerance;

  return overlap >= 0.42 || centerDelta <= sourceWidth * 0.12 || nestedLeftAlignment;
}

function buildFormGroupPattern(cluster, index, { sourceWidth, sourceHeight }) {
  const sorted = cluster.slice().sort((first, second) => first.box.y - second.box.y);
  const fields = sorted.filter((element) =>
    /form-field|search-field/.test(element.componentRole ?? ""),
  );
  const actions = sorted.filter((element) =>
    /primary-action|icon-action/.test(element.componentRole ?? ""),
  );
  if (sorted.length < 3 && !(fields.length >= 2 && actions.length >= 1)) return null;
  if (fields.length < 2) return null;

  const gaps = [];
  for (let item = 1; item < sorted.length; item += 1) {
    gaps.push(sorted[item].box.y - sorted[item - 1].box.y);
  }
  const positiveGaps = gaps.filter((gap) => gap > 0);
  const averageGap =
    positiveGaps.reduce((sum, gap) => sum + gap, 0) / Math.max(1, positiveGaps.length);
  const variance =
    positiveGaps.reduce((sum, gap) => sum + Math.abs(gap - averageGap), 0) /
    Math.max(1, positiveGaps.length);
  const rhythm = averageGap ? clamp(1 - variance / Math.max(averageGap, 1), 0, 1) : 0.65;
  const box = mergeBoxes(sorted.map((element) => element.box));
  const density = (box.width * box.height) / Math.max(1, sourceWidth * sourceHeight);
  const confidence = round(
    clamp(0.6 + fields.length * 0.06 + actions.length * 0.08 + rhythm * 0.12 - density * 0.08, 0.6, 0.94),
    2,
  );

  return {
    id: `form-group-${index + 1}`,
    kind: "form-group",
    axis: "vertical",
    fieldCount: fields.length,
    actionCount: actions.length,
    rhythm: round(rhythm, 2),
    confidence,
    box,
    children: sorted.map((element) => element.id),
  };
}

function detectDataTablePatterns(elements, { sourceWidth, sourceHeight }) {
  const candidates = elements
    .filter((element) => isDataTableCellCandidate(element, { sourceWidth, sourceHeight }))
    .sort((first, second) => first.box.y - second.box.y || first.box.x - second.box.x);
  if (candidates.length < 9) return [];

  const rowBuckets = groupByAxisCenter(candidates, "y", Math.max(8, sourceHeight * 0.025))
    .filter((bucket) => bucket.items.length >= 3);
  if (rowBuckets.length < 3) return [];

  const rowChildren = rowBuckets.flatMap((bucket) => bucket.items);
  const columnBuckets = groupByAxisCenter(rowChildren, "x", Math.max(10, sourceWidth * 0.035))
    .filter((bucket) => bucket.items.length >= Math.max(2, Math.floor(rowBuckets.length * 0.45)));
  if (columnBuckets.length < 3) return [];

  const columnTolerance = Math.max(12, sourceWidth * 0.045);
  const rowColumnCounts = rowBuckets.map((row) => {
    const matchedColumns = new Set();
    for (const item of row.items) {
      const center = item.box.x + item.box.width / 2;
      const columnIndex = columnBuckets.findIndex(
        (column) => Math.abs(column.center - center) <= columnTolerance,
      );
      if (columnIndex >= 0) matchedColumns.add(columnIndex);
    }
    return matchedColumns.size;
  });
  const completeRows = rowColumnCounts.filter((count) => count >= Math.min(3, columnBuckets.length)).length;
  if (completeRows < 3) return [];

  const children = rowChildren.filter((element) => {
    const center = element.box.x + element.box.width / 2;
    return columnBuckets.some((column) => Math.abs(column.center - center) <= columnTolerance);
  });
  const rowRhythm = axisRhythm(rowBuckets.map((bucket) => bucket.center));
  const columnRhythm = axisRhythm(columnBuckets.map((bucket) => bucket.center));
  const columnCompleteness =
    rowColumnCounts.reduce((sum, count) => sum + count / Math.max(1, columnBuckets.length), 0) /
    Math.max(1, rowColumnCounts.length);
  const confidence = round(
    clamp(
      0.58 +
        Math.min(0.12, rowBuckets.length * 0.018) +
        Math.min(0.1, columnBuckets.length * 0.018) +
        columnCompleteness * 0.14 +
        ((rowRhythm + columnRhythm) / 2) * 0.12,
      0.58,
      0.95,
    ),
    2,
  );
  if (confidence < 0.66) return [];

  return [
    {
      id: "data-table-1",
      kind: "data-table",
      axis: "rows-columns",
      rows: rowBuckets.length,
      columns: columnBuckets.length,
      rhythm: round((rowRhythm + columnRhythm) / 2, 2),
      confidence,
      box: mergeBoxes(children.map((element) => element.box)),
      children: children.map((element) => element.id),
    },
  ];
}

function isDataTableCellCandidate(element, { sourceWidth, sourceHeight }) {
  if (/header|nav/i.test(element.kind)) return false;
  if (/card|media|chart|form/.test(element.primitive ?? "")) return false;
  const role = element.componentRole ?? "";
  if (/navigation|chart-panel|media-panel|metric-card|content-card|form-field|search-field|primary-action/.test(role)) {
    return false;
  }
  const widthRatio = element.box.width / Math.max(1, sourceWidth);
  const heightRatio = element.box.height / Math.max(1, sourceHeight);
  const aspect = element.box.width / Math.max(1, element.box.height);
  const signal = (element.signals?.inkRatio ?? 0) + (element.signals?.edgeRatio ?? 0) * 2;

  return (
    widthRatio >= 0.035 &&
    widthRatio <= 0.5 &&
    heightRatio <= 0.09 &&
    aspect >= 1.05 &&
    signal >= 0.035
  );
}

function detectChartSeriesPatterns(elements, { sourceWidth, sourceHeight }) {
  const candidates = elements
    .filter((element) => isChartBarCandidate(element, { sourceWidth, sourceHeight }))
    .sort((first, second) => first.box.x - second.box.x || first.box.y - second.box.y);
  if (candidates.length < 3) return [];

  const clusters = [];
  for (const candidate of candidates) {
    const cluster = clusters.find((current) =>
      current.some((element) =>
        areRelatedChartBars(candidate, element, { sourceWidth, sourceHeight }),
      ),
    );
    if (cluster) {
      cluster.push(candidate);
    } else {
      clusters.push([candidate]);
    }
  }

  return clusters
    .map((cluster, index) =>
      buildChartSeriesPattern(cluster, index, { sourceWidth, sourceHeight }),
    )
    .filter(Boolean);
}

function isChartBarCandidate(element, { sourceWidth, sourceHeight }) {
  if (/header|nav/i.test(element.kind)) return false;
  if (element.primitive === "list-item") return false;
  if (/media|chart|form|table/.test(element.primitive ?? "")) return false;
  const role = element.componentRole ?? "";
  if (
    /navigation|chart-panel|media-panel|metric-card|form-field|search-field|primary-action|list-row/.test(
      role,
    )
  ) {
    return false;
  }

  const widthRatio = element.box.width / Math.max(1, sourceWidth);
  const heightRatio = element.box.height / Math.max(1, sourceHeight);
  const aspect = element.box.width / Math.max(1, element.box.height);
  const signal = (element.signals?.inkRatio ?? 0) + (element.signals?.edgeRatio ?? 0) * 2;
  const maxWidthRatio = element.primitive === "card" ? 0.3 : 0.16;

  return (
    widthRatio >= 0.018 &&
    widthRatio <= maxWidthRatio &&
    heightRatio >= 0.055 &&
    heightRatio <= 0.48 &&
    aspect <= 1.18 &&
    signal >= 0.03
  );
}

function areRelatedChartBars(first, second, { sourceWidth, sourceHeight }) {
  const firstBottom = first.box.y + first.box.height;
  const secondBottom = second.box.y + second.box.height;
  const baselineTolerance = Math.max(12, sourceHeight * 0.04);
  const centerDelta = Math.abs(
    first.box.x + first.box.width / 2 - (second.box.x + second.box.width / 2),
  );
  const widthDelta =
    Math.abs(first.box.width - second.box.width) /
    Math.max(1, Math.max(first.box.width, second.box.width));

  return (
    Math.abs(firstBottom - secondBottom) <= baselineTolerance &&
    centerDelta <= sourceWidth * 0.42 &&
    widthDelta <= 0.7
  );
}

function buildChartSeriesPattern(cluster, index, { sourceWidth, sourceHeight }) {
  const sorted = cluster.slice().sort((first, second) => first.box.x - second.box.x);
  if (sorted.length < 3) return null;

  const bottoms = sorted.map((element) => element.box.y + element.box.height);
  const averageBottom = bottoms.reduce((sum, value) => sum + value, 0) / Math.max(1, bottoms.length);
  const baselineVariance =
    bottoms.reduce((sum, value) => sum + Math.abs(value - averageBottom), 0) /
    Math.max(1, bottoms.length);
  const baselineScore = clamp(1 - baselineVariance / Math.max(1, sourceHeight * 0.045), 0, 1);
  const xRhythm = axisRhythm(sorted.map((element) => element.box.x + element.box.width / 2));
  const widthConsistency = chartBarWidthConsistency(sorted);
  const heightRange =
    (Math.max(...sorted.map((element) => element.box.height)) -
      Math.min(...sorted.map((element) => element.box.height))) /
    Math.max(1, Math.max(...sorted.map((element) => element.box.height)));
  if (heightRange < 0.12) return null;
  const box = mergeBoxes(sorted.map((element) => element.box));
  const boxRatio = (box.width * box.height) / Math.max(1, sourceWidth * sourceHeight);
  const confidence = round(
    clamp(
      0.54 +
        baselineScore * 0.18 +
        xRhythm * 0.14 +
        widthConsistency * 0.1 +
        Math.min(0.08, sorted.length * 0.014) +
        Math.min(0.06, heightRange * 0.08) -
        Math.max(0, boxRatio - 0.18) * 0.08,
      0.54,
      0.95,
    ),
    2,
  );
  if (confidence < 0.64) return null;

  return {
    id: `chart-series-${index + 1}`,
    kind: "chart-series",
    chartKind: "bar",
    axis: "x-series",
    seriesCount: sorted.length,
    rhythm: round(xRhythm, 2),
    confidence,
    box,
    children: sorted.map((element) => element.id),
  };
}

function chartBarWidthConsistency(elements) {
  const averageWidth =
    elements.reduce((sum, element) => sum + element.box.width, 0) / Math.max(1, elements.length);
  const widthVariance =
    elements.reduce((sum, element) => sum + Math.abs(element.box.width - averageWidth), 0) /
    Math.max(1, elements.length);
  return averageWidth ? clamp(1 - widthVariance / averageWidth, 0, 1) : 0;
}

function detectActionClusterPatterns(elements, { sourceWidth, sourceHeight }) {
  const candidates = elements
    .filter((element) => isActionClusterCandidate(element, { sourceWidth, sourceHeight }))
    .sort((first, second) => first.box.y - second.box.y || first.box.x - second.box.x);
  if (candidates.length < 2) return [];

  const rowBuckets = groupByAxisCenter(candidates, "y", Math.max(10, sourceHeight * 0.035))
    .map((bucket) => ({
      ...bucket,
      items: bucket.items.slice().sort((first, second) => first.box.x - second.box.x),
    }))
    .filter((bucket) => bucket.items.length >= 2);

  return rowBuckets
    .map((bucket, index) =>
      buildActionClusterPattern(bucket.items, index, { sourceWidth, sourceHeight }),
    )
    .filter(Boolean);
}

function isActionClusterCandidate(element, { sourceWidth, sourceHeight }) {
  if (/header|side-nav|bottom-nav/i.test(element.kind)) return false;
  const role = element.componentRole ?? "";
  const primitive = element.primitive ?? "";
  const widthRatio = element.box.width / Math.max(1, sourceWidth);
  const heightRatio = element.box.height / Math.max(1, sourceHeight);
  const aspect = element.box.width / Math.max(1, element.box.height);
  const signal = (element.signals?.inkRatio ?? 0) + (element.signals?.edgeRatio ?? 0) * 2;
  const buttonLike =
    /button|input|control/.test(element.kind) ||
    /field-or-action|control/.test(primitive) ||
    /primary-action|icon-action|form-field|search-field|control/.test(role);

  return (
    buttonLike &&
    widthRatio >= 0.035 &&
    widthRatio <= 0.42 &&
    heightRatio <= 0.16 &&
    aspect >= 0.75 &&
    signal >= 0.025
  );
}

function buildActionClusterPattern(elements, index, { sourceWidth, sourceHeight }) {
  const sorted = elements.slice().sort((first, second) => first.box.x - second.box.x);
  if (sorted.length < 2) return null;

  const box = mergeBoxes(sorted.map((element) => element.box));
  const boxHeightRatio = box.height / Math.max(1, sourceHeight);
  const boxWidthRatio = box.width / Math.max(1, sourceWidth);
  if (boxHeightRatio > 0.2 || boxWidthRatio > 0.92) return null;

  const yCenters = sorted.map((element) => element.box.y + element.box.height / 2);
  const averageCenter = yCenters.reduce((sum, value) => sum + value, 0) / Math.max(1, yCenters.length);
  const rowVariance =
    yCenters.reduce((sum, value) => sum + Math.abs(value - averageCenter), 0) /
    Math.max(1, yCenters.length);
  const rowAlignment = clamp(1 - rowVariance / Math.max(1, sourceHeight * 0.035), 0, 1);
  const widthConsistency = gridItemSizeConsistency(sorted);
  const xRhythm = axisRhythm(sorted.map((element) => element.box.x + element.box.width / 2));
  const roleScore = sorted.some((element) => /primary-action|icon-action|control/.test(element.componentRole ?? ""))
    ? 1
    : 0.55;
  const clusterType = inferActionClusterType(sorted);
  const confidence = round(
    clamp(
      0.56 +
        rowAlignment * 0.16 +
        widthConsistency * 0.12 +
        xRhythm * 0.1 +
        roleScore * 0.08 +
        Math.min(0.06, sorted.length * 0.015),
      0.56,
      0.95,
    ),
    2,
  );
  if (confidence < 0.62) return null;

  return {
    id: `action-cluster-${index + 1}`,
    kind: "action-cluster",
    clusterType,
    axis: "horizontal",
    controlCount: sorted.length,
    rhythm: round(xRhythm, 2),
    confidence,
    box,
    children: sorted.map((element) => element.id),
  };
}

function inferActionClusterType(elements) {
  const hasIconActions = elements.some((element) => element.componentRole === "icon-action");
  const widthConsistency = gridItemSizeConsistency(elements);
  const narrow = elements.every((element) => element.box.width / Math.max(1, element.box.height) <= 2.4);
  if (hasIconActions || narrow) return "toolbar";
  if (widthConsistency >= 0.72 && elements.length >= 3) return "segmented-control";
  return "cta-row";
}

function detectTabSetPatterns(elements, { sourceWidth, sourceHeight }) {
  const candidates = elements
    .filter((element) => isTabSetCandidate(element, { sourceWidth, sourceHeight }))
    .sort((first, second) => first.box.y - second.box.y || first.box.x - second.box.x);
  if (candidates.length < 2) return [];

  const rowBuckets = groupByAxisCenter(candidates, "y", Math.max(8, sourceHeight * 0.028))
    .map((bucket) => ({
      ...bucket,
      items: bucket.items.slice().sort((first, second) => first.box.x - second.box.x),
    }))
    .filter((bucket) => bucket.items.length >= 2);

  return rowBuckets
    .map((bucket, index) => buildTabSetPattern(bucket.items, index, { sourceWidth, sourceHeight }))
    .filter(Boolean);
}

function isTabSetCandidate(element, { sourceWidth, sourceHeight }) {
  if (/header|side-nav|bottom-nav/i.test(element.kind)) return false;
  const role = element.componentRole ?? "";
  const primitive = element.primitive ?? "";
  const widthRatio = element.box.width / Math.max(1, sourceWidth);
  const heightRatio = element.box.height / Math.max(1, sourceHeight);
  const aspect = element.box.width / Math.max(1, element.box.height);
  const signal = (element.signals?.inkRatio ?? 0) + (element.signals?.edgeRatio ?? 0) * 2;
  const tabLike =
    /button|input|control/.test(element.kind) ||
    /field-or-action|control/.test(primitive) ||
    /primary-action|icon-action|control|list-row|text-line/.test(role);

  return (
    tabLike &&
    widthRatio >= 0.035 &&
    widthRatio <= 0.48 &&
    heightRatio <= 0.18 &&
    aspect >= 0.8 &&
    aspect <= 5.6 &&
    signal >= 0.022
  );
}

function buildTabSetPattern(elements, index, { sourceWidth, sourceHeight }) {
  const sorted = elements.slice().sort((first, second) => first.box.x - second.box.x);
  if (sorted.length < 2) return null;

  const box = mergeBoxes(sorted.map((element) => element.box));
  const boxHeightRatio = box.height / Math.max(1, sourceHeight);
  const boxWidthRatio = box.width / Math.max(1, sourceWidth);
  if (boxHeightRatio > 0.16 || boxWidthRatio > 0.92) return null;

  const gaps = [];
  for (let item = 1; item < sorted.length; item += 1) {
    gaps.push(sorted[item].box.x - (sorted[item - 1].box.x + sorted[item - 1].box.width));
  }
  const positiveGaps = gaps.filter((gap) => gap >= 0);
  if (positiveGaps.length < sorted.length - 1) return null;
  const averageWidth =
    sorted.reduce((sum, element) => sum + element.box.width, 0) / Math.max(1, sorted.length);
  const averageHeight =
    sorted.reduce((sum, element) => sum + element.box.height, 0) / Math.max(1, sorted.length);
  const averageGap =
    positiveGaps.reduce((sum, gap) => sum + gap, 0) / Math.max(1, positiveGaps.length);
  const maxGap = Math.max(...positiveGaps, 0);
  const gapTightness = clamp(
    1 - maxGap / Math.max(1, Math.min(sourceWidth * 0.12, averageWidth * 0.8, averageHeight * 2.5)),
    0,
    1,
  );
  if (gapTightness < 0.34) return null;

  const yCenters = sorted.map((element) => element.box.y + element.box.height / 2);
  const averageCenter = yCenters.reduce((sum, value) => sum + value, 0) / Math.max(1, yCenters.length);
  const rowVariance =
    yCenters.reduce((sum, value) => sum + Math.abs(value - averageCenter), 0) /
    Math.max(1, yCenters.length);
  const rowAlignment = clamp(1 - rowVariance / Math.max(1, sourceHeight * 0.025), 0, 1);
  const sizeConsistency = gridItemSizeConsistency(sorted);
  const selectedIndex = inferSelectedTabIndex(sorted);
  const tabKind = inferTabSetKind(sorted, averageGap, averageHeight);
  const confidence = round(
    clamp(
      0.58 +
        rowAlignment * 0.14 +
        sizeConsistency * 0.12 +
        gapTightness * 0.16 +
        Math.min(0.06, sorted.length * 0.015),
      0.58,
      0.95,
    ),
    2,
  );
  if (confidence < 0.64) return null;

  return {
    id: `tab-set-${index + 1}`,
    kind: "tab-set",
    tabKind,
    axis: "horizontal",
    tabCount: sorted.length,
    selectedIndex,
    rhythm: round(axisRhythm(sorted.map((element) => element.box.x + element.box.width / 2)), 2),
    confidence,
    box,
    children: sorted.map((element) => element.id),
  };
}

function inferTabSetKind(elements, averageGap, averageHeight) {
  const uniform = gridItemSizeConsistency(elements) >= 0.78;
  const tight = averageGap <= averageHeight * 0.35;
  if (uniform && tight) return "segmented-control";
  return "tabs";
}

function inferSelectedTabIndex(elements) {
  const scores = elements.map(
    (element) =>
      (element.confidence ?? 0) +
      (element.signals?.inkRatio ?? 0) * 0.4 +
      (element.signals?.edgeRatio ?? 0) * 2,
  );
  const bestScore = Math.max(...scores);
  const bestIndex = scores.findIndex((score) => score === bestScore);
  return bestIndex >= 0 ? bestIndex : 0;
}

function detectDialogPanelPatterns(elements, { sourceWidth, sourceHeight }) {
  const hasNavigationContext = elements.some((element) =>
    /^(top|side|bottom)-navigation$/.test(element.componentRole ?? ""),
  );
  const candidates = elements
    .filter((element) =>
      isDialogPanelCandidate(element, { sourceWidth, sourceHeight, hasNavigationContext }),
    )
    .sort((first, second) => {
      const firstArea = first.box.width * first.box.height;
      const secondArea = second.box.width * second.box.height;
      if (second.confidence !== first.confidence) return second.confidence - first.confidence;
      return secondArea - firstArea;
    });

  return candidates
    .map((candidate, index) =>
      buildDialogPanelPattern(candidate, elements, index, { sourceWidth, sourceHeight }),
    )
    .filter(Boolean)
    .slice(0, 2);
}

function isDialogPanelCandidate(element, { sourceWidth, sourceHeight, hasNavigationContext }) {
  if (/header|side-nav|bottom-nav/i.test(element.kind)) return false;
  const primitive = element.primitive ?? "";
  const role = element.componentRole ?? "";
  const widthRatio = element.box.width / Math.max(1, sourceWidth);
  const heightRatio = element.box.height / Math.max(1, sourceHeight);
  const areaRatio = (element.box.width * element.box.height) / Math.max(1, sourceWidth * sourceHeight);
  const inkRatio = element.signals?.inkRatio ?? 0;
  const signal = inkRatio + (element.signals?.edgeRatio ?? 0) * 2;
  const surfaceLike =
    /card|panel|section|media/.test(primitive) ||
    /content-card|content-section|chart-panel|media-panel/.test(role);

  if (/chart-panel|media-panel/.test(role) && (hasNavigationContext || inkRatio < 0.35)) {
    return false;
  }

  return (
    surfaceLike &&
    widthRatio >= 0.34 &&
    widthRatio <= 0.9 &&
    heightRatio >= 0.22 &&
    heightRatio <= 0.86 &&
    areaRatio >= 0.12 &&
    areaRatio <= 0.74 &&
    signal >= 0.025
  );
}

function buildDialogPanelPattern(panel, elements, index, { sourceWidth, sourceHeight }) {
  const box = panel.box;
  const rightMargin = sourceWidth - (box.x + box.width);
  const bottomMargin = sourceHeight - (box.y + box.height);
  const minMargin = Math.min(box.x, box.y, rightMargin, bottomMargin);
  const xCenter = box.x + box.width / 2;
  const yCenter = box.y + box.height / 2;
  const centerOffset =
    Math.abs(xCenter - sourceWidth / 2) / Math.max(1, sourceWidth) +
    Math.abs(yCenter - sourceHeight / 2) / Math.max(1, sourceHeight);
  const areaRatio = (box.width * box.height) / Math.max(1, sourceWidth * sourceHeight);
  const marginScore = clamp(minMargin / Math.max(1, Math.min(sourceWidth, sourceHeight) * 0.08), 0, 1);
  const centerScore = clamp(1 - centerOffset / 0.28, 0, 1);
  const scaleScore = clamp((areaRatio - 0.1) / 0.22, 0, 1) * clamp((0.78 - areaRatio) / 0.32, 0, 1);
  const innerChildren = elements
    .filter((element) => element.id !== panel.id && boxContains(panel.box, element.box, 0.035, { sourceWidth, sourceHeight }))
    .sort(readingOrderSort);
  const childScore = Math.min(0.08, innerChildren.length * 0.018);
  const confidence = round(
    clamp(
      0.58 +
        centerScore * 0.16 +
        marginScore * 0.12 +
        scaleScore * 0.12 +
        childScore +
        Math.min(0.05, (panel.confidence ?? 0.5) * 0.05),
      0.58,
      0.96,
    ),
    2,
  );

  if (confidence < 0.65 || minMargin < Math.min(sourceWidth, sourceHeight) * 0.025) {
    return null;
  }

  return {
    id: `dialog-panel-${index + 1}`,
    kind: "dialog-panel",
    modalType: centerOffset <= 0.18 ? "centered-dialog" : "floating-panel",
    axis: "overlay",
    childCount: innerChildren.length,
    centeredness: round(centerScore, 2),
    confidence,
    box,
    children: [panel.id, ...innerChildren.map((element) => element.id)],
  };
}

function detectEmptyStatePatterns(
  elements,
  { sourceWidth, sourceHeight },
  relatedPatterns = {},
) {
  const occupiedPatterns = [
    ...(relatedPatterns.dataTables ?? []),
    ...(relatedPatterns.charts ?? []),
    ...(relatedPatterns.statRows ?? []),
    ...(relatedPatterns.repeatedLists ?? []),
    ...(relatedPatterns.repeatedGrids ?? []),
  ];
  const candidates = elements
    .filter((element) =>
      isEmptyStateCandidate(element, {
        sourceWidth,
        sourceHeight,
        occupiedPatterns,
      }),
    )
    .sort(readingOrderSort);

  const centered = candidates.filter((element) => {
    const xCenter = element.box.x + element.box.width / 2;
    const yCenter = element.box.y + element.box.height / 2;
    const horizontalOffset = Math.abs(xCenter - sourceWidth / 2) / Math.max(1, sourceWidth);
    const yRatio = yCenter / Math.max(1, sourceHeight);
    return horizontalOffset <= 0.28 && yRatio >= 0.22 && yRatio <= 0.82;
  });
  const singleSurfaceCandidates = centered.filter((element) =>
    /chart-panel|media-panel|content-card|content-section|empty-state/.test(element.componentRole ?? ""),
  );
  if (centered.length < 2 && !singleSurfaceCandidates.length) return [];

  const clusters = [];
  for (const candidate of centered) {
    const cluster = clusters.find((current) =>
      current.some((element) => areRelatedEmptyStateParts(candidate, element, { sourceWidth, sourceHeight })),
    );
    if (cluster) {
      cluster.push(candidate);
    } else {
      clusters.push([candidate]);
    }
  }

  return clusters
    .map((cluster, index) =>
      buildEmptyStatePattern(cluster, index, {
        sourceWidth,
        sourceHeight,
        occupiedPatterns,
      }),
    )
    .filter(Boolean)
    .slice(0, 2);
}

function isEmptyStateCandidate(element, { sourceWidth, sourceHeight, occupiedPatterns }) {
  if (/header|side-nav|bottom-nav/i.test(element.kind)) return false;
  const role = element.componentRole ?? "";
  const hasChartPattern = occupiedPatterns.some((pattern) => pattern.kind === "chart-series");
  if (/navigation|metric-card|side-navigation|top-navigation|bottom-navigation/.test(role)) {
    return false;
  }
  const primitive = element.primitive ?? "";
  const widthRatio = element.box.width / Math.max(1, sourceWidth);
  const heightRatio = element.box.height / Math.max(1, sourceHeight);
  const areaRatio = (element.box.width * element.box.height) / Math.max(1, sourceWidth * sourceHeight);
  const inkRatio = element.signals?.inkRatio ?? 0;
  const edgeRatio = element.signals?.edgeRatio ?? 0;
  const signal = inkRatio + edgeRatio * 2;
  const emptyStateLike =
    /text|field-or-action|control|card|section/.test(primitive) ||
    /text-line|primary-action|icon-action|content-card|content-section|form-field|search-field|media-panel|empty-state/.test(
      role,
    );
  const centeredSurfaceLike =
    !hasChartPattern &&
    /chart-panel|media-panel|content-card|content-section/.test(role) &&
    inkRatio <= 0.55 &&
    areaRatio >= 0.08 &&
    areaRatio <= 0.38;

  if ((!emptyStateLike && !centeredSurfaceLike) || signal < 0.02) return false;
  if (widthRatio > 0.82 || heightRatio > 0.52 || areaRatio > 0.46) return false;

  return !occupiedPatterns.some(
    (pattern) => pattern.box && boxOverlapRatio(pattern.box, element.box) >= 0.62,
  );
}

function areRelatedEmptyStateParts(first, second, { sourceWidth, sourceHeight }) {
  const firstCenterX = first.box.x + first.box.width / 2;
  const secondCenterX = second.box.x + second.box.width / 2;
  const firstCenterY = first.box.y + first.box.height / 2;
  const secondCenterY = second.box.y + second.box.height / 2;
  const horizontalDelta = Math.abs(firstCenterX - secondCenterX);
  const verticalDelta = Math.abs(firstCenterY - secondCenterY);
  const overlap = horizontalOverlapRatio(first.box, second.box);

  return (
    horizontalDelta <= sourceWidth * 0.28 &&
    verticalDelta <= sourceHeight * 0.22 &&
    (overlap >= 0.28 || horizontalDelta <= sourceWidth * 0.16)
  );
}

function buildEmptyStatePattern(cluster, index, { sourceWidth, sourceHeight, occupiedPatterns }) {
  const sorted = cluster.slice().sort(readingOrderSort);
  const box = mergeBoxes(sorted.map((element) => element.box));
  const boxCenterX = box.x + box.width / 2;
  const boxCenterY = box.y + box.height / 2;
  const xOffset = Math.abs(boxCenterX - sourceWidth / 2) / Math.max(1, sourceWidth);
  const yOffset = Math.abs(boxCenterY - sourceHeight / 2) / Math.max(1, sourceHeight);
  const areaRatio = (box.width * box.height) / Math.max(1, sourceWidth * sourceHeight);
  const textCount = sorted.filter((element) =>
    /text-line|content-section/.test(element.componentRole ?? "") || element.primitive === "text",
  ).length;
  const actionCount = sorted.filter((element) =>
    /primary-action|icon-action|form-field|search-field/.test(element.componentRole ?? ""),
  ).length;
  const supportCount = sorted.filter((element) =>
    /content-card|content-section|media-panel|chart-panel|control/.test(element.componentRole ?? "") ||
    /card|control|media/.test(element.primitive ?? ""),
  ).length;
  const surfaceOnly = sorted.length === 1 && supportCount >= 1;
  const centeredness = clamp(1 - (xOffset + yOffset) / 0.42, 0, 1);
  const sparsity = clamp((0.46 - areaRatio) / 0.38, 0, 1);
  const hasRecoveryCue = actionCount >= 1 || supportCount >= 1;
  const conflicts = occupiedPatterns.some(
    (pattern) => pattern.box && boxOverlapRatio(pattern.box, box) >= 0.48,
  );

  if (!surfaceOnly && (sorted.length < 2 || textCount < 1 || !hasRecoveryCue || conflicts)) return null;
  if (surfaceOnly && (centeredness < 0.5 || conflicts)) return null;
  if (box.width > sourceWidth * 0.82 || box.height > sourceHeight * 0.5) return null;
  const normalizedTextCount = Math.max(textCount, surfaceOnly ? 1 : 0);
  const normalizedActionCount = Math.max(actionCount, surfaceOnly ? 1 : 0);

  const confidence = round(
    clamp(
      0.58 +
        centeredness * 0.18 +
        sparsity * 0.12 +
        Math.min(0.08, normalizedTextCount * 0.03) +
        Math.min(0.08, normalizedActionCount * 0.05 + supportCount * 0.025),
      0.58,
      0.94,
    ),
    2,
  );
  if (confidence < 0.64) return null;

  return {
    id: `empty-state-${index + 1}`,
    kind: "empty-state",
    axis: "centered",
    textCount: normalizedTextCount,
    actionCount: normalizedActionCount,
    supportCount,
    centeredness: round(centeredness, 2),
    confidence,
    box,
    children: sorted.map((element) => element.id),
  };
}

function boxContains(outer, inner, toleranceRatio, { sourceWidth, sourceHeight }) {
  const tolerance = Math.max(2, Math.min(sourceWidth, sourceHeight) * toleranceRatio);
  return (
    inner.x >= outer.x - tolerance &&
    inner.y >= outer.y - tolerance &&
    inner.x + inner.width <= outer.x + outer.width + tolerance &&
    inner.y + inner.height <= outer.y + outer.height + tolerance
  );
}

function boxOverlapRatio(first, second) {
  const left = Math.max(first.x, second.x);
  const top = Math.max(first.y, second.y);
  const right = Math.min(first.x + first.width, second.x + second.width);
  const bottom = Math.min(first.y + first.height, second.y + second.height);
  const width = Math.max(0, right - left);
  const height = Math.max(0, bottom - top);
  const overlap = width * height;
  const smaller = Math.min(first.width * first.height, second.width * second.height);
  return smaller ? overlap / smaller : 0;
}

function isRepeatedListCandidate(element, { sourceWidth, sourceHeight }) {
  if (/header|nav/i.test(element.kind)) return false;
  const aspect = element.box.width / Math.max(1, element.box.height);
  const widthRatio = element.box.width / Math.max(1, sourceWidth);
  const heightRatio = element.box.height / Math.max(1, sourceHeight);
  const signal = (element.signals?.inkRatio ?? 0) + (element.signals?.edgeRatio ?? 0) * 2;

  return (
    widthRatio >= 0.16 &&
    heightRatio <= 0.22 &&
    aspect >= 1.15 &&
    signal >= 0.06
  );
}

function areAlignedListItems(first, second, { sourceWidth }) {
  const xTolerance = Math.max(18, sourceWidth * 0.07);
  const widthDelta =
    Math.abs(first.box.width - second.box.width) /
    Math.max(1, Math.max(first.box.width, second.box.width));
  const heightDelta =
    Math.abs(first.box.height - second.box.height) /
    Math.max(1, Math.max(first.box.height, second.box.height));
  const overlap = horizontalOverlapRatio(first.box, second.box);

  return (
    Math.abs(first.box.x - second.box.x) <= xTolerance &&
    widthDelta <= 0.28 &&
    heightDelta <= 0.5 &&
    overlap >= 0.58
  );
}

function buildRepeatedListRun(cluster, index) {
  const sorted = cluster.slice().sort((first, second) => first.box.y - second.box.y);
  if (sorted.length < 3) return null;
  const gaps = [];
  for (let item = 1; item < sorted.length; item += 1) {
    gaps.push(sorted[item].box.y - sorted[item - 1].box.y);
  }
  const positiveGaps = gaps.filter((gap) => gap > 0);
  if (positiveGaps.length < 2) return null;
  const averageGap =
    positiveGaps.reduce((sum, gap) => sum + gap, 0) / Math.max(1, positiveGaps.length);
  const variance =
    positiveGaps.reduce((sum, gap) => sum + Math.abs(gap - averageGap), 0) /
    Math.max(1, positiveGaps.length);
  const rhythm = averageGap ? clamp(1 - variance / averageGap, 0, 1) : 0;
  if (rhythm < 0.36) return null;

  return {
    id: `repeated-list-${index + 1}`,
    kind: "repeated-list",
    axis: "vertical",
    rhythm: round(rhythm, 2),
    confidence: round(0.62 + rhythm * 0.25 + Math.min(0.1, sorted.length * 0.015), 2),
    box: mergeBoxes(sorted.map((element) => element.box)),
    children: sorted.map((element) => element.id),
  };
}

function horizontalOverlapRatio(first, second) {
  const overlap =
    Math.min(first.x + first.width, second.x + second.width) - Math.max(first.x, second.x);
  return Math.max(0, overlap) / Math.max(1, Math.min(first.width, second.width));
}

function detectAppShellPatterns(elements, { sourceWidth, sourceHeight }) {
  const mobileLike = isMobileLikeSource({ sourceWidth, sourceHeight });
  const candidates = elements
    .filter((element) => isAppShellNavCandidate(element))
    .sort((first, second) => first.box.y - second.box.y || first.box.x - second.box.x);
  if (candidates.length < 2) return [];

  const topNavigation = pickStrongestNavigationLandmark(candidates, "top-navigation");
  const sideNavigation = pickStrongestNavigationLandmark(candidates, "side-navigation");
  const bottomNavigation = mobileLike
    ? pickStrongestNavigationLandmark(candidates, "bottom-navigation")
    : null;
  const landmarks = [topNavigation, sideNavigation, bottomNavigation].filter(Boolean);
  const hasDesktopShell = Boolean(topNavigation && sideNavigation);
  const hasMobileShell = Boolean(topNavigation && bottomNavigation);
  const hasRailShell = Boolean(sideNavigation && (topNavigation || bottomNavigation));

  if (!hasDesktopShell && !hasMobileShell && !hasRailShell) return [];

  const shellType =
    hasDesktopShell && sourceWidth >= sourceHeight
      ? "desktop-sidebar-shell"
      : hasMobileShell
        ? "mobile-tab-shell"
        : hasDesktopShell
          ? "tablet-sidebar-shell"
          : "navigation-shell";
  const navCoverage =
    landmarks.reduce((sum, element) => sum + element.box.width * element.box.height, 0) /
    Math.max(1, sourceWidth * sourceHeight);
  const confidence = round(
    clamp(
      0.6 +
        landmarks.length * 0.07 +
        (hasDesktopShell ? 0.1 : 0) +
        (hasMobileShell ? 0.08 : 0) +
        Math.min(0.06, navCoverage * 0.4),
      0.6,
      0.95,
    ),
    2,
  );

  return [
    {
      id: "app-shell-1",
      kind: "app-shell",
      axis: "landmarks",
      shellType,
      navCount: landmarks.length,
      confidence,
      box: mergeBoxes(landmarks.map((element) => element.box)),
      regions: {
        topNavigation: topNavigation?.id ?? null,
        sideNavigation: sideNavigation?.id ?? null,
        bottomNavigation: bottomNavigation?.id ?? null,
      },
      children: landmarks.map((element) => element.id),
    },
  ];
}

function isAppShellNavCandidate(element) {
  const role = element.componentRole ?? "";
  return (
    /^(top|side|bottom)-navigation$/.test(role) ||
    element.kind === "header" ||
    element.kind === "side-nav" ||
    element.kind === "bottom-nav"
  );
}

function pickStrongestNavigationLandmark(elements, role) {
  const kindByRole = {
    "top-navigation": "header",
    "side-navigation": "side-nav",
    "bottom-navigation": "bottom-nav",
  };
  return (
    elements
      .filter(
        (element) =>
          element.componentRole === role || element.kind === kindByRole[role],
      )
      .sort((first, second) => second.confidence - first.confidence)[0] ?? null
  );
}

function summarizeDetectedPatterns(elements, context) {
  const appShells = normalizePatternList(detectAppShellPatterns(elements, context), "app-shell");
  const repeatedLists = normalizePatternList(detectRepeatedListRuns(elements, context), "repeated-list");
  const repeatedGrids = normalizePatternList(
    detectRepeatedGridPatterns(elements, context),
    "repeated-grid",
  );
  const statRows = normalizePatternList(
    detectStatRowPatterns(elements, context, repeatedGrids),
    "stat-row",
  );
  const formGroups = normalizePatternList(detectFormGroups(elements, context), "form-group");
  const dataTables = normalizePatternList(detectDataTablePatterns(elements, context), "data-table");
  const charts = normalizePatternList(detectChartSeriesPatterns(elements, context), "chart-series");
  const tabSets = normalizePatternList(detectTabSetPatterns(elements, context), "tab-set");
  let dialogPanels = normalizePatternList(
    detectDialogPanelPatterns(elements, context),
    "dialog-panel",
  );
  const tabSetElementIds = new Set(tabSets.flatMap((pattern) => pattern.children ?? []));
  const actionClusters = detectActionClusterPatterns(
    elements.filter((element) => !tabSetElementIds.has(element.id)),
    context,
  );
  const emptyStates = normalizePatternList(
    detectEmptyStatePatterns(elements, context, {
      repeatedLists,
      repeatedGrids,
      formGroups,
      dataTables,
      charts,
      statRows,
      actionClusters,
      tabSets,
      dialogPanels,
    }),
    "empty-state",
  );
  if (emptyStates.length) {
    dialogPanels = dialogPanels.filter(
      (dialog) => !emptyStates.some((emptyState) => isDialogCoveredByEmptyState(dialog, emptyState)),
    );
  }
  const textLines = elements.filter(
    (element) =>
      element.primitive === "text" ||
      (element.signals?.textLineScore ?? 0) >= 0.62,
  ).length;

  return {
    textLines,
    appShells,
    repeatedLists,
    repeatedGrids,
    statRows,
    formGroups,
    dataTables,
    charts,
    actionClusters: normalizePatternList(actionClusters, "action-cluster"),
    tabSets,
    dialogPanels,
    emptyStates,
  };
}

function isDialogCoveredByEmptyState(dialog, emptyState) {
  const dialogChildren = new Set(dialog.children ?? []);
  const emptyChildren = new Set(emptyState.children ?? []);
  const sharedChildren = [...dialogChildren].filter((id) => emptyChildren.has(id)).length;
  const childOverlap =
    sharedChildren > 0 &&
    sharedChildren === Math.min(dialogChildren.size || 1, emptyChildren.size || 1);
  const boxOverlap =
    dialog.box && emptyState.box ? boxOverlapRatio(dialog.box, emptyState.box) >= 0.82 : false;

  return childOverlap && boxOverlap && (dialog.childCount ?? dialogChildren.size) <= 1;
}

function normalizePatternList(patterns, prefix) {
  return (patterns ?? [])
    .filter(Boolean)
    .slice()
    .sort(patternReadingOrderSort)
    .map((pattern, index) => ({
      ...pattern,
      id: `${prefix}-${index + 1}`,
      children: (pattern.children ?? []).slice(),
    }));
}

function patternReadingOrderSort(first, second) {
  const firstBox = first.box ?? { x: 0, y: 0, width: 0, height: 0 };
  const secondBox = second.box ?? { x: 0, y: 0, width: 0, height: 0 };
  if (firstBox.y !== secondBox.y) return firstBox.y - secondBox.y;
  if (firstBox.x !== secondBox.x) return firstBox.x - secondBox.x;
  return (second.confidence ?? 0) - (first.confidence ?? 0);
}

function readingOrderSort(first, second) {
  if (first.box.y !== second.box.y) return first.box.y - second.box.y;
  return first.box.x - second.box.x;
}

function buildLayoutTree(elements, { sourceWidth, sourceHeight, patterns, responsiveIntent, screenIntent }) {
  const groups = [];
  const structuralKinds = new Set(["header", "bottom-nav", "side-nav"]);
  const appShellIds = new Set(
    (patterns?.appShells ?? []).flatMap((pattern) => pattern.children ?? []),
  );
  const structural = elements.filter(
    (element) => structuralKinds.has(element.kind) && !appShellIds.has(element.id),
  );
  const repeatedIds = new Set(
    [
      ...(patterns?.repeatedLists ?? []),
      ...(patterns?.repeatedGrids ?? []),
      ...(patterns?.statRows ?? []),
      ...(patterns?.formGroups ?? []),
      ...(patterns?.dataTables ?? []),
      ...(patterns?.charts ?? []),
      ...(patterns?.actionClusters ?? []),
      ...(patterns?.tabSets ?? []),
      ...(patterns?.dialogPanels ?? []),
      ...(patterns?.emptyStates ?? []),
    ].flatMap((pattern) => pattern.children ?? []),
  );
  const content = elements.filter(
    (element) => !structuralKinds.has(element.kind) && !repeatedIds.has(element.id),
  );

  for (const pattern of patterns?.appShells ?? []) {
    groups.push({
      id: `${pattern.id}-group`,
      kind: pattern.kind,
      box: pattern.box,
      axis: pattern.axis,
      shellType: pattern.shellType,
      navCount: pattern.navCount,
      confidence: pattern.confidence,
      regions: pattern.regions,
      children: pattern.children,
    });
  }

  for (const element of structural) {
    groups.push({
      id: `${element.id}-group`,
      kind: element.kind,
      box: element.box,
      children: [element.id],
    });
  }

  for (const pattern of patterns?.repeatedLists ?? []) {
    groups.push({
      id: `${pattern.id}-group`,
      kind: pattern.kind,
      box: pattern.box,
      axis: pattern.axis,
      rhythm: pattern.rhythm,
      confidence: pattern.confidence,
      children: pattern.children,
    });
  }

  for (const pattern of patterns?.repeatedGrids ?? []) {
    groups.push({
      id: `${pattern.id}-group`,
      kind: pattern.kind,
      box: pattern.box,
      axis: pattern.axis,
      rows: pattern.rows,
      columns: pattern.columns,
      rhythm: pattern.rhythm,
      confidence: pattern.confidence,
      children: pattern.children,
    });
  }

  for (const pattern of patterns?.statRows ?? []) {
    groups.push({
      id: `${pattern.id}-group`,
      kind: pattern.kind,
      box: pattern.box,
      axis: pattern.axis,
      cardCount: pattern.cardCount,
      rhythm: pattern.rhythm,
      confidence: pattern.confidence,
      children: pattern.children,
    });
  }

  for (const pattern of patterns?.formGroups ?? []) {
    groups.push({
      id: `${pattern.id}-group`,
      kind: pattern.kind,
      box: pattern.box,
      axis: pattern.axis,
      fieldCount: pattern.fieldCount,
      actionCount: pattern.actionCount,
      rhythm: pattern.rhythm,
      confidence: pattern.confidence,
      children: pattern.children,
    });
  }

  for (const pattern of patterns?.dataTables ?? []) {
    groups.push({
      id: `${pattern.id}-group`,
      kind: pattern.kind,
      box: pattern.box,
      axis: pattern.axis,
      rows: pattern.rows,
      columns: pattern.columns,
      rhythm: pattern.rhythm,
      confidence: pattern.confidence,
      children: pattern.children,
    });
  }

  for (const pattern of patterns?.charts ?? []) {
    groups.push({
      id: `${pattern.id}-group`,
      kind: pattern.kind,
      box: pattern.box,
      axis: pattern.axis,
      chartKind: pattern.chartKind,
      seriesCount: pattern.seriesCount,
      rhythm: pattern.rhythm,
      confidence: pattern.confidence,
      children: pattern.children,
    });
  }

  for (const pattern of patterns?.actionClusters ?? []) {
    groups.push({
      id: `${pattern.id}-group`,
      kind: pattern.kind,
      box: pattern.box,
      axis: pattern.axis,
      clusterType: pattern.clusterType,
      controlCount: pattern.controlCount,
      rhythm: pattern.rhythm,
      confidence: pattern.confidence,
      children: pattern.children,
    });
  }

  for (const pattern of patterns?.tabSets ?? []) {
    groups.push({
      id: `${pattern.id}-group`,
      kind: pattern.kind,
      box: pattern.box,
      axis: pattern.axis,
      tabKind: pattern.tabKind,
      tabCount: pattern.tabCount,
      selectedIndex: pattern.selectedIndex,
      rhythm: pattern.rhythm,
      confidence: pattern.confidence,
      children: pattern.children,
    });
  }

  for (const pattern of patterns?.dialogPanels ?? []) {
    groups.push({
      id: `${pattern.id}-group`,
      kind: pattern.kind,
      box: pattern.box,
      axis: pattern.axis,
      modalType: pattern.modalType,
      childCount: pattern.childCount,
      centeredness: pattern.centeredness,
      confidence: pattern.confidence,
      children: pattern.children,
    });
  }

  for (const pattern of patterns?.emptyStates ?? []) {
    groups.push({
      id: `${pattern.id}-group`,
      kind: pattern.kind,
      box: pattern.box,
      axis: pattern.axis,
      textCount: pattern.textCount,
      actionCount: pattern.actionCount,
      centeredness: pattern.centeredness,
      confidence: pattern.confidence,
      children: pattern.children,
    });
  }

  const contentGroups = groupElementsByRows(content, { sourceHeight });
  groups.push(...contentGroups);

  return {
    strategy: "projection-groups",
    source: { width: sourceWidth, height: sourceHeight },
    patterns: {
      textLines: patterns?.textLines ?? 0,
      appShells: patterns?.appShells ?? [],
      repeatedLists: patterns?.repeatedLists ?? [],
      repeatedGrids: patterns?.repeatedGrids ?? [],
      statRows: patterns?.statRows ?? [],
      formGroups: patterns?.formGroups ?? [],
      dataTables: patterns?.dataTables ?? [],
      charts: patterns?.charts ?? [],
      actionClusters: patterns?.actionClusters ?? [],
      tabSets: patterns?.tabSets ?? [],
      dialogPanels: patterns?.dialogPanels ?? [],
      emptyStates: patterns?.emptyStates ?? [],
    },
    responsive: responsiveIntent ?? null,
    screenIntent: screenIntent ?? null,
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
  const maxBandRows = Math.max(1, Math.ceil(gridRows * 0.22));
  const rowOrder =
    edge === "top"
      ? Array.from({ length: gridRows }, (_, row) => row)
      : Array.from({ length: gridRows }, (_, row) => gridRows - 1 - row);

  for (const row of rowOrder) {
    if (rows.length >= maxBandRows) break;
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
  const maxRailColumns = Math.max(1, Math.ceil(gridColumns * 0.22));
  const columnOrder =
    edge === "left"
      ? Array.from({ length: gridColumns }, (_, column) => column)
      : Array.from({ length: gridColumns }, (_, column) => gridColumns - 1 - column);

  for (const column of columnOrder) {
    if (columns.length >= maxRailColumns) break;
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
