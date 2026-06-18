const assert = require('node:assert');

exports.run = () => {
  assert.throws(() => require('condition-entry-module-sync-cycle'), { code: 'ERR_REQUIRE_CYCLE_MODULE' });
  return 'PASS: require(esm) graph scanning honors module-sync before import in exports';
};
