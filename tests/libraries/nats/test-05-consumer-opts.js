import assert from "assert";
import {
  AckPolicy,
  DeliverPolicy,
  ReplayPolicy,
  RetentionPolicy,
  StorageType,
  consumerOpts,
} from "nats";

export const run = () => {
  assert.strictEqual(AckPolicy.Explicit, "explicit");
  assert.strictEqual(DeliverPolicy.All, "all");
  assert.strictEqual(ReplayPolicy.Instant, "instant");
  assert.strictEqual(RetentionPolicy.Workqueue, "workqueue");
  assert.strictEqual(StorageType.File, "file");

  const opts = consumerOpts();
  opts.durable("demo-consumer");
  opts.consumerName("demo-consumer");
  opts.deliverAll();
  opts.ackExplicit();
  opts.maxDeliver(4);
  opts.filterSubject("orders.created");
  opts.idleHeartbeat(2_000);

  const built = opts.getOpts();
  assert.strictEqual(built.config.durable_name, "demo-consumer");
  assert.strictEqual(built.config.name, "demo-consumer");
  assert.strictEqual(built.config.deliver_policy, "all");
  assert.strictEqual(built.config.ack_policy, "explicit");
  assert.strictEqual(built.config.max_deliver, 4);
  assert.strictEqual(built.config.filter_subject, "orders.created");
  assert.strictEqual(built.config.idle_heartbeat, 2_000_000_000);

  return "PASS: consumer options builder and public enum constants work";
};
