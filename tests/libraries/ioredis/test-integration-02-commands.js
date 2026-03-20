import assert from "assert";
import Redis from "ioredis";

export const run = async () => {
  const redis = new Redis({ host: "localhost", port: 63790 });
  const pfx = "wasm_rquickjs_test_cmds_" + Date.now() + "_";

  // HSET / HGET / HGETALL
  const hkey = pfx + "hash";
  await redis.hset(hkey, "name", "alice", "age", "30");
  const name = await redis.hget(hkey, "name");
  assert.strictEqual(name, "alice");
  const all = await redis.hgetall(hkey);
  assert.deepStrictEqual(all, { name: "alice", age: "30" });

  // LPUSH / LRANGE
  const lkey = pfx + "list";
  await redis.lpush(lkey, "c", "b", "a");
  const items = await redis.lrange(lkey, 0, -1);
  assert.deepStrictEqual(items, ["a", "b", "c"]);

  // INCR
  const ikey = pfx + "counter";
  await redis.set(ikey, "10");
  const after = await redis.incr(ikey);
  assert.strictEqual(after, 11);

  // EXPIRE / TTL
  await redis.expire(ikey, 300);
  const ttl = await redis.ttl(ikey);
  assert.ok(ttl > 0 && ttl <= 300, `TTL should be in (0,300], got ${ttl}`);

  // Clean up
  await redis.del(hkey, lkey, ikey);

  redis.disconnect();
  return "PASS: HSET/HGET/HGETALL, LPUSH/LRANGE, INCR, EXPIRE/TTL";
};
