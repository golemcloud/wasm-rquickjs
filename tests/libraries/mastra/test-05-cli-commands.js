import assert from 'assert';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';

export const run = () => {
  const require = createRequire(import.meta.url);
  const cliPath = require.resolve('mastra/dist/index.js');

  const versionRun = spawnSync(process.execPath, [cliPath, '--version'], { encoding: 'utf8' });
  assert.strictEqual(versionRun.status, 0, versionRun.stderr || versionRun.stdout);
  assert.ok(/\d+\.\d+\.\d+/.test(versionRun.stdout.trim()));

  const helpRun = spawnSync(process.execPath, [cliPath, '--help'], { encoding: 'utf8' });
  assert.strictEqual(helpRun.status, 0, helpRun.stderr || helpRun.stdout);
  assert.ok(helpRun.stdout.includes('Usage: mastra'));
  assert.ok(helpRun.stdout.includes('create'));
  assert.ok(helpRun.stdout.includes('dev'));

  return 'PASS: mastra CLI exposes help and version commands';
};
