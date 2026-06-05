import test from "node:test";
import assert from "node:assert/strict";

import {
  canUseGithubGist,
  createGithubGist,
  getGithubGistToken,
  sanitizeGistFilename,
} from "../src/lib/github-gist.mjs";

test("canUseGithubGist is false without token", () => {
  assert.equal(canUseGithubGist({}), false);
  assert.equal(canUseGithubGist({ GITHUB_TOKEN: "   " }), false);
});

test("canUseGithubGist is true with trimmed token", () => {
  assert.equal(canUseGithubGist({ GITHUB_TOKEN: "ghp_test" }), true);
  assert.equal(getGithubGistToken({ GITHUB_TOKEN: " ghp_test " }), "ghp_test");
});

test("sanitizeGistFilename normalizes unsafe names", () => {
  assert.equal(sanitizeGistFilename("generated-auth.tsx"), "generated-auth.tsx");
  assert.equal(sanitizeGistFilename("../evil/name.tsx"), "name.tsx");
  assert.equal(sanitizeGistFilename("nested/path/generated.tsx"), "generated.tsx");
  assert.equal(sanitizeGistFilename(""), "component.tsx");
});

test("createGithubGist posts scaffold file and returns gist URL", async () => {
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
