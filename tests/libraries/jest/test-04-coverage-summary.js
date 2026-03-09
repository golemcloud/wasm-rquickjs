import assert from 'assert';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { runCLI } from 'jest';

export const run = async () => {
  const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), 'jest-coverage-'));

  try {
    fs.writeFileSync(
      path.join(rootDir, 'math.js'),
      'module.exports = { add: (a, b) => a + b };\n',
      'utf8'
    );

    fs.writeFileSync(
      path.join(rootDir, 'math.test.js'),
      "const { add } = require('./math.js');\n" +
        "test('coverage', () => { expect(add(10, 5)).toBe(15); });\n",
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
        coverage: true,
      },
      [rootDir]
    );

    assert.strictEqual(results.success, true, 'coverage run should succeed');
    assert.ok(results.coverageMap, 'coverage map should be present');
    assert.strictEqual(results.numPassedTests, 1, 'coverage suite should pass');

    return 'PASS: runCLI can produce coverage data for a passing suite';
  } finally {
    fs.rmSync(rootDir, { recursive: true, force: true });
  }
};
