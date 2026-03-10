import assert from 'assert';
import semver from 'semver';

export const run = () => {
  const coerced = semver.coerce('release-v42.6.7.9');
  assert.ok(coerced);
  assert.strictEqual(coerced.version, '42.6.7');

  const sorted = semver.sort(['2.0.0', '1.0.0', '1.5.0']);
  assert.deepStrictEqual(sorted, ['1.0.0', '1.5.0', '2.0.0']);

  const semverObj = new semver.SemVer('1.2.3-alpha.1+build.5');
  assert.strictEqual(semverObj.major, 1);
  assert.strictEqual(semverObj.minor, 2);
  assert.strictEqual(semverObj.patch, 3);
  assert.deepStrictEqual(semverObj.prerelease, ['alpha', 1]);

  assert.strictEqual(semver.prerelease('1.2.3-beta.4')[1], 4);

  return 'PASS: coerce, sorting, and SemVer class APIs work';
};
