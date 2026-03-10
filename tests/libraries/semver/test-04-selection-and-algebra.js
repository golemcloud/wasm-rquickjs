import assert from 'assert';
import semver from 'semver';

export const run = () => {
  const versions = ['1.0.0', '1.5.0', '1.9.9', '2.0.0', '2.1.0'];

  assert.strictEqual(semver.maxSatisfying(versions, '^1.0.0'), '1.9.9');
  assert.strictEqual(semver.minSatisfying(versions, '^1.0.0'), '1.0.0');

  const minVersion = semver.minVersion('^1.2.3');
  assert.ok(minVersion);
  assert.strictEqual(minVersion.version, '1.2.3');

  assert.strictEqual(semver.intersects('^1.0.0', '1.5.0 - 2.0.0'), true);
  assert.strictEqual(semver.subset('^1.2.3', '>=1.0.0 <2.0.0'), true);

  return 'PASS: selection and range-algebra APIs work';
};
