import assert from "assert";
import Redis from "ioredis";

export const run = () => {
  const redis = new Redis({
    lazyConnect: true,
    enableReadyCheck: false,
  });

  redis.defineCommand("sumTwo", {
    numberOfKeys: 2,
    lua: "return tonumber(redis.call('get', KEYS[1])) + tonumber(redis.call('get', KEYS[2]))",
  });

  assert.strictEqual(typeof redis.sumTwo, "function");
  assert.strictEqual(typeof redis.sumTwoBuffer, "function");

  const builtinGet = redis.createBuiltinCommand("get");
  assert.strictEqual(typeof builtinGet, "object");
  assert.strictEqual(typeof builtinGet.string, "function");
  assert.strictEqual(typeof builtinGet.buffer, "function");

  redis.disconnect();

  return "PASS: defineCommand and createBuiltinCommand register callable helpers";
};
