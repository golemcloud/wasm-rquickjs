import assert from 'assert';
import { Keyv } from 'keyv';
import { createCache } from 'cache-manager';

export const run = async () => {
  const primary = new Keyv();
  const secondary = new Keyv();
  primary.serialize = undefined;
  primary.deserialize = undefined;
  secondary.serialize = undefined;
  secondary.deserialize = undefined;

  const cache = createCache({ stores: [primary, secondary] });

  await cache.mset([
    { key: 'a', value: 1 },
    { key: 'b', value: 2 },
    { key: 'c', value: 3 },
  ]);

  const values = await cache.mget(['a', 'b', 'c', 'd']);
  assert.deepStrictEqual(values, [1, 2, 3, undefined]);

  await primary.delete('a');
  const fallback = await cache.get('a');
  assert.strictEqual(fallback, 1);

  await cache.mdel(['b', 'c']);
  const removed = await cache.mget(['b', 'c']);
  assert.deepStrictEqual(removed, [undefined, undefined]);

  await cache.set('z', 'last');
  await cache.clear();
  const afterClear = await cache.get('z');
  assert.strictEqual(afterClear, undefined);

  return 'PASS: multi-store + mset/mget/mdel/clear behaviors work';
};
