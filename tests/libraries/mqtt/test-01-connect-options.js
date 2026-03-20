import assert from 'assert';
import * as mqttNs from 'mqtt';

const mqtt = mqttNs.default && mqttNs.default.connect ? mqttNs.default : mqttNs;

export const run = () => {
  const client = mqtt.connect('mqtt://user:pass@example.com:1883?clientId=my-client', {
    manualConnect: true,
    keepalive: 45,
  });

  assert.strictEqual(client.options.username, 'user');
  assert.strictEqual(client.options.password, 'pass');
  assert.strictEqual(client.options.clientId, 'my-client');
  assert.strictEqual(client.options.protocol, 'mqtt');
  assert.strictEqual(client.options.host, 'example.com');
  assert.strictEqual(client.options.port, 1883);
  assert.strictEqual(client.options.keepalive, 45);
  assert.strictEqual(client.options.reconnectPeriod, 1000);
  assert.strictEqual(client.options.clean, true);

  const autoClient = mqtt.connect({
    protocol: 'mqtt',
    host: 'localhost',
    manualConnect: true,
  });
  assert.match(autoClient.options.clientId, /^mqttjs_[0-9a-f]{8}$/);

  return 'PASS: connect option parsing and defaults work';
};
