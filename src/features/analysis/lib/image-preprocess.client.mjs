import { inspectCanvas } from "./offline-image-inspection.client.mjs";
import { inspectSvgDataUrl } from "./offline-svg-inspection.mjs";

const MAX_DIMENSION = 1600;
const JPEG_QUALITY = 0.82;
const TARGET_MAX_BYTES = 900_000;

/**
 * Resize and compress an image data URL before sending to Qwen.
 * Returns the original URL when running outside a browser or on failure.
 * @param {string} dataUrl
 * @param {{
 *   maxDimension?: number;
 *   quality?: number;
 *   targetMaxBytes?: number;
 * }} [options]
 * @returns {Promise<{
 *   dataUrl: string;
 *   width: number | null;
 *   height: number | null;
 *   compressed: boolean;
 *   offlineInspection?: ReturnType<typeof inspectCanvas> | null;
 *   svgInspection?: ReturnType<typeof inspectSvgDataUrl> | null;
 * }>}
 */
export async function preprocessImageDataUrl(
  dataUrl,
  {
    maxDimension = MAX_DIMENSION,
    quality = JPEG_QUALITY,
    targetMaxBytes = TARGET_MAX_BYTES,
  } = {},
) {
  const svgInspection = inspectSvgDataUrl(dataUrl);

  if (typeof document === "undefined" || !dataUrl.startsWith("data:image/")) {
    return {
      dataUrl,
      width: svgInspection?.source.width ?? null,
      height: svgInspection?.source.height ?? null,
      compressed: false,
      offlineInspection: null,
      svgInspection,
    };
  }

  try {
    const image = await loadImage(dataUrl);
    const { width, height } = fitDimensions(
      image.naturalWidth,
      image.naturalHeight,
      maxDimension,
    );

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return {
        dataUrl,
        width: image.naturalWidth,
        height: image.naturalHeight,
        compressed: false,
        offlineInspection: null,
        svgInspection,
      };
    }

    ctx.drawImage(image, 0, 0, width, height);
    const offlineInspection = safelyInspectCanvas(canvas);

    let nextQuality = quality;
    let output = canvas.toDataURL("image/jpeg", nextQuality);

    while (estimateDataUrlBytes(output) > targetMaxBytes && nextQuality > 0.45) {
      nextQuality -= 0.08;
      output = canvas.toDataURL("image/jpeg", nextQuality);
    }

    return {
      dataUrl: output,
      width,
      height,
      compressed: output !== dataUrl,
      offlineInspection: offlineInspection
        ? { ...offlineInspection, svgInspection }
        : null,
      svgInspection,
    };
  } catch {
    return {
      dataUrl,
      width: svgInspection?.source.width ?? null,
      height: svgInspection?.source.height ?? null,
      compressed: false,
      offlineInspection: null,
      svgInspection,
    };
  }
}

/**
 * @param {HTMLCanvasElement} canvas
 */
function safelyInspectCanvas(canvas) {
  try {
    return inspectCanvas(canvas);
  } catch {
    return null;
  }
}

/**
 * @param {string} dataUrl
 * @returns {Promise<HTMLImageElement>}
 */
function loadImage(dataUrl) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Could not decode image."));
    image.src = dataUrl;
  });
}

/**
 * @param {number} width
 * @param {number} height
 * @param {number} maxDimension
 */
function fitDimensions(width, height, maxDimension) {
  if (width <= maxDimension && height <= maxDimension) {
    return { width, height };
  }

  const scale = maxDimension / Math.max(width, height);
  return {
    width: Math.round(width * scale),
    height: Math.round(height * scale),
  };
}

/**
 * @param {string} dataUrl
 */
function estimateDataUrlBytes(dataUrl) {
  const base64 = dataUrl.split(",")[1] || "";
  return Math.ceil((base64.length * 3) / 4);
}
