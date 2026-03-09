import assert from 'assert';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { runCLI } from 'jest';

export const run = async () => {
  const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), 'jest-pattern-'));

  try {
    fs.writeFileSync(
      path.join(rootDir, 'pattern.test.js'),
      [
        "test('kept case', () => { expect(2 * 3).toBe(6); });",
        "test('ignored case', () => { expect(2 * 3).toBe(7); });",
        '',
      ].join('\n'),
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
        testNamePattern: 'kept case',
      },
      [rootDir]
    );

    assert.strictEqual(results.success, true, 'pattern-filtered run should succeed');
    assert.strictEqual(results.numPassedTests, 1, 'one test should run and pass');
    assert.strictEqual(results.numFailedTests, 0, 'filtered-out failing test should not run');

    return 'PASS: testNamePattern filters tests before execution';
  } finally {
    fs.rmSync(rootDir, { recursive: true, force: true });
  }
};
