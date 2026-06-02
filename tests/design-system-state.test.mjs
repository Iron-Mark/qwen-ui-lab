import test from "node:test";
import assert from "node:assert/strict";
import {
  createDesignSystemSearchParams,
  nextFromList,
  parseDomain,
  parseLevel,
  parsePreviewMode,
  pickSelectedId,
} from "../src/lib/design-system-state.mjs";

test("parse helpers normalize unknown values", () => {
  assert.equal(parseDomain("invalid"), "all");
  assert.equal(parseLevel("invalid"), "all");
  assert.equal(parsePreviewMode("invalid"), "desktop");
});

test("pickSelectedId falls back to first available", () => {
  const ids = ["alpha", "beta"];
  assert.equal(pickSelectedId("beta", ids), "beta");
  assert.equal(pickSelectedId("missing", ids), "alpha");
  assert.equal(pickSelectedId(null, ids), "alpha");
});

test("createDesignSystemSearchParams omits defaults", () => {
  const params = createDesignSystemSearchParams({
    domain: "all",
    level: "all",
    query: "",
    selected: null,
    previewMode: "desktop",
  });
  assert.equal(params.toString(), "");
});

test("createDesignSystemSearchParams persists non-default controls", () => {
  const params = createDesignSystemSearchParams({
    domain: "uilaws",
    level: "organism",
    query: "hero",
    selected: "hero-banner",
    previewMode: "tablet",
  });
  assert.equal(
    params.toString(),
    "domain=uilaws&level=organism&q=hero&selected=hero-banner&preview=tablet",
  );
});

test("nextFromList cycles bidirectionally", () => {
  const values = ["a", "b", "c"];
  assert.equal(nextFromList(values, "a", 1), "b");
  assert.equal(nextFromList(values, "a", -1), "c");
});
