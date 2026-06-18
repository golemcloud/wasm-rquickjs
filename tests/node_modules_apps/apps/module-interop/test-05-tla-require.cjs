const assert = require('node:assert');

exports.run = async () => {
  assert.throws(() => require('tla-esm'), { code: 'ERR_REQUIRE_ASYNC_MODULE' });
  const imported = await import('tla-esm');
  assert.strictEqual(imported.value, 'ready-after-tla');
  return 'PASS: installed TLA ESM rejects require() and still supports dynamic import';
};
