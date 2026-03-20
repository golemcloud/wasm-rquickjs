import assert from "assert";
import { Kafka, logLevel } from "kafkajs";

export const run = () => {
  const kafka = new Kafka({
    clientId: "library-test",
    brokers: ["localhost:9092"],
    logLevel: logLevel.NOTHING,
  });

  assert.throws(() => kafka.consumer({}), /groupId/i);

  const producer = kafka.producer();
  const consumer = kafka.consumer({ groupId: "group-1" });
  const admin = kafka.admin();

  assert.strictEqual(typeof producer.connect, "function");
  assert.strictEqual(typeof producer.send, "function");
  assert.strictEqual(typeof producer.disconnect, "function");

  assert.strictEqual(typeof consumer.connect, "function");
  assert.strictEqual(typeof consumer.subscribe, "function");
  assert.strictEqual(typeof consumer.run, "function");

  assert.strictEqual(typeof admin.connect, "function");
  assert.strictEqual(typeof admin.listTopics, "function");
  assert.strictEqual(typeof admin.disconnect, "function");

  return "PASS: producer/consumer/admin creation and groupId validation work";
};
