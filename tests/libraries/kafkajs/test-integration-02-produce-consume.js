import assert from "assert";
import { Kafka, logLevel } from "kafkajs";

export const run = async () => {
  const kafka = new Kafka({
    clientId: "integration-test",
    brokers: ["127.0.0.1:9093"],
    logLevel: logLevel.NOTHING,
  });

  const topicName = "test-integration-02";

  // Create topic via admin
  const admin = kafka.admin();
  await admin.connect();
  const existingTopics = await admin.listTopics();
  if (!existingTopics.includes(topicName)) {
    await admin.createTopics({
      topics: [{ topic: topicName, numPartitions: 1, replicationFactor: 1 }],
    });
  }
  await admin.disconnect();

  // Produce a message
  const producer = kafka.producer();
  await producer.connect();

  const testValue = `hello-kafkajs-${Date.now()}`;
  await producer.send({
    topic: topicName,
    messages: [{ key: "test-key", value: testValue }],
  });
  await producer.disconnect();

  // Consume the message back
  const consumer = kafka.consumer({ groupId: `test-group-${Date.now()}` });
  await consumer.connect();
  await consumer.subscribe({ topic: topicName, fromBeginning: true });

  const received = await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error("Timed out waiting for message")), 30000);
    consumer.run({
      eachMessage: async ({ message }) => {
        clearTimeout(timeout);
        resolve(message);
      },
    });
  });

  await consumer.disconnect();

  assert.strictEqual(received.key.toString(), "test-key");
  assert.strictEqual(received.value.toString(), testValue);

  return "PASS: produce and consume a message with content verification";
};
