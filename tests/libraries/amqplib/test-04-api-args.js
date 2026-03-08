import assert from "assert";
import Args from "amqplib/lib/api_args.js";

export const run = () => {
  const queue = Args.assertQueue("jobs", {
    durable: false,
    exclusive: true,
    messageTtl: 5000,
    deadLetterExchange: "dead",
  });

  assert.strictEqual(queue.queue, "jobs");
  assert.strictEqual(queue.durable, false);
  assert.strictEqual(queue.exclusive, true);
  assert.strictEqual(queue.arguments["x-message-ttl"], 5000);
  assert.strictEqual(queue.arguments["x-dead-letter-exchange"], "dead");

  const publish = Args.publish("amq.direct", "jobs.created", {
    persistent: true,
    contentType: "application/json",
    correlationId: "corr-1",
    headers: { source: "test" },
    CC: ["a", "b"],
  });

  assert.strictEqual(publish.exchange, "amq.direct");
  assert.strictEqual(publish.routingKey, "jobs.created");
  assert.strictEqual(publish.deliveryMode, 2);
  assert.strictEqual(publish.contentType, "application/json");
  assert.strictEqual(publish.correlationId, "corr-1");
  assert.deepStrictEqual(publish.headers.CC, ["a", "b"]);
  assert.strictEqual(publish.headers.source, "test");

  return "PASS: API argument marshalling works for queue and publish options";
};
