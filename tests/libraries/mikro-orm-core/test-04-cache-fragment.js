import assert from 'assert';
import { MemoryCacheAdapter, RawQueryFragment, raw } from '@mikro-orm/core';

export const run = () => {
  const cache = new MemoryCacheAdapter({ expiration: 1000 });
  cache.set('entry', { valid: true }, 'unit-test');
  assert.deepStrictEqual(cache.get('entry'), { valid: true });

  cache.remove('entry');
  assert.strictEqual(cache.get('entry'), undefined);

  const fragment = raw('lower(title)');
  assert.strictEqual(fragment instanceof RawQueryFragment, true);
  assert.strictEqual(fragment.sql, 'lower(title)');

  return 'PASS: MemoryCacheAdapter and raw query fragments work';
};
