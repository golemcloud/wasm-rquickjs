import assert from "assert";
import { Kafka, logLevel, CompressionTypes } from "kafkajs";

export const run = () => {
  assert.strictEqual(typeof Kafka, "function");
  assert.strictEqual(typeof logLevel, "object");
  assert.strictEqual(typeof CompressionTypes, "object");

  assert.strictEqual(CompressionTypes.None, 0);
  assert.strictEqual(CompressionTypes.GZIP, 1);
  assert.strictEqual(CompressionTypes.Snappy, 2);
  assert.strictEqual(CompressionTypes.LZ4, 3);
  assert.strictEqual(CompressionTypes.ZSTD, 4);

  const kafka = new Kafka({
    clientId: "library-test",
    brokers: ["localhost:9092"],
    logLevel: logLevel.NOTHING,
  });

  assert.strictEqual(typeof kafka.producer, "function");
  assert.strictEqual(typeof kafka.consumer, "function");
  assert.strictEqual(typeof kafka.admin, "function");

  return "PASS: basic exports, constants, and Kafka construction work";
};
