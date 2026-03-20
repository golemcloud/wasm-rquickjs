import assert from 'assert';
import * as mqttNs from 'mqtt';

const mqtt = mqttNs.default && mqttNs.default.DefaultMessageIdProvider ? mqttNs.default : mqttNs;

export const run = () => {
  const defaultProvider = new mqtt.DefaultMessageIdProvider();
  const first = defaultProvider.allocate();
  const second = defaultProvider.allocate();

  assert.ok(first >= 1 && first <= 65535);
  assert.ok(second >= 1 && second <= 65535);
  assert.notStrictEqual(first, second);
  assert.strictEqual(defaultProvider.getLastAllocated(), second);
  assert.strictEqual(defaultProvider.register(second), true);

  defaultProvider.deallocate(second);
  defaultProvider.clear();

  const uniqueProvider = new mqtt.UniqueMessageIdProvider();
  const uniqueOne = uniqueProvider.allocate();
  assert.ok(uniqueOne >= 1 && uniqueOne <= 65535);

  assert.strictEqual(uniqueProvider.register(uniqueOne), false);
  uniqueProvider.deallocate(uniqueOne);
  assert.strictEqual(uniqueProvider.register(uniqueOne), true);

  uniqueProvider.clear();

  const seen = new Set();
  for (let i = 0; i < 100; i += 1) {
    const id = uniqueProvider.allocate();
    assert.ok(id !== null);
    assert.strictEqual(seen.has(id), false);
    seen.add(id);
  }

  return 'PASS: message id providers allocate/register/deallocate as expected';
};
