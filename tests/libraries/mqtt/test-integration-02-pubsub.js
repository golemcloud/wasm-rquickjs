import assert from 'assert';
import * as mqttNs from 'mqtt';

const mqtt = mqttNs.default && mqttNs.default.connectAsync ? mqttNs.default : mqttNs;

export const run = async () => {
  const client = await mqtt.connectAsync('mqtt://127.0.0.1:1884');
  const topic = 'wasm-rquickjs/test/' + Date.now();
  const payload = 'hello from wasm-rquickjs';

  try {
    await client.subscribeAsync(topic);

    const received = new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('timed out waiting for message')), 10000);
      client.on('message', (t, msg) => {
        if (t === topic) {
          clearTimeout(timer);
          resolve(msg.toString());
        }
      });
    });

    await client.publishAsync(topic, payload);

    const msg = await received;
    assert.strictEqual(msg, payload, 'received message should match published payload');

    await client.unsubscribeAsync(topic);
  } finally {
    await client.endAsync();
  }

  return 'PASS: publish/subscribe round-trip verified';
};
