import assert from "assert";
import Redis from "ioredis";

export const run = () => {
  const redis = new Redis("redis://:secret@127.0.0.1:6380/5", {
    lazyConnect: true,
    keyPrefix: "app:",
  });

  assert.strictEqual(redis.options.host, "127.0.0.1");
  assert.strictEqual(redis.options.port, 6380);
  assert.strictEqual(redis.options.db, 5);
  assert.strictEqual(redis.options.password, "secret");
  assert.strictEqual(redis.options.keyPrefix, "app:");
  assert.strictEqual(redis.status, "wait");

  redis.disconnect();

  return "PASS: Redis URL parsing and option merging work";
};
