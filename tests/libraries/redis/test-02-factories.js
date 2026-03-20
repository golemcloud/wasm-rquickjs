import assert from "assert";
import redisModule from "redis";

const redis = redisModule.default ?? redisModule;

export const run = () => {
  const client = redis.createClient({
    url: "redis://localhost:6379/2",
    pingInterval: 5000,
    socket: { reconnectStrategy: false },
  });
  assert.strictEqual(typeof client.connect, "function");
  assert.strictEqual(typeof client.sendCommand, "function");
  assert.strictEqual(client.isOpen, false);
  assert.strictEqual(client.isReady, false);

  const duplicate = client.duplicate({ database: 5 });
  assert.strictEqual(typeof duplicate.connect, "function");
  assert.strictEqual(duplicate.isOpen, false);

  const pool = redis.createClientPool(
    { url: "redis://localhost:6379", socket: { reconnectStrategy: false } },
    { minimum: 1, maximum: 2, acquireTimeout: 100 }
  );
  assert.strictEqual(typeof pool.execute, "function");
  assert.strictEqual(typeof pool.sendCommand, "function");

  const cluster = redis.createCluster({
    rootNodes: [{ url: "redis://localhost:7000" }],
    defaults: { socket: { reconnectStrategy: false } },
  });
  assert.strictEqual(typeof cluster.connect, "function");
  assert.strictEqual(typeof cluster.sendCommand, "function");

  const sentinel = redis.createSentinel({
    name: "mymaster",
    sentinelRootNodes: [{ host: "127.0.0.1", port: 26379 }],
    nodeClientOptions: { socket: { reconnectStrategy: false } },
  });
  assert.strictEqual(typeof sentinel.connect, "function");
  assert.strictEqual(typeof sentinel.sendCommand, "function");

  return "PASS: redis client, pool, cluster, and sentinel factories construct offline objects";
};
