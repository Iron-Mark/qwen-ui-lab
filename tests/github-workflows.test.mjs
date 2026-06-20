import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const workflowDir = path.join(rootDir, '.github', 'workflows');

const workflowFiles = fs
  .readdirSync(workflowDir)
  .filter((file) => file.endsWith('.yml') || file.endsWith('.yaml'))
  .sort();

describe('GitHub workflow hygiene', () => {
  it('keeps JavaScript actions on Node 24-compatible majors', () => {
    const deprecatedPins = [
      'actions/checkout@v4',
      'actions/setup-node@v4',
      'actions/upload-artifact@v4',
      'gitleaks/gitleaks-action@v2',
    ];
    const offenders = [];

    for (const file of workflowFiles) {
      const source = fs.readFileSync(path.join(workflowDir, file), 'utf8');

      for (const pin of deprecatedPins) {
        if (source.includes(pin)) {
          offenders.push(`${file}: ${pin}`);
        }
      }
    }

    assert.deepEqual(offenders, []);
  });

  it('runs Node jobs against the active CI runtime', () => {
    const offenders = [];

    for (const file of workflowFiles) {
      const source = fs.readFileSync(path.join(workflowDir, file), 'utf8');
      if (/node-version:\s*['"]?20['"]?/u.test(source)) {
        offenders.push(file);
      }
    }

    assert.deepEqual(offenders, []);
  });
});
