import assert from "node:assert/strict";
import test from "node:test";

import { redactSensitiveText } from "../src/lib/privacy-redaction.mjs";

test("redactSensitiveText removes share payloads, local paths, and common secrets", () => {
  const redacted = redactSensitiveText(
    "C:\\Users\\mark\\shot.png /Users/mark/private.png /home/mark/private.png #share=abc123 DASHSCOPE_API_KEY=sk-secret token=ghp_secret api_key:abc password=hunter2",
  );

  assert.doesNotMatch(redacted, /C:\\Users|\/Users\/mark|\/home\/mark/);
  assert.doesNotMatch(redacted, /abc123|sk-secret|ghp_secret|hunter2/);
  assert.match(redacted, /\[local path\]/);
  assert.match(redacted, /#share=<redacted>/);
  assert.match(redacted, /DASHSCOPE_API_KEY=<redacted>/);
  assert.match(redacted, /token=<redacted>/);
  assert.match(redacted, /api_key=<redacted>/);
  assert.match(redacted, /password=<redacted>/);
});

test("redactSensitiveText supports custom local path replacement", () => {
  const redacted = redactSensitiveText("open /home/mark/private.png", {
    localPathReplacement: "<local-path>",
  });

  assert.equal(redacted, "open <local-path>");
});
