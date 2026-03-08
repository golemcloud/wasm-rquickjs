import assert from 'assert';
import { createCache } from 'cache-manager';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const run = async () => {
  const cache = createCache();

  await cache.set('ephemeral', { ok: true }, 250);

  const beforeExpiry = await cache.get('ephemeral');
  assert.deepStrictEqual(beforeExpiry, { ok: true });

  const expiresAt = await cache.ttl('ephemeral');
  assert.strictEqual(typeof expiresAt, 'number');
  assert.ok(expiresAt > Date.now());

  await sleep(450);

  const afterExpiry = await cache.get('ephemeral');
  assert.strictEqual(afterExpiry, undefined);

  const ttlAfterExpiry = await cache.ttl('ephemeral');
  assert.strictEqual(ttlAfterExpiry, undefined);

  return 'PASS: ttl and expiration behavior work';
};
