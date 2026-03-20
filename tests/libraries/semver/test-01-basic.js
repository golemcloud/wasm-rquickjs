import assert from 'assert';
import semver from 'semver';

export const run = () => {
  assert.strictEqual(semver.valid('1.2.3'), '1.2.3');
  assert.strictEqual(semver.valid('v1.2.3'), '1.2.3');
  assert.strictEqual(semver.clean(' =v2.3.4  '), '2.3.4');
  assert.strictEqual(semver.valid('not-a-version'), null);

  const parsed = semver.parse('3.4.5-beta.2+build.7');
  assert.ok(parsed);
  assert.strictEqual(parsed.major, 3);
  assert.strictEqual(parsed.minor, 4);
  assert.strictEqual(parsed.patch, 5);
  assert.deepStrictEqual(parsed.prerelease, ['beta', 2]);

  return 'PASS: basic parsing and normalization APIs work';
};
