import assert from "node:assert/strict";
import test from "node:test";
import {
  handleGistExportGet,
  handleGistExportPost,
} from "../src/features/export/lib/export-gist-api.mjs";
import {
  handleRepoExportGet,
  handleRepoExportPost,
} from "../src/features/export/lib/export-repo-api.mjs";

async function withGithubEnv(value, callback) {
  const previous = process.env.GITHUB_TOKEN;
  if (value === undefined) {
    delete process.env.GITHUB_TOKEN;
  } else {
    process.env.GITHUB_TOKEN = value;
  }

  try {
    return await callback();
  } finally {
    if (previous === undefined) {
      delete process.env.GITHUB_TOKEN;
    } else {
      process.env.GITHUB_TOKEN = previous;
    }
  }
}

function jsonRequest(body) {
  return new Request("https://example.test/api/export", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

test("gist export API reports unavailable when token is missing", async () => {
  await withGithubEnv(undefined, async () => {
    const availability = await handleGistExportGet();
    assert.deepEqual(await availability.json(), {
      ok: true,
      available: false,
    });

    const response = await handleGistExportPost(
      jsonRequest({ content: "export const Demo = () => null;" }),
    );
    assert.equal(response.status, 503);

    const payload = await response.json();
    assert.equal(payload.ok, false);
    assert.equal(payload.code, "gist_unavailable");
  });
});

test("repo export API falls back to zip when GitHub export is unavailable", async () => {
  await withGithubEnv(undefined, async () => {
    const availability = await handleRepoExportGet();
    assert.deepEqual(await availability.json(), {
      ok: true,
      available: false,
      mode: "zip",
    });

    const response = await handleRepoExportPost(
      jsonRequest({
        content: "export const Demo = () => null;",
        filename: "../generated-demo.tsx",
        description: "Demo export",
      }),
    );

    assert.equal(response.status, 200);
    assert.equal(response.headers.get("Content-Type"), "application/zip");
    assert.match(
      response.headers.get("Content-Disposition") ?? "",
      /qwen-ui-lab-export-package\.zip/,
    );
    assert.ok((await response.arrayBuffer()).byteLength > 0);
  });
});
