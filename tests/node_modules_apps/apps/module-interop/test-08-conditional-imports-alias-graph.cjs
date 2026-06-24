const assert = require('node:assert');

exports.run = () => {
  assert.throws(() => require('condition-entry-imports-cycle'), { code: 'ERR_REQUIRE_CYCLE_MODULE' });
  return 'PASS: require(esm) graph scanning follows package imports aliases with import conditions';
};
