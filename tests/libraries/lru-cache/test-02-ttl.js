import assert from "assert";
import { LRUCache } from "lru-cache";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const run = async () => {
  const cache = new LRUCache({
    max: 5,
    ttl: 40,
    ttlResolution: 0,
  });

  cache.set("k", "value");
  assert.strictEqual(cache.get("k"), "value");

  await sleep(80);

  assert.strictEqual(cache.get("k"), undefined);
  assert.strictEqual(cache.has("k"), false);

  return "PASS: ttl expiration removes stale entries on access";
};
