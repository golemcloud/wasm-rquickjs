import assert from 'assert';
import { getVersion, run as jestRun } from 'jest';

export const run = () => {
  const version = getVersion();
  assert.match(version, /^\d+\.\d+\.\d+/, 'version should look like semver');
  assert.strictEqual(typeof jestRun, 'function', 'run export should be callable');
  return `PASS: jest exports version and CLI run helpers (${version})`;
};
