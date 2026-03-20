import assert from "assert";
import redisModule from "redis";

const redis = redisModule.default ?? redisModule;

export const run = () => {
  const value = new redis.VerbatimString("txt", "hello");
  assert.strictEqual(String(value), "hello");
  assert.strictEqual(value.format, "txt");

  const simple = new redis.SimpleError("ERR sample");
  const blob = new redis.BlobError("BLOB sample");
  const closed = new redis.ClientClosedError();
  assert.ok(simple instanceof Error);
  assert.ok(blob instanceof Error);
  assert.ok(closed instanceof Error);
  assert.strictEqual(simple.message, "ERR sample");
  assert.strictEqual(blob.message, "BLOB sample");
  assert.strictEqual(closed.message, "The client is closed");

  const cache = new redis.BasicClientSideCache({
    ttl: 1000,
    maxEntries: 10,
    evictPolicy: "LRU",
  });
  const stats = cache.stats();
  assert.strictEqual(stats.requestCount(), 0);
  assert.strictEqual(stats.hitRate(), 1);
  assert.strictEqual(stats.missRate(), 0);

  return "PASS: redis value/error classes and cache stats are usable offline";
};
