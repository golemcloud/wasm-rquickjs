import assert from 'assert';
import * as mqttNs from 'mqtt';

const mqtt = mqttNs.default && mqttNs.default.Store ? mqttNs.default : mqttNs;

const putAsync = (store, packet) =>
  new Promise((resolve, reject) => {
    store.put(packet, (err) => (err ? reject(err) : resolve()));
  });

const getAsync = (store, query) =>
  new Promise((resolve, reject) => {
    store.get(query, (err, packet) => (err ? reject(err) : resolve(packet)));
  });

const delAsync = (store, query) =>
  new Promise((resolve, reject) => {
    store.del(query, (err, packet) => (err ? reject(err) : resolve(packet)));
  });

const closeAsync = (store) =>
  new Promise((resolve, reject) => {
    store.close((err) => (err ? reject(err) : resolve()));
  });

const readAllFromStream = (store) =>
  new Promise((resolve, reject) => {
    const stream = store.createStream();
    const packets = [];

    stream.on('data', (packet) => packets.push(packet));
    stream.on('error', reject);
    stream.on('end', () => resolve(packets));
  });

export const run = async () => {
  const store = new mqtt.Store();
  const packet = {
    cmd: 'publish',
    messageId: 7,
    topic: 'offline/topic',
    payload: Buffer.from('hello'),
    qos: 1,
  };

  await putAsync(store, packet);

  const fetched = await getAsync(store, { messageId: 7 });
  assert.strictEqual(fetched.topic, 'offline/topic');
  assert.strictEqual(fetched.payload.toString(), 'hello');

  const streamPackets = await readAllFromStream(store);
  assert.strictEqual(streamPackets.length, 1);
  assert.strictEqual(streamPackets[0].messageId, 7);

  const deleted = await delAsync(store, { messageId: 7 });
  assert.strictEqual(deleted.messageId, 7);

  await assert.rejects(
    () => getAsync(store, { messageId: 7 }),
    /missing packet/
  );

  await closeAsync(store);

  return 'PASS: in-memory Store put/get/del/createStream works';
};
