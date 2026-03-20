import assert from 'assert';
import semver from 'semver';

export const run = () => {
  assert.strictEqual(semver.compare('1.2.3', '1.2.4'), -1);
  assert.strictEqual(semver.rcompare('1.2.3', '1.2.4'), 1);
  assert.strictEqual(semver.gt('2.0.0', '1.9.9'), true);
  assert.strictEqual(semver.lte('1.2.3', '1.2.3'), true);

  assert.strictEqual(semver.inc('1.2.3', 'major'), '2.0.0');
  assert.strictEqual(semver.inc('1.2.3', 'minor'), '1.3.0');
  assert.strictEqual(semver.inc('1.2.3', 'patch'), '1.2.4');
  assert.strictEqual(semver.inc('1.2.3', 'prerelease', 'beta'), '1.2.4-beta.0');
  assert.strictEqual(semver.diff('1.2.3', '2.0.0'), 'major');

  return 'PASS: comparison and increment APIs work';
};
