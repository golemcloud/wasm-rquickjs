import assert from "assert";
import redisModule from "redis";

const redis = redisModule.default ?? redisModule;

export const run = () => {
  assert.strictEqual(typeof redis.createClient, "function");
  assert.strictEqual(typeof redis.createClientPool, "function");
  assert.strictEqual(typeof redis.createCluster, "function");
  assert.strictEqual(typeof redis.createSentinel, "function");

  assert.strictEqual(typeof redis.RESP_TYPES, "object");
  assert.strictEqual(redis.RESP_TYPES.SIMPLE_STRING, 43);
  assert.strictEqual(redis.RESP_TYPES.BLOB_STRING, 36);
  assert.strictEqual(redis.RESP_TYPES.ARRAY, 42);

  return "PASS: redis exports core client factories and RESP constants";
};
