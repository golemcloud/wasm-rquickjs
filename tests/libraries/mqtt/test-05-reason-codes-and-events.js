import assert from 'assert';
import { PassThrough } from 'stream';
import * as mqttNs from 'mqtt';

const mqtt = mqttNs.default && mqttNs.default.MqttClient ? mqttNs.default : mqttNs;

export const run = async () => {
  assert.strictEqual(mqtt.ReasonCodes['0'], '');
  assert.strictEqual(mqtt.ReasonCodes['128'], 'Unspecified error');
  assert.strictEqual(typeof mqtt.MQTTJS_VERSION, 'string');
  assert.ok(mqtt.MQTTJS_VERSION.length > 0);

  const duplex = new PassThrough();
  const client = new mqtt.MqttClient(() => duplex, {
    protocol: 'mqtt',
    keepalive: 0,
    reconnectPeriod: 0,
    clientId: 'events-client',
  });

  let closeEventSeen = false;
  client.once('close', () => {
    closeEventSeen = true;
  });

  await new Promise((resolve) => {
    client.end(true, {}, () => resolve());
  });

  assert.strictEqual(closeEventSeen, true);

  return 'PASS: reason code exports and basic client close event work';
};
