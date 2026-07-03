import test from "node:test";
import assert from "node:assert/strict";

import {
  buildShareableSummary,
  buildShortSharePath,
  buildShortShareUrl,
  encodeShareHash,
  decodeShareHash,
  buildShareUrl,
  normalizeShareModeLabel,
} from "../src/features/share/lib/share-result.mjs";
import {
  createShareRecord,
  generateShareId,
  getShareStorageMode,
  getShareRecord,
  isShareKvConfigured,
  resetShareStore,
  sanitizeSharePayload,
} from "../src/features/share/lib/share-store.mjs";
import { handleShareGet, handleSharePost } from "../src/features/share/lib/share-api.mjs";

const sampleArtifact = {
  summary: "Admin dashboard with stat grid and activity rail.",
  modeLabel: "Ready to analyze",
  file: { name: "dashboard-reference.svg" },
  previewStats: [
    { label: "Components", value: "6" },
    { label: "Sections", value: "4" },
  ],
  detections: {
    source: { width: 1440, height: 900 },
    designTokens: {
      surface: "#ffffff",
      foreground: "#111827",
      accent: "#2563eb",
      accentForeground: "#ffffff",
      muted: "#f3f4f6",
      border: "#d1d5db",
      unsafe: "not-exported",
    },
    quality: {
      confidence: 0.73,
      ambiguity: "low",
      strategy: "fine-grid-connected-components",
      elementCount: 2,
    },
    elements: [
      {
        id: "element-1",
        kind: "header",
        primitive: "header",
        confidence: 0.9,
        included: true,
        userEdited: false,
        box: { x: 0, y: 0, width: 1440, height: 112 },
        reasons: [{ evidence: "Should not appear" }],
      },
      {
        id: "element-2",
        kind: "button-or-input",
        primitive: "field-or-action",
        confidence: 0.7,
        included: false,
        userEdited: true,
        box: { x: 120, y: 225, width: 360, height: 90 },
      },
    ],
  },
  generatedCode: "export const Secret = 'must-not-leak';",
  plan: [{ title: "Hidden", body: "Should not appear in share payload" }],
};

test.afterEach(() => {
  resetShareStore();
});

test("buildShareableSummary omits code and secrets", () => {
  const payload = buildShareableSummary(sampleArtifact);

  assert.ok(payload);
  assert.equal(payload.summary, sampleArtifact.summary);
  assert.equal(payload.file, "dashboard-reference.svg");
  assert.equal(payload.mode, "Ready for review");
  assert.deepEqual(payload.stats, [
    { l: "Components", v: "6" },
    { l: "Sections", v: "4" },
  ]);
  assert.equal(payload.detections.elements.length, 2);
  assert.equal(payload.detections.elements[1].included, false);
  assert.equal(payload.detections.elements[1].userEdited, true);
  assert.equal(payload.detections.quality.confidence, 0.73);
  assert.equal(payload.detections.designTokens.unsafe, undefined);
  assert.equal("reasons" in payload.detections.elements[0], false);
  assert.equal("generatedCode" in payload, false);
  assert.equal("plan" in payload, false);
});

test("normalizeShareModeLabel keeps provider/internal wording out of shared summaries", () => {
  assert.equal(normalizeShareModeLabel("Qwen provider: qwen3-vl-plus"), "Analysis summary");
  assert.equal(normalizeShareModeLabel("Local demo mode"), "Analysis summary");
  assert.equal(normalizeShareModeLabel("Files Changes Bundle copy"), "Analysis summary");
  assert.equal(normalizeShareModeLabel("Export package"), "Analysis summary");
  assert.equal(normalizeShareModeLabel("Ready to analyze"), "Ready for review");
  assert.equal(normalizeShareModeLabel("Responsive dashboard"), "Responsive dashboard");
});

test("buildShareableSummary truncates long copy with portable ellipses", () => {
  const payload = buildShareableSummary({
    ...sampleArtifact,
    summary: "A".repeat(520),
    previewStats: [{ label: "Very long label ".repeat(5), value: "Very long value ".repeat(4) }],
  });

  assert.ok(payload);
  assert.equal(payload.summary.length, 480);
  assert.match(payload.summary, /\.\.\.$/);
  assert.doesNotMatch(JSON.stringify(payload), /â|�|…/);
  assert.equal(payload.stats[0].l.length, 40);
  assert.match(payload.stats[0].l, /\.\.\.$/);
  assert.equal(payload.stats[0].v.length, 24);
  assert.match(payload.stats[0].v, /\.\.\.$/);
});

test("buildShareableSummary redacts obvious secrets and local paths from text fields", () => {
  const payload = buildShareableSummary({
    ...sampleArtifact,
    summary:
      "Screenshot from C:\\Users\\Mark\\Desktop\\shot.png with DASHSCOPE_API_KEY=sk-secret and #share=abcdef",
    file: { name: "/Users/mark/private/shot.png" },
    previewStats: [
      { label: "token=ghp_secret", value: "api_key:abc123" },
      { label: "Safe", value: "4" },
    ],
  });

  assert.ok(payload);
  const serialized = JSON.stringify(payload);
  assert.doesNotMatch(serialized, /C:\\Users|\/Users\/mark|sk-secret|ghp_secret|abc123|#share=abcdef/);
  assert.match(payload.summary, /\[local path\]/);
  assert.match(payload.summary, /DASHSCOPE_API_KEY=<redacted>/);
  assert.match(payload.summary, /#share=<redacted>/);
  assert.equal(payload.file, "[local path]");
  assert.deepEqual(payload.stats[0], { l: "token=<redacted>", v: "api_key=<redacted>" });
});

test("share hash round-trips read-only summary", () => {
  const payload = buildShareableSummary(sampleArtifact);
  const hash = encodeShareHash(payload);
  const decoded = decodeShareHash(`#${hash}`);

  assert.deepEqual(decoded, payload);
});

test("buildShareUrl encodes hash on home path", () => {
  const payload = buildShareableSummary(sampleArtifact);
  const url = buildShareUrl("https://demo.example", "/", payload);

  assert.match(url, /^https:\/\/demo\.example\/#/);
  assert.equal(decodeShareHash(url.split("#")[1])?.summary, payload.summary);
});

test("buildShortShareUrl builds /share/[id] path", () => {
  assert.equal(
    buildShortShareUrl("https://demo.example", "Ab12Cd34"),
    "https://demo.example/share/Ab12Cd34",
  );
  assert.equal(buildShortSharePath("Ab12Cd34"), "/share/Ab12Cd34");
});

test("decodeShareHash rejects malformed payloads", () => {
  assert.equal(decodeShareHash("#share=not-base64"), null);
  assert.equal(decodeShareHash("#other=abc"), null);
  assert.equal(decodeShareHash(""), null);
});

test("decodeShareHash normalizes legacy provider mode labels", () => {
  const hash = encodeShareHash({
    v: 1,
    summary: "Shared dashboard summary.",
    stats: [],
    mode: "Qwen provider: qwen3-vl-plus",
    file: "dashboard.png",
  });

  assert.equal(decodeShareHash(hash)?.mode, "Analysis summary");
});

test("generateShareId returns alphanumeric ids", () => {
  const id = generateShareId(8);
  assert.match(id, /^[A-Za-z0-9]{8}$/);
});

test("sanitizeSharePayload rejects secret fields", () => {
  const payload = sanitizeSharePayload({
    summary: "Safe summary only",
    generatedCode: "leak",
    previewStats: [{ label: "Rows", value: "3" }],
    detections: sampleArtifact.detections,
  });

  assert.ok(payload);
  assert.equal(payload.summary, "Safe summary only");
  assert.equal(payload.detections.elements.length, 2);
  assert.equal(payload.detections.elements[1].primitive, "field-or-action");
  assert.equal("generatedCode" in payload, false);
});

test("createShareRecord and getShareRecord round-trip in memory", async () => {
  const payload = buildShareableSummary(sampleArtifact);
  assert.ok(payload);

  const created = await createShareRecord(payload);
  assert.ok(created?.id);

  const loaded = await getShareRecord(created.id);
  assert.deepEqual(loaded, payload);
  assert.equal(loaded.detections.elements[1].included, false);
});

test("getShareRecord rejects invalid ids", async () => {
  assert.equal(await getShareRecord(""), null);
  assert.equal(await getShareRecord("bad/id"), null);
  assert.equal(await getShareRecord("missing"), null);
});

test("isShareKvConfigured requires REST env vars", () => {
  assert.equal(isShareKvConfigured({}), false);
  assert.equal(getShareStorageMode({}), "memory");
  assert.equal(
    isShareKvConfigured({
      KV_REST_API_URL: "https://example.upstash.io",
      KV_REST_API_TOKEN: "token",
    }),
    true,
  );
  assert.equal(
    getShareStorageMode({
      KV_REST_API_URL: "https://example.upstash.io",
      KV_REST_API_TOKEN: "token",
    }),
    "kv",
  );
});

test("POST /api/share creates short link", async () => {
  const payload = buildShareableSummary(sampleArtifact);
  assert.ok(payload);

  const response = await handleSharePost(
    new Request("https://demo.example/api/share", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),
    { NEXT_PUBLIC_SITE_URL: "https://demo.example" },
  );

  assert.equal(response.status, 201);
  const body = await response.json();
  assert.equal(body.ok, true);
  assert.match(body.id, /^[A-Za-z0-9]{8}$/);
  assert.match(body.url, /^https:\/\/demo\.example\/share\//);
  assert.equal(body.storage, "memory");
  assert.equal(body.durable, false);
  assert.match(body.warning, /may expire sooner than a permanent share link/i);
});

test("POST /api/share redacts text before storing direct payloads", async () => {
  const response = await handleSharePost(
    new Request("https://demo.example/api/share", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        v: 1,
        summary: "Shared from C:\\Users\\Mark\\secret.png with token=ghp_secret",
        stats: [{ l: "password=letmein", v: "secret:abc123" }],
        mode: "Export package",
        file: "/home/mark/private/secret.png",
      }),
    }),
    { NEXT_PUBLIC_SITE_URL: "https://demo.example" },
  );

  assert.equal(response.status, 201);
  const body = await response.json();
  const stored = await getShareRecord(body.id);
  assert.ok(stored);
  const serialized = JSON.stringify(stored);

  assert.doesNotMatch(serialized, /C:\\Users|\/home\/mark|ghp_secret|letmein|abc123/);
  assert.equal(stored.mode, "Analysis summary");
  assert.match(stored.summary, /\[local path\]/);
  assert.equal(stored.file, "[local path]");
  assert.deepEqual(stored.stats[0], { l: "password=<redacted>", v: "secret=<redacted>" });
});

test("POST /api/share rejects empty payload", async () => {
  const response = await handleSharePost(
    new Request("https://demo.example/api/share", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ generatedCode: "nope" }),
    }),
  );

  assert.equal(response.status, 400);
});

test("GET /api/share returns stored summary", async () => {
  const payload = buildShareableSummary(sampleArtifact);
  assert.ok(payload);
  const created = await createShareRecord(payload);
  assert.ok(created);

  const response = await handleShareGet(
    new Request(`https://demo.example/api/share?id=${created.id}`),
  );

  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.ok, true);
  assert.equal(body.id, created.id);
  assert.deepEqual(body.summary, payload);
  assert.equal(body.summary.detections.elements.length, 2);
  assert.equal(body.storage, "memory");
  assert.equal(body.durable, false);
});

test("GET /api/share returns 404 for missing id", async () => {
  const response = await handleShareGet(
    new Request("https://demo.example/api/share?id=ZZZZZZZZ"),
  );

  assert.equal(response.status, 404);
});
