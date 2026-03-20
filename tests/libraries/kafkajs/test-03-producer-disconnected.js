import assert from "assert";
import { Kafka, logLevel } from "kafkajs";

export const run = async () => {
  const kafka = new Kafka({
    clientId: "library-test",
    brokers: ["localhost:9092"],
    logLevel: logLevel.NOTHING,
  });

  const producer = kafka.producer();

  await assert.rejects(
    () => producer.send({ topic: "topic-a", messages: [{ value: "hello" }] }),
    /disconnected/i,
  );

  await assert.rejects(
    () => producer.sendBatch({ topicMessages: [{ topic: "topic-a", messages: [{ value: "hello" }] }] }),
    /disconnected/i,
  );

  await assert.rejects(() => producer.transaction(), /transactional id/i);

  return "PASS: producer disconnected checks and transaction validation errors are raised";
};
