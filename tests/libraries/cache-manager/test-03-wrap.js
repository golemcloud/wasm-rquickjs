import assert from 'assert';
import { createCache } from 'cache-manager';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const run = async () => {
  const cache = createCache();
  let callCount = 0;

  const loader = async () => {
    callCount += 1;
    await sleep(20);
    return `value-${callCount}`;
  };

  const firstBatch = await Promise.all([
    cache.wrap('shared-key', loader, 5_000),
    cache.wrap('shared-key', loader, 5_000),
    cache.wrap('shared-key', loader, 5_000),
    cache.wrap('shared-key', loader, 5_000),
    cache.wrap('shared-key', loader, 5_000),
  ]);

  assert.deepStrictEqual(firstBatch, ['value-1', 'value-1', 'value-1', 'value-1', 'value-1']);
  assert.strictEqual(callCount, 1);

  const secondValue = await cache.wrap('shared-key', loader, 5_000);
  assert.strictEqual(secondValue, 'value-1');
  assert.strictEqual(callCount, 1);

  return 'PASS: wrap coalesces concurrent calls and caches results';
};
