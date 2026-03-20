import assert from "assert";
import { Partitioners } from "kafkajs";

const partitionMetadata = [
  { partitionId: 0, leader: 1 },
  { partitionId: 1, leader: 1 },
  { partitionId: 2, leader: 1 },
];

export const run = () => {
  const defaultPartitioner = Partitioners.DefaultPartitioner();
  const legacyPartitioner = Partitioners.LegacyPartitioner();

  const messageWithKey = { key: Buffer.from("stable-key"), value: "payload" };

  const defaultPartitionA = defaultPartitioner({
    topic: "demo-topic",
    partitionMetadata,
    message: messageWithKey,
  });
  const defaultPartitionB = defaultPartitioner({
    topic: "demo-topic",
    partitionMetadata,
    message: messageWithKey,
  });

  assert.strictEqual(defaultPartitionA, defaultPartitionB);
  assert.ok(defaultPartitionA >= 0 && defaultPartitionA <= 2);

  const legacyPartitionA = legacyPartitioner({
    topic: "demo-topic",
    partitionMetadata,
    message: messageWithKey,
  });
  const legacyPartitionB = legacyPartitioner({
    topic: "demo-topic",
    partitionMetadata,
    message: messageWithKey,
  });

  assert.strictEqual(legacyPartitionA, legacyPartitionB);
  assert.ok(legacyPartitionA >= 0 && legacyPartitionA <= 2);

  const explicitPartition = defaultPartitioner({
    topic: "demo-topic",
    partitionMetadata,
    message: { partition: 2, value: "payload" },
  });

  assert.strictEqual(explicitPartition, 2);

  return "PASS: default and legacy partitioners are deterministic for keyed messages";
};
