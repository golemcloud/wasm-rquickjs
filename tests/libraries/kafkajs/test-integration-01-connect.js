import assert from "assert";
import { Kafka, logLevel } from "kafkajs";

export const run = async () => {
  const kafka = new Kafka({
    clientId: "integration-test",
    brokers: ["127.0.0.1:9093"],
    logLevel: logLevel.NOTHING,
  });

  const admin = kafka.admin();
  await admin.connect();

  const topics = await admin.listTopics();
  assert.ok(Array.isArray(topics), "listTopics should return an array");

  await admin.disconnect();

  return "PASS: admin connect, listTopics, and disconnect work";
};
