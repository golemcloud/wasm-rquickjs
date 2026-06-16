const assert = require('node:assert');

exports.run = () => {
  assert.throws(() => require('esm-alias-create-require-cycle'), { code: 'ERR_REQUIRE_CYCLE_MODULE' });
  return 'PASS: require(esm) graph scanning handles createRequire alias cycles';
};
