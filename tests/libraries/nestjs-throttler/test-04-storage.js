import assert from 'assert';
import { ThrottlerStorageService } from '@nestjs/throttler';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const run = async () => {
  const storage = new ThrottlerStorageService();
  const key = 'storage-key';
  const throttlerName = 'default';

  const first = await storage.increment(key, 120, 2, 200, throttlerName);
  assert.strictEqual(first.totalHits, 1);
  assert.strictEqual(first.isBlocked, false);

  const second = await storage.increment(key, 120, 2, 200, throttlerName);
  assert.strictEqual(second.totalHits, 2);
  assert.strictEqual(second.isBlocked, false);

  const third = await storage.increment(key, 120, 2, 200, throttlerName);
  assert.strictEqual(third.totalHits, 3);
  assert.strictEqual(third.isBlocked, true);

  await sleep(240);

  const afterBlockWindow = await storage.increment(key, 120, 2, 200, throttlerName);
  assert.strictEqual(afterBlockWindow.isBlocked, false);

  await storage.onApplicationShutdown();

  return 'PASS: ThrottlerStorageService enforces and clears block windows';
};
