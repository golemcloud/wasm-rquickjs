const assert = require('node:assert');

exports.run = () => {
  const result = require('condition-entry-no-cycle');
  assert.strictEqual(result.ok, true);
  assert.strictEqual(result.default.ok, true);
  return 'PASS: require(esm) graph scanning does not mark package module-sync branches for static ESM imports';
};
