import test from "node:test";
import assert from "node:assert/strict";

import {
  buildGithubGistUnavailablePayload,
  canUseGithubGist,
  createGithubGist,
  getGithubGistToken,
} from "../src/features/export/lib/github-gist.mjs";
import { sanitizeScaffoldFilename } from "../src/features/export/lib/scaffold-filename.mjs";

test("canUseGithubGist is false without token", () => {
  assert.equal(canUseGithubGist({}), false);
  assert.equal(canUseGithubGist({ GITHUB_TOKEN: "   " }), false);
});

test("canUseGithubGist is true with trimmed token", () => {
  assert.equal(canUseGithubGist({ GITHUB_TOKEN: "ghp_test" }), true);
  assert.equal(getGithubGistToken({ GITHUB_TOKEN: " ghp_test " }), "ghp_test");
});

test("buildGithubGistUnavailablePayload returns product-facing setup instructions", () => {
  assert.deepEqual(buildGithubGistUnavailablePayload(), {
    ok: false,
    code: "gist_unavailable",
    message:
      "GitHub Gist export needs setup before it can create links automatically.",
    fallback: {
      gistUrl: "https://gist.github.com",
      instructions:
        "Open gist.github.com, paste the copied component into a new secret gist, and save.",
    },
  });
});

test("sanitizeScaffoldFilename normalizes unsafe names", () => {
  assert.equal(sanitizeScaffoldFilename("generated-auth.tsx"), "generated-auth.tsx");
  assert.equal(sanitizeScaffoldFilename("../evil/name.tsx"), "name.tsx");
  assert.equal(sanitizeScaffoldFilename("nested/path/generated.tsx"), "generated.tsx");
  assert.equal(sanitizeScaffoldFilename(""), "component.tsx");
});

test("createGithubGist posts component file and returns gist URL", async () => {
  let captured = null;
  const fetchImpl = async (url, init) => {
    captured = { url, init };
    return new Response(
      JSON.stringify({ id: "abc123", html_url: "https://gist.github.com/user/abc123" }),
      { status: 201, headers: { "Content-Type": "application/json" } },
    );
  };

  const result = await createGithubGist({
    token: "ghp_test",
    filename: "generated-dashboard.tsx",
    content: "export function Demo() { return null; }",
    fetchImpl,
  });

  assert.equal(result.ok, true);
  assert.equal(result.url, "https://gist.github.com/user/abc123");
  assert.equal(captured.url, "https://api.github.com/gists");
  assert.equal(captured.init.method, "POST");

  const body = JSON.parse(captured.init.body);
  assert.equal(body.public, false);
  assert.equal(body.description, "Screenshot UI starter package");
  assert.equal(
    body.files["generated-dashboard.tsx"].content,
    "export function Demo() { return null; }",
  );
});

test("createGithubGist surfaces GitHub API errors", async () => {
  const fetchImpl = async () =>
    new Response(JSON.stringify({ message: "Bad credentials" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });

  const result = await createGithubGist({
    token: "invalid",
    filename: "component.tsx",
    content: "const x = 1",
    fetchImpl,
  });

  assert.equal(result.ok, false);
  assert.equal(result.status, 401);
  assert.match(result.message, /Bad credentials/);
});
