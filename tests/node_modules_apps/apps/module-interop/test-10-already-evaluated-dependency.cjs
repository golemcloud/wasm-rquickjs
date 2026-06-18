const assert = require('node:assert');

exports.run = () => {
  const result = require('esm-already-evaluated');
  assert.strictEqual(result.value, 'entry');
  assert.strictEqual(result.default.value, 'entry');
  return 'PASS: CJS bridge can require an already evaluated ESM dependency';
};
