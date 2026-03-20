import assert from 'assert';
import { createCache } from 'cache-manager';

export const run = async () => {
  const cache = createCache();

  const setResult = await cache.set('greeting', 'hello');
  assert.strictEqual(setResult, 'hello');

  const value = await cache.get('greeting');
  assert.strictEqual(value, 'hello');

  const deleted = await cache.del('greeting');
  assert.strictEqual(deleted, true);

  const missing = await cache.get('greeting');
  assert.strictEqual(missing, undefined);

  return 'PASS: set/get/del basic flow works';
};
