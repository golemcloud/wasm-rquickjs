import assert from 'assert';
import client from 'prom-client';

const { Registry, Summary } = client;

export const run = async () => {
  const registry = new Registry();

  const payloadBytes = new Summary({
    name: 'test_payload_size_bytes',
    help: 'Payload size distribution',
    labelNames: ['endpoint'],
    percentiles: [0.5, 0.9],
    maxAgeSeconds: 600,
    ageBuckets: 1,
    registers: [registry],
  });

  payloadBytes.observe({ endpoint: '/items' }, 100);
  payloadBytes.observe({ endpoint: '/items' }, 200);
  payloadBytes.observe({ endpoint: '/items' }, 300);

  const metric = await payloadBytes.get();
  const count = metric.values.find(
    (v) => v.metricName === 'test_payload_size_bytes_count' && v.labels.endpoint === '/items',
  );
  const sum = metric.values.find(
    (v) => v.metricName === 'test_payload_size_bytes_sum' && v.labels.endpoint === '/items',
  );
  const p50 = metric.values.find(
    (v) => v.labels.endpoint === '/items' && v.labels.quantile === 0.5,
  );
  const p90 = metric.values.find(
    (v) => v.labels.endpoint === '/items' && v.labels.quantile === 0.9,
  );

  assert.ok(count, 'Expected summary count metric');
  assert.ok(sum, 'Expected summary sum metric');
  assert.ok(p50, 'Expected p50 summary quantile');
  assert.ok(p90, 'Expected p90 summary quantile');

  assert.strictEqual(count.value, 3);
  assert.strictEqual(sum.value, 600);
  assert.ok(p50.value >= 100 && p50.value <= 300);
  assert.ok(p90.value >= 100 && p90.value <= 300);

  return 'PASS: Summary count/sum/quantile output works';
};
