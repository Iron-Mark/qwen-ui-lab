import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  DEFAULT_SAMPLE_RUN,
  getSampleRunByFileName,
  inferReferenceMimeType,
} from "./reference-samples.data.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REFERENCES_DIR = resolve(__dirname, "../../../../public/references");

/**
 * File metadata for a guided layout (size read from disk when omitted).
 * @param {{ fileName?: string; size?: number }} [options]
 */
export function getSampleRunFileMetadata({ fileName, size } = {}) {
  const sample = fileName
    ? getSampleRunByFileName(fileName)
    : DEFAULT_SAMPLE_RUN;

  const resolvedSize =
    size ?? readFileSync(resolve(REFERENCES_DIR, sample.fileName)).length;

  return {
    name: sample.fileName,
    type: sample.mimeType ?? inferReferenceMimeType(sample.fileName),
    size: resolvedSize,
    width: sample.width,
    height: sample.height,
  };
}
