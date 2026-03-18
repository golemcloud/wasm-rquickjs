import assert from 'assert';
import client from 'prom-client';

const { Registry, Counter } = client;

export const run = async () => {
  const registry = new Registry();

  const requestsTotal = new Counter({
    name: 'test_requests_total',
    help: 'Total test requests',
    labelNames: ['method', 'status'],
    registers: [registry],
  });

  requestsTotal.inc({ method: 'GET', status: '200' });
  requestsTotal.inc({ method: 'GET', status: '200' }, 2);
  requestsTotal.inc({ method: 'POST', status: '500' }, 4);

  const metric = await requestsTotal.get();
  assert.strictEqual(metric.type, 'counter');

  const getEntry = metric.values.find(
    (v) => v.labels.method === 'GET' && v.labels.status === '200',
  );
  const postEntry = metric.values.find(
    (v) => v.labels.method === 'POST' && v.labels.status === '500',
  );

  assert.ok(getEntry, 'Expected GET/200 label entry');
  assert.ok(postEntry, 'Expected POST/500 label entry');
  assert.strictEqual(getEntry.value, 3);
  assert.strictEqual(postEntry.value, 4);

  const text = await registry.metrics();
  assert.ok(text.includes('test_requests_total{method="GET",status="200"} 3'));
  assert.ok(text.includes('test_requests_total{method="POST",status="500"} 4'));

  return 'PASS: Counter increments and registry exposition work';
};
