const assert = require('node:assert');

exports.run = () => {
  const esm = require('esm-sync');
  const esmDefault = typeof esm === 'function' ? esm : esm.default;
  assert.strictEqual(typeof esmDefault, 'function');
  assert.strictEqual(esmDefault(), 'default-call');
  assert.strictEqual(esm.answer, 42);
  assert.strictEqual(esm.named, 'named');
  return 'PASS: CJS requires an installed synchronous ESM package';
};
