import assert from "assert";
import Redis from "ioredis";

export const run = () => {
  const redis = new Redis({
    lazyConnect: true,
    enableReadyCheck: false,
    maxRetriesPerRequest: 1,
  });

  assert.strictEqual(redis.status, "wait");

  const commands = redis.getBuiltinCommands();
  assert.ok(commands.includes("get"));
  assert.ok(commands.includes("set"));
  assert.ok(commands.includes("hgetall"));

  redis.disconnect();

  return "PASS: Redis client can be created in lazy mode and exposes builtin commands";
};
