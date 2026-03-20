import assert from "assert";
import { connect, StringCodec } from "nats";

export const run = async () => {
  const nc = await connect({ servers: "nats://127.0.0.1:4223" });
  const sc = StringCodec();
  const subject = "test.pubsub." + Date.now();

  const sub = nc.subscribe(subject, { max: 1 });

  nc.publish(subject, sc.encode("hello-nats"));
  await nc.flush();

  let received = null;
  const timeout = setTimeout(() => {}, 10000);

  for await (const msg of sub) {
    received = sc.decode(msg.data);
    break;
  }

  clearTimeout(timeout);

  assert.strictEqual(received, "hello-nats", "should receive the published message");

  await nc.drain();

  return "PASS: publish/subscribe with string codec";
};
