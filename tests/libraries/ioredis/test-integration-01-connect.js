import assert from "assert";
import Redis from "ioredis";

export const run = async () => {
  const redis = new Redis({ host: "localhost", port: 63790 });

  const pong = await redis.ping();
  assert.strictEqual(pong, "PONG", "PING should return PONG");

  const key = "wasm_rquickjs_test_connect_" + Date.now();
  await redis.set(key, "hello-wasm");
  const val = await redis.get(key);
  assert.strictEqual(val, "hello-wasm", "GET should return the value we SET");

  await redis.del(key);
  const deleted = await redis.get(key);
  assert.strictEqual(deleted, null, "GET after DEL should return null");

  redis.disconnect();
  return "PASS: connect, PING, SET/GET/DEL round-trip";
};
