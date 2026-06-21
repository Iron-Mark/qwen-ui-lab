import { inspectImageDataPixels } from "./offline-image-inspection.mjs";

const DEFAULT_SAMPLE_DIMENSION = 144;

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
