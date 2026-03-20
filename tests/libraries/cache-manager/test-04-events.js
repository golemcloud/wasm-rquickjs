import assert from 'assert';
import { createCache } from 'cache-manager';

export const run = async () => {
  const cache = createCache();
  const observed = [];

  const onSet = (payload) => observed.push({ type: 'set', payload });
  const onDel = (payload) => observed.push({ type: 'del', payload });

  cache.on('set', onSet);
  cache.on('del', onDel);

  await cache.set('evt-key', 42);
  await cache.del('evt-key');

  cache.off('set', onSet);
  await cache.set('evt-key', 99);

  const setEvents = observed.filter((event) => event.type === 'set');
  const delEvents = observed.filter((event) => event.type === 'del');

  // cache-manager emits two set events for one successful set:
  // one annotated with store metadata and one generic event.
  assert.strictEqual(setEvents.length, 2);
  assert.strictEqual(setEvents[0].payload.key, 'evt-key');
  assert.strictEqual(setEvents[0].payload.value, 42);
  assert.strictEqual(setEvents[1].payload.key, 'evt-key');
  assert.strictEqual(setEvents[1].payload.value, 42);
  assert.ok('store' in setEvents[0].payload || 'store' in setEvents[1].payload);

  assert.strictEqual(delEvents.length, 1);
  assert.strictEqual(delEvents[0].payload.key, 'evt-key');

  return 'PASS: set/del events emit and off() unsubscribes';
};
