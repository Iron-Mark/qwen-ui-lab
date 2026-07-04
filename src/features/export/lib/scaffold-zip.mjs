/**
 * Minimal ZIP writer (stored, no compression) for export package downloads.
 */

const ENCODER = new TextEncoder();

/** @param {Uint8Array} data */
function crc32(data) {
  let crc = 0xffffffff;
  for (let i = 0; i < data.length; i += 1) {
    crc ^= data[i];
    for (let j = 0; j < 8; j += 1) {
      const mask = -(crc & 1);
      crc = (crc >>> 1) ^ (0xedb88320 & mask);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

/**
 * @param {string} name
 */
function sanitizeZipEntryName(name) {
  const normalized = String(name || "starter-component.tsx")
    .trim()
    .replace(/\\/g, "/")
    .split("/")
    .filter((part) => part && part !== "." && part !== "..")
    .join("/");
  return normalized || "starter-component.tsx";
}

/**
 * @param {{ name: string; content: string }[]} files
 * @returns {Uint8Array}
 */
export function createStoredZip(files) {
  const entries = files.map((file) => {
    const name = sanitizeZipEntryName(file.name);
    const data = ENCODER.encode(file.content ?? "");
    return { name, data, crc: crc32(data) };
  });

  const chunks = [];
  const central = [];
  let offset = 0;

  for (const entry of entries) {
    const nameBytes = ENCODER.encode(entry.name);
    const local = new Uint8Array(30 + nameBytes.length + entry.data.length);
    const view = new DataView(local.buffer);
    view.setUint32(0, 0x04034b50, true);
    view.setUint16(8, 0, true);
    view.setUint32(14, entry.crc, true);
    view.setUint32(18, entry.data.length, true);
    view.setUint32(22, entry.data.length, true);
    view.setUint16(26, nameBytes.length, true);
    local.set(nameBytes, 30);
    local.set(entry.data, 30 + nameBytes.length);
    chunks.push(local);
    offset += local.length;

    const centralHeader = new Uint8Array(46 + nameBytes.length);
    const centralView = new DataView(centralHeader.buffer);
    centralView.setUint32(0, 0x02014b50, true);
    centralView.setUint16(10, 0, true);
    centralView.setUint32(16, entry.crc, true);
    centralView.setUint32(20, entry.data.length, true);
    centralView.setUint32(24, entry.data.length, true);
    centralView.setUint16(28, nameBytes.length, true);
    centralView.setUint32(42, offset - local.length, true);
    centralHeader.set(nameBytes, 46);
    central.push(centralHeader);
  }

  const centralSize = central.reduce((sum, part) => sum + part.length, 0);
  const end = new Uint8Array(22);
  const endView = new DataView(end.buffer);
  endView.setUint32(0, 0x06054b50, true);
  endView.setUint16(8, entries.length, true);
  endView.setUint16(10, entries.length, true);
  endView.setUint32(12, centralSize, true);
  endView.setUint32(16, offset, true);

  const total =
    chunks.reduce((sum, part) => sum + part.length, 0) + centralSize + end.length;
  const archive = new Uint8Array(total);
  let cursor = 0;
  for (const part of chunks) {
    archive.set(part, cursor);
    cursor += part.length;
  }
  for (const part of central) {
    archive.set(part, cursor);
    cursor += part.length;
  }
  archive.set(end, cursor);
  return archive;
}

export { SCAFFOLD_ZIP_FILENAME } from "./export-package-constants.mjs";
