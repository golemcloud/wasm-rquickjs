import assert from "assert";
import amqplib from "amqplib";

export const run = async () => {
  const conn = await amqplib.connect("amqp://testuser:testpass@127.0.0.1:56720");
  const ch = await conn.createChannel();

  const qName = "wasm-rquickjs-test-connect";
  const q = await ch.assertQueue(qName, { durable: false, autoDelete: true });
  assert.strictEqual(q.queue, qName);

  await ch.deleteQueue(qName);
  await ch.close();
  await conn.close();

  return "PASS: connect, createChannel, assertQueue, deleteQueue, close";
};
