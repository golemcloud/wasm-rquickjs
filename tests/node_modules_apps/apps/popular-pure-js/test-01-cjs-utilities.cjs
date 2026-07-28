const assert = require('node:assert');
const lodash = require('lodash');
const semver = require('semver');
const createDebug = require('debug');
const ms = require('ms');

exports.run = () => {
  const input = [{ group: 'a', value: 1 }, { group: 'a', value: 2 }, { group: 'b', value: 3 }];
  assert.deepStrictEqual(lodash.mapValues(lodash.groupBy(input, 'group'), (items) => lodash.sumBy(items, 'value')), { a: 3, b: 3 });
  assert.strictEqual(semver.satisfies('2.3.4', '^2.0.0'), true);
  assert.strictEqual(semver.inc('1.2.3', 'minor'), '1.3.0');
  assert.strictEqual(ms('2 hours'), 7200000);
  assert.strictEqual(ms(1500), '2s');
  const debug = createDebug('installed-app:test');
  assert.strictEqual(typeof debug, 'function');
  debug('debug output is disabled by default');
  return 'PASS: classic CJS utility packages load and execute from node_modules';
};
