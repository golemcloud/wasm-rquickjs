import assert from 'assert';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { runCLI } from 'jest';

export const run = async () => {
  const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), 'jest-basic-'));

  try {
    fs.writeFileSync(
      path.join(rootDir, 'sum.test.js'),
      "test('adds values', () => { expect(1 + 2).toBe(3); });\n",
      'utf8'
    );

    const { results } = await runCLI(
      {
        runInBand: true,
        silent: true,
        ci: true,
        cache: false,
        config: JSON.stringify({
          rootDir,
          testMatch: ['**/*.test.js'],
          testEnvironment: 'node',
        }),
      },
      [rootDir]
    );

    assert.strictEqual(results.success, true, 'Jest run should succeed');
    assert.strictEqual(results.numPassedTests, 1, 'one test should pass');
    assert.strictEqual(results.numFailedTests, 0, 'no tests should fail');

    return 'PASS: runCLI executes a simple passing suite';
  } finally {
    fs.rmSync(rootDir, { recursive: true, force: true });
  }
};
