import assert from 'assert';
import { Utils } from '@mikro-orm/core';

export const run = () => {
  const merged = Utils.merge({}, { feature: { enabled: true } }, { feature: { retries: 3 } });
  assert.deepStrictEqual(merged, { feature: { enabled: true, retries: 3 } });

  assert.deepStrictEqual(Utils.asArray('orm'), ['orm']);
  assert.strictEqual(Utils.equals({ a: 1, b: [2, 3] }, { a: 1, b: [2, 3] }), true);
  assert.strictEqual(Utils.equals({ a: 1 }, { a: 2 }), false);

  const hash = Utils.hash('mikro-orm-core');
  assert.strictEqual(typeof hash, 'string');
  assert.strictEqual(hash.length, 64);

  return 'PASS: Utils merge/asArray/equals/hash behave as expected';
};
