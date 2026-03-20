import assert from "assert";
import frame from "amqplib/lib/frame.js";

export const run = () => {
  assert.strictEqual(frame.PROTOCOL_HEADER, `AMQP${String.fromCharCode(0, 0, 9, 1)}`);
  assert.ok(Buffer.isBuffer(frame.HEARTBEAT_BUF));

  const payload = Buffer.from("message-body", "utf8");
  const bodyFrame = frame.makeBodyFrame(7, payload);
  const parsed = frame.parseFrame(bodyFrame);

  assert.ok(parsed);
  assert.strictEqual(parsed.channel, 7);
  assert.strictEqual(parsed.size, payload.length);
  assert.deepStrictEqual(parsed.payload, payload);
  assert.strictEqual(parsed.rest.length, 0);

  const decoded = frame.decodeFrame(parsed);
  assert.strictEqual(decoded.channel, 7);
  assert.deepStrictEqual(decoded.content, payload);

  return "PASS: frame encoding/parsing/decoding works for body frames";
};
