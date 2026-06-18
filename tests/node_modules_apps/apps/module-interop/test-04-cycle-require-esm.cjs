const assert = require('node:assert');

exports.run = () => {
  const cycle = require('cycle-require-esm');
  assert.strictEqual(cycle.outcome, 'ERR_REQUIRE_CYCLE_MODULE');
  return 'PASS: installed package CJS require(esm) cycle reports ERR_REQUIRE_CYCLE_MODULE';
};
