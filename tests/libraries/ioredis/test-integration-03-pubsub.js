import assert from "assert";
import Redis from "ioredis";

export const run = async () => {
  const sub = new Redis({ host: "localhost", port: 63790 });
  const pub = new Redis({ host: "localhost", port: 63790 });

  const channel = "wasm_rquickjs_test_pubsub_" + Date.now();
  const expectedMsg = "hello-from-publisher";

  const received = await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("pubsub timed out after 10s")), 10000);

    sub.on("message", (ch, message) => {
      if (ch === channel) {
        clearTimeout(timer);
        resolve(message);
      }
    });

    sub.subscribe(channel).then(() => {
      pub.publish(channel, expectedMsg);
    }).catch(reject);
  });

  assert.strictEqual(received, expectedMsg, "should receive the published message");

  await sub.unsubscribe(channel);
  sub.disconnect();
  pub.disconnect();

  return "PASS: pub/sub message delivery and unsubscribe";
};
