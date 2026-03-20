import assert from 'assert';
import * as mqttNs from 'mqtt';

const mqtt = mqttNs.default && mqttNs.default.connectAsync ? mqttNs.default : mqttNs;

export const run = async () => {
  const client = await mqtt.connectAsync('mqtt://127.0.0.1:1884');

  try {
    assert.strictEqual(client.connected, true, 'client should be connected');
    assert.strictEqual(client.disconnecting, false, 'client should not be disconnecting');
    assert.strictEqual(client.options.protocol, 'mqtt');
    assert.strictEqual(client.options.port, 1884);
  } finally {
    await client.endAsync();
  }

  assert.strictEqual(client.connected, false, 'client should be disconnected after end()');

  return 'PASS: connected to Mosquitto broker and verified state';
};
