import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

function readProjectFile(relativePath) {
  return readFileSync(resolve(__dirname, "..", relativePath), "utf8");
}

test("SnippetPreview uses tokenized card shell styling", () => {
  const source = readProjectFile("src/features/analysis/components/SnippetPreview.tsx");

  assert.match(source, /rounded-xl border border-border/);
  assert.match(source, /bg-muted\/40/);
});

test("CodeHighlight shell uses adaptive background and focus ring", () => {
  const source = readProjectFile("src/features/analysis/components/CodeHighlight.tsx");

  assert.match(source, /bg-card/);
  assert.match(source, /text-card-foreground/);
  assert.match(source, /focus-visible:ring-2 focus-visible:ring-ring/);
});

test("Prism token colors rely on syntax variables, not surface accent", () => {
  const source = readProjectFile("src/app/globals.css");

  assert.match(source, /--syntax-keyword:/);
  assert.match(source, /--syntax-string:/);
  assert.match(source, /--syntax-class:/);
  assert.match(source, /--syntax-number:/);
  assert.match(source, /--syntax-tag:/);
  assert.match(source, /--syntax-attr-name:/);
  assert.match(source, /--syntax-attr-value:/);
  assert.match(source, /--syntax-regex:/);
  assert.match(source, /--syntax-important:/);
  assert.match(source, /\.code-highlight \.token\.keyword[\s\S]*var\(--syntax-keyword\)/);
  assert.match(source, /\.code-highlight \.token\.class-name[\s\S]*var\(--syntax-class\)/);
  assert.match(source, /\.code-highlight \.token\.function[\s\S]*var\(--syntax-function\)/);
  assert.match(source, /\.code-highlight \.token\.number[\s\S]*var\(--syntax-number\)/);
  assert.match(source, /\.code-highlight \.token\.boolean[\s\S]*var\(--syntax-boolean\)/);
  assert.match(source, /\.code-highlight \.token\.tag[\s\S]*var\(--syntax-tag\)/);
  assert.match(source, /\.code-highlight \.token\.attr-name[\s\S]*var\(--syntax-attr-name\)/);
  assert.match(source, /\.code-highlight \.token\.attr-value[\s\S]*var\(--syntax-keyword\)/);
  assert.match(source, /\.code-highlight \.token\.regex[\s\S]*var\(--syntax-regex\)/);
  assert.doesNotMatch(
    source,
    /\.code-highlight \.token\.(?:atrule,\s*)?\.token\.attr-value,\s*\.code-highlight \.token\.keyword[\s\S]*var\(--accent\)/,
  );
});

test("Brand themes provide syntax overrides in light and dark modes", () => {
  const source = readProjectFile("src/app/globals.css");

  assert.match(source, /:root\[data-brand="purple"\][\s\S]*--syntax-keyword:/);
  assert.match(source, /:root\.dark\[data-brand="purple"\][\s\S]*--syntax-keyword:/);
  assert.match(source, /:root\[data-brand="blue"\][\s\S]*--syntax-string:/);
  assert.match(source, /:root\.dark\[data-brand="blue"\][\s\S]*--syntax-string:/);
  assert.match(source, /:root\[data-brand="sunset"\][\s\S]*--syntax-regex:/);
  assert.match(source, /:root\.dark\[data-brand="sunset"\][\s\S]*--syntax-regex:/);
});

test("Global theme tokens set native browser color scheme", () => {
  const source = readProjectFile("src/app/globals.css");

  assert.match(source, /:root\s*{[\s\S]*color-scheme:\s*light;/);
  assert.match(source, /\.dark\s*{[\s\S]*color-scheme:\s*dark;/);
});

test("CodeHighlight assigns Prism language classes in both states", () => {
  const source = readProjectFile("src/features/analysis/components/CodeHighlight.tsx");

  assert.match(source, /const languageClass = `language-\$\{language\.toLowerCase\(\)\}`;/);
  assert.match(source, /className=\{cn\(languageClass, "block whitespace-pre-wrap break-words"\)\}/);
});
