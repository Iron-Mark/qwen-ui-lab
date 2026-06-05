import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  DEFAULT_REFERENCE_SAMPLE,
  getReferenceSampleByFileName,
} from "./reference-samples.data.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REFERENCES_DIR = resolve(__dirname, "../../public/references");

/**
 * File metadata for a bundled reference (size read from disk when omitted).
 * @param {{ fileName?: string; size?: number }} [options]
 */
export function getBundledReferenceFile({ fileName, size } = {}) {
  const sample = fileName
    ? getReferenceSampleByFileName(fileName)
    : DEFAULT_REFERENCE_SAMPLE;

  const resolvedSize =
    size ?? readFileSync(resolve(REFERENCES_DIR, sample.fileName)).length;

  return {
    name: sample.fileName,
    type: "image/svg+xml",
    size: resolvedSize,
    width: sample.width,
    height: sample.height,
  };
}
