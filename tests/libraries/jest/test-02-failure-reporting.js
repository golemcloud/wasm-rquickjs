import assert from 'assert';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { runCLI } from 'jest';

export const run = async () => {
  const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), 'jest-fail-'));

  try {
    fs.writeFileSync(
      path.join(rootDir, 'fail.test.js'),
      "test('intentional failure', () => { expect('a').toBe('b'); });\n",
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

    assert.strictEqual(results.success, false, 'Jest run should fail');
    assert.strictEqual(results.numFailedTests, 1, 'one test should fail');
    assert.strictEqual(results.numPassedTests, 0, 'no tests should pass');

    return 'PASS: runCLI reports failing suites and counters correctly';
  } finally {
    fs.rmSync(rootDir, { recursive: true, force: true });
  }
};
