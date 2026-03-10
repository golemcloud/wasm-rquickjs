import assert from 'assert';
import semver from 'semver';

export const run = () => {
  assert.strictEqual(semver.satisfies('1.2.3', '^1.0.0'), true);
  assert.strictEqual(semver.satisfies('2.0.0', '^1.0.0'), false);
  assert.strictEqual(semver.satisfies('1.2.4', '~1.2.3'), true);
  assert.strictEqual(semver.satisfies('1.3.0', '~1.2.3'), false);
  assert.strictEqual(semver.satisfies('1.2.5', '1.2.3 - 1.2.6'), true);
  assert.strictEqual(semver.satisfies('3.1.0', '1.x || >=3.0.0'), true);

  const validRange = semver.validRange('^2.1.0 || ~3.0.2');
  assert.ok(typeof validRange === 'string' && validRange.length > 0);

  return 'PASS: range parsing and satisfiability APIs work';
};
