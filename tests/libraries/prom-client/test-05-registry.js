import assert from 'assert';
import client from 'prom-client';

const { Registry, Counter } = client;

export const run = async () => {
  const registryA = new Registry();
  const registryB = new Registry();

  registryA.setDefaultLabels({ service: 'orders' });

  const totalA = new Counter({
    name: 'test_registry_a_total',
    help: 'Counter in registry A',
    labelNames: ['route'],
    registers: [registryA],
  });
  const totalB = new Counter({
    name: 'test_registry_b_total',
    help: 'Counter in registry B',
    registers: [registryB],
  });

  totalA.inc({ route: 'checkout' }, 2);
  totalB.inc(5);

  const registryAText = await registryA.metrics();
  assert.ok(registryAText.includes('test_registry_a_total{route="checkout",service="orders"} 2'));

  const merged = Registry.merge([registryA, registryB]);
  const mergedText = await merged.metrics();

  assert.ok(mergedText.includes('test_registry_a_total{route="checkout"} 2'));
  assert.ok(mergedText.includes('test_registry_b_total 5'));

  const duplicateRegistry = new Registry();
  new Counter({
    name: 'test_registry_a_total',
    help: 'Duplicate metric name',
    registers: [duplicateRegistry],
  }).inc(1);

  assert.throws(() => {
    Registry.merge([registryA, duplicateRegistry]);
  }, /already been registered|already registered|metric with the same name|already exists/i);

  return 'PASS: Registry default labels and merge conflict handling work';
};
