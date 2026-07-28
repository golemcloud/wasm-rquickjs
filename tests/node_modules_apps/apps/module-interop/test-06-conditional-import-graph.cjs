const assert = require('node:assert');

exports.run = () => {
  assert.throws(() => require('condition-entry-import-cycle'), { code: 'ERR_REQUIRE_CYCLE_MODULE' });
  return 'PASS: require(esm) graph scanning follows package import conditions for static ESM imports';
};
