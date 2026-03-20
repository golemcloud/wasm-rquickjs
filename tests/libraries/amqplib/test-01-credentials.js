import assert from "assert";
import amqplib from "amqplib";

export const run = () => {
  assert.strictEqual(typeof amqplib.connect, "function");
  assert.strictEqual(typeof amqplib.credentials.plain, "function");

  const plain = amqplib.credentials.plain("guest", "secret");
  assert.strictEqual(plain.mechanism, "PLAIN");
  assert.strictEqual(plain.response().toString("utf8"), "\u0000guest\u0000secret");

  const amqplain = amqplib.credentials.amqplain("guest", "secret");
  assert.strictEqual(amqplain.mechanism, "AMQPLAIN");
  assert.ok(Buffer.isBuffer(amqplain.response()));
  assert.ok(amqplain.response().length > 0);

  const external = amqplib.credentials.external();
  assert.strictEqual(external.mechanism, "EXTERNAL");
  assert.strictEqual(external.response().length, 0);

  const err = new amqplib.IllegalOperationError("channel closed");
  assert.ok(err instanceof Error);
  assert.strictEqual(err.name, "IllegalOperationError");
  assert.strictEqual(err.message, "channel closed");

  return "PASS: top-level exports, credentials, and IllegalOperationError work";
};
