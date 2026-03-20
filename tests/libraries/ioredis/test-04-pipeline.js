import assert from "assert";
import Redis from "ioredis";

export const run = () => {
  const redis = new Redis({
    lazyConnect: true,
    enableReadyCheck: false,
  });

  const pipeline = redis.pipeline();
  pipeline.set("counter", "1");
  pipeline.incr("counter");
  pipeline.get("counter");

  assert.strictEqual(pipeline.length, 3);
  assert.strictEqual(pipeline._queue.length, 3);
  assert.strictEqual(pipeline._queue[0].name, "set");
  assert.strictEqual(pipeline._queue[1].name, "incr");
  assert.strictEqual(pipeline._queue[2].name, "get");

  redis.disconnect();

  return "PASS: Pipeline queues commands without requiring a live Redis server";
};
