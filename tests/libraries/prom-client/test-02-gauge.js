import assert from 'assert';
import client from 'prom-client';

const { Registry, Gauge } = client;

export const run = async () => {
  const registry = new Registry();

  const queueDepth = new Gauge({
    name: 'test_queue_depth',
    help: 'Queue depth by queue name',
    labelNames: ['queue'],
    registers: [registry],
  });

  queueDepth.set({ queue: 'default' }, 10);
  queueDepth.inc({ queue: 'default' }, 3);
  queueDepth.dec({ queue: 'default' }, 2);
  queueDepth.labels('priority').set(7);

  const nowBefore = Math.floor(Date.now() / 1000);
  queueDepth.labels('clock').setToCurrentTime();
  const nowAfter = Math.floor(Date.now() / 1000);

  const metric = await queueDepth.get();
  const defaultEntry = metric.values.find((v) => v.labels.queue === 'default');
  const priorityEntry = metric.values.find((v) => v.labels.queue === 'priority');
  const clockEntry = metric.values.find((v) => v.labels.queue === 'clock');

  assert.ok(defaultEntry, 'Expected default queue entry');
  assert.ok(priorityEntry, 'Expected priority queue entry');
  assert.ok(clockEntry, 'Expected clock queue entry');

  assert.strictEqual(defaultEntry.value, 11);
  assert.strictEqual(priorityEntry.value, 7);
  assert.ok(clockEntry.value >= nowBefore && clockEntry.value <= nowAfter + 1);

  return 'PASS: Gauge set/inc/dec/labels/setToCurrentTime behavior works';
};
