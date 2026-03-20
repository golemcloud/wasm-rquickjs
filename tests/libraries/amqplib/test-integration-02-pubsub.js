import assert from "assert";
import amqplib from "amqplib";

export const run = async () => {
  const conn = await amqplib.connect("amqp://testuser:testpass@127.0.0.1:56720");
  const ch = await conn.createChannel();

  const qName = "wasm-rquickjs-test-pubsub";
  await ch.assertQueue(qName, { durable: false, autoDelete: true });

  const payload = JSON.stringify({ hello: "world", ts: Date.now() });
  ch.sendToQueue(qName, Buffer.from(payload));

  const received = await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("consume timed out")), 10000);
    ch.consume(qName, (msg) => {
      clearTimeout(timer);
      resolve(msg);
    }, { noAck: false });
  });

  assert.ok(received, "expected a message");
  assert.strictEqual(received.content.toString(), payload);
  ch.ack(received);

  await ch.deleteQueue(qName);
  await ch.close();
  await conn.close();

  return "PASS: publish and consume round-trip with ack";
};
